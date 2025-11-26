// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const http = require('http');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const OpenAI = require('openai');
const Question = require('./models/question');

// Port configuration - uses Render's PORT environment variable or defaults to 3000
const PORT = process.env.PORT || 3000;

// MongoDB connection string - uses environment variable
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatgpt_analysis';

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// express app
const app = express();

// Create HTTP server (needed for WebSocket)
const server = http.createServer(app);

// Connect to MongoDB - but don't start server here yet
mongoose.connect(dbURI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// register view engine
app.set('view engine', 'ejs');

// middleware & static files
app.use(express.static('public'));

app.use((req, res, next) => {
  console.log('new request made:');
  console.log('host: ', req.hostname);
  console.log('path: ', req.path);
  console.log('method: ', req.method);
  next();
});

function validateAddParams(req, res, next) {
  if (!req.query.a || !req.query.b) {
    return res.status(400).json({ error: "Both a and b are required" });
  }
  next();
}

app.use(morgan('dev'));

app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

app.use(express.urlencoded({ extended: true }));

app.post('/test', (req, res) => {
  console.log('Form data received:', req.body);
  res.send('Data logged to console');
});

app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

app.get('/education', (req, res) => {
  res.render('education', { title: 'Education' });
});

app.get('/experience', (req, res) => {
  res.render('experience', { title: 'Experience' });
});

app.get('/project', (req, res) => {
  res.render('project', { title: 'Project' });
});

app.get('/results', (req, res) => {
  res.render('results', { title: 'Results' });
});

app.get('/api/add', validateAddParams, (req, res,) => {
  let numA = parseInt(req.query.a);
  let numB = parseInt(req.query.b);
  let result = numA + numB;
  res.json({"result" : result});
});

app.get('/api/import-questions', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const dataDir = path.join(__dirname, 'data');
    const files = ['computer_security_questions.json', 'prehistory_questions.json', 'sociology_questions.json'];
    
    let totalImported = 0;
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      for (const item of data) {
        const exists = await Question.findOne({ question: item.question });
        if (!exists) {
          await Question.create(item);
          totalImported++;
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: `Imported ${totalImported} questions into MongoDB`,
      total: await Question.countDocuments()
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/questions/:domain', async (req, res) => {
  try {
    const questions = await Question.find({ domain: req.params.domain });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function validateProcessRequest(req, res, next) {
  const { domain, limit } = req.query;
  
  if (domain && !['Computer Security', 'Prehistory', 'Sociology'].includes(domain)) {
    return res.status(400).json({ 
      error: "Invalid domain. Must be 'Computer Security', 'Prehistory', or 'Sociology'" 
    });
  }
  
  if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
    return res.status(400).json({ 
      error: "Invalid limit. Must be between 1 and 100" 
    });
  }
  
  next();
}

app.get('/api/clear-database', async (req, res) => {

  const Question = require('./models/question');  
  
    try {
      await Question.deleteMany({});
      
      res.json({success: true, message: 'Database cleared!'});

    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
})

app.get('/api/process-questions', validateProcessRequest, async (req, res) => {
  try {
    const { domain, limit = 10 } = req.query;
    
    const query = { processed: false };
    if (domain) query.domain = domain;
    
    const questions = await Question.find(query).limit(parseInt(limit));
    
    if (questions.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No unprocessed questions found',
        processed: 0 
      });
    }
    
    let processedCount = 0;
    
    // Process each question
    for (const question of questions) {
      const startTime = Date.now();
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a knowledgeable assistant. Provide concise, accurate answers."
            },
            {
              role: "user",
              content: question.question
            }
          ],
          max_tokens: 150
        });
        
        const responseTime = Date.now() - startTime;
        const chatgptResponse = completion.choices[0].message.content;
        
        // Simple accuracy check: case-insensitive comparison
        const isCorrect = chatgptResponse.toLowerCase().includes(question.expected_answer.toLowerCase());
        
        // Update question in database
        question.chatgpt_response = chatgptResponse;
        question.response_time_ms = responseTime;
        question.is_correct = isCorrect;
        question.processed = true;
        question.processed_at = new Date();
        await question.save();
        
        processedCount++;
        
        broadcastToClients({
          type: 'progress',
          current: processedCount,
          total: questions.length,
          question: question.question,
          response: chatgptResponse,
          responseTime: responseTime
        });
        
      } catch (apiError) {
        console.error(`Error processing question ${question._id}:`, apiError.message);
        broadcastToClients({
          type: 'error',
          question: question.question,
          error: apiError.message
        });
      }
    }
    
    res.json({
      success: true,
      processed: processedCount,
      total: questions.length
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/results', async (req, res) => {
  try {
    const allQuestions = await Question.find({ processed: true });
    
    if (allQuestions.length === 0) {
      return res.json({
        message: 'No processed questions found',
        total_processed: 0
      });
    }
    
    const totalProcessed = allQuestions.length;
    const totalCorrect = allQuestions.filter(q => q.is_correct).length;
    const overallAccuracy = (totalCorrect / totalProcessed) * 100;
    const avgResponseTime = allQuestions.reduce((sum, q) => sum + (q.response_time_ms || 0), 0) / totalProcessed;
    
    // Group by domain
    const byDomain = {};
    allQuestions.forEach(q => {
      if (!byDomain[q.domain]) {
        byDomain[q.domain] = {
          count: 0,
          correct: 0,
          accuracy: 0,
          avg_response_time: 0,
          total_time: 0
        };
      }
      byDomain[q.domain].count++;
      byDomain[q.domain].total_time += q.response_time_ms || 0;
      if (q.is_correct) {
        byDomain[q.domain].correct++;
      }
    });
    
    Object.keys(byDomain).forEach(domain => {
      byDomain[domain].avg_response_time = Math.round(byDomain[domain].total_time / byDomain[domain].count);
      byDomain[domain].accuracy = Math.round((byDomain[domain].correct / byDomain[domain].count) * 100);
      delete byDomain[domain].total_time;
    });
    
    res.json({
      total_processed: totalProcessed,
      total_correct: totalCorrect,
      overall_accuracy: Math.round(overallAccuracy),
      avg_response_time_ms: Math.round(avgResponseTime),
      by_domain: byDomain,
      oldest_processed: allQuestions[0].processed_at,
      newest_processed: allQuestions[allQuestions.length - 1].processed_at
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// server is already created at the top of the file
const wss = new WebSocket.Server({ server });

function broadcastToClients(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('✅ Client connected');
  
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to ChatGPT Analysis Server'
  }));
  
  ws.on('message', function (data) {
    console.log('📩 Received:', data.toString());
    
    // Echo back to client
    ws.send(JSON.stringify({
      type: 'echo',
      message: 'Server received: ' + data.toString()
    }));
  });
  
  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('⚠️ WebSocket error:', error);
  });
});

console.log("🔌 WebSocket server initialized");

// 404 page - MUST be last route
app.use((req, res) => {
  res.status(404).render('404', { title: '404' });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
