const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
  question: {
    type: String,
    required: true
  },
  expected_answer: {
    type: String,
    required: true
  },
  chatgpt_response: {
    type: String,
    default: ''
  },
  domain: {
    type: String,
    required: true
  },
  response_time_ms: {
    type: Number,
    default: null
  },
  is_correct: {
    type: Boolean,
    default: null
  },
  processed: {
    type: Boolean,
    default: false
  },
  processed_at: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
