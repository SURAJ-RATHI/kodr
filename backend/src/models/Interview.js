const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  code: {
    content: String,
    language: {
      type: String,
      default: 'javascript'
    }
  },
  timer: {
    startTime: Date,
    elapsedSeconds: {
      type: Number,
      default: 0
    },
    duration: Number,
    isRunning: {
      type: Boolean,
      default: false
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  },
  candidateName: {
    type: String,
    required: true
  },
  candidateEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  position: {
    type: String,
    required: false
  },
  interviewerEmail: {
    type: String,
    required: true
  },
  passcode: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview; 