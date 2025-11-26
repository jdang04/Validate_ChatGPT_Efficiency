
// Importing modules
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

//Server setup
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server })

// WebSocket feature part ////////////////////////////////////////
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify({
        from: 'server', 
        text: 'Welcome! Type a message and hit Send.',
    }));

    ws.on('message', (data) => {
        const text = data.toString();
        console.log('Received from client:', text);
        
        ws.send(JSON.stringify({
            from: 'server',
            text: `You said: "${text}"`,
        }));
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
//////////////////////////////////////////////////////////////////

function validateNumbers(req, res, next) {
    const {a, b} = req.query; 

    if (a === undefined || b === undefined) {
        return res.status(400).json({
            error: 'Missing query parameters. Please provide a and b.'
        })
    }

    const numA = Number(a);
    const numB = Number(b); 

    if (isNaN(numA) || isNaN(numB)) {
        return res.status(400).json({
            error: 'a and b must be valid numbers.'
        })
    }

    req.numA = numA;
    req.numB = numB;

    next();
}

app.use('/api/add', validateNumbers);

app.get('/', (req, res) => {
    res.render('Homepage', );
});


app.get('/api/add', (req, res) => {
    const result = req.numA + req.numB;
    res.json({
        a: req.numA,
        b: req.numB,
        result: result
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

