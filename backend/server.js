require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const path = require('path');

const User = require('./src/models/User');
const Interview = require('./src/models/Interview');

const app = express();
const httpServer = createServer(app);

// Add logging middleware to see incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'a_very_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // If there's no token, return unauthorized

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.sendStatus(403); // If token is not valid, return forbidden
    req.user = user; // Attach user payload to the request object
    next(); // Proceed to the next middleware or route handler
  });
};

// Google OAuth strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'candidate'
      });
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Auth Routes
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, role } = req.body;
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, name, email } = payload;

    // Find or create user
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({
        googleId,
        name,
        email,
        role: role || 'candidate'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get all candidates
app.get('/api/candidates', verifyToken, async (req, res) => {
  try {
    // Optional: Restrict this endpoint to interviewers if needed
    // if (req.user.role !== 'interviewer') {
    //    return res.status(403).json({ message: 'Only interviewers can view candidates' });
    // }

    const candidates = await User.find({ role: 'candidate' }).select('_id name email');
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ message: 'Failed to fetch candidates' });
  }
});

// Interview Scheduling Endpoint
app.post('/api/interviews', verifyToken, async (req, res) => {
  try {
    const { candidateId, position, scheduledTime, title, duration, status } = req.body;

    // Basic validation
    if (!candidateId || !position || !scheduledTime) {
      return res.status(400).json({ message: 'Missing required interview details' });
    }

    // Check if the candidate exists
    const candidate = await User.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if the scheduled time is in the future
    const interviewTime = new Date(scheduledTime);
    if (interviewTime <= new Date()) {
      return res.status(400).json({ message: 'Interview must be scheduled for a future time' });
    }

    const newInterview = new Interview({
      candidate: candidateId,
      interviewer: req.user.userId,
      position,
      scheduledTime: interviewTime,
      title: title || `Interview for ${position}`,
      duration: duration || 60,
      status: status || 'scheduled'
    });

    await newInterview.save();

    // Add interview reference to both interviewer and candidate
    await User.findByIdAndUpdate(req.user.userId, { $push: { interviews: newInterview._id } });
    await User.findByIdAndUpdate(candidateId, { $push: { interviews: newInterview._id } });

    res.status(201).json({ message: 'Interview scheduled successfully', interview: newInterview });

  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ message: 'Failed to schedule interview', error: error.message });
  }
});

// Get Interview Details
app.get('/api/interviews/:interviewId', verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId)
      .populate('candidate', 'name email')
      .populate('interviewer', 'name email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if the user is either the interviewer or candidate
    if (interview.interviewer._id.toString() !== req.user.userId && 
        interview.candidate._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to view this interview' });
    }

    res.json(interview);
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ message: 'Failed to fetch interview details' });
  }
});

// Reschedule Interview
app.patch('/api/interviews/:interviewId/reschedule', verifyToken, async (req, res) => {
  try {
    const { scheduledTime, duration } = req.body;
    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if the user is the interviewer
    if (interview.interviewer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the interviewer can reschedule the interview' });
    }

    // Check if the interview is already completed or cancelled
    if (interview.status === 'completed' || interview.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot reschedule a completed or cancelled interview' });
    }

    // Validate new scheduled time
    const newTime = new Date(scheduledTime);
    if (newTime <= new Date()) {
      return res.status(400).json({ message: 'New interview time must be in the future' });
    }

    // Update interview
    interview.scheduledTime = newTime;
    if (duration) interview.duration = duration;
    interview.status = 'scheduled'; // Reset status to scheduled

    await interview.save();
    res.json({ message: 'Interview rescheduled successfully', interview });
  } catch (error) {
    console.error('Error rescheduling interview:', error);
    res.status(500).json({ message: 'Failed to reschedule interview' });
  }
});

// Cancel Interview
app.patch('/api/interviews/:interviewId/cancel', verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if the user is either the interviewer or candidate
    if (interview.interviewer.toString() !== req.user.userId && 
        interview.candidate.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this interview' });
    }

    // Check if the interview is already completed or cancelled
    if (interview.status === 'completed' || interview.status === 'cancelled') {
      return res.status(400).json({ message: 'Interview is already completed or cancelled' });
    }

    interview.status = 'cancelled';
    await interview.save();
    res.json({ message: 'Interview cancelled successfully', interview });
  } catch (error) {
    console.error('Error cancelling interview:', error);
    res.status(500).json({ message: 'Failed to cancel interview' });
  }
});

// Get User's Interviews
app.get('/api/interviews', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const interviews = await Interview.find({
      $or: [
        { interviewer: req.user.userId },
        { candidate: req.user.userId }
      ]
    })
    .populate('candidate', 'name email')
    .populate('interviewer', 'name email')
    .sort({ scheduledTime: 1 });

    res.json(interviews);
  } catch (error) {
    console.error('Error fetching user interviews:', error);
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/koder', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Judge0 code execution
const JUDGE0_BASE_URL = 'https://judge0-ce.p.rapidapi.com/submissions';
const executeCode = async (language, sourceCode) => {
  const languageMap = {
    cpp: 54,
    python: 71,
    java: 62,
    javascript: 63,
    c: 50,
    go: 60,
    ruby: 72,
    swift: 83,
    kotlin: 78,
    rust: 73
  };

  const languageId = languageMap[language.toLowerCase()];
  if (!languageId) {
    return { error: true, output: `Language ${language} not supported.` };
  }

  try {
    const submissionRes = await axios.post(
      `${JUDGE0_BASE_URL}?base64_encoded=false&wait=true`,
      {
        language_id: languageId,
        source_code: sourceCode
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY
        }
      }
    );

    const output = submissionRes.data.stdout || submissionRes.data.stderr || 'No output';
    return { error: false, output };
  } catch (err) {
    return {
      error: true,
      output: err.response?.data?.message || err.message || 'Execution failed'
    };
  }
};

// REST API route for code execution
app.post('/api/run', async (req, res) => {
  const { language, code } = req.body;
  if (!language || !code) {
    return res.status(400).json({ error: true, output: 'Missing language or code' });
  }
  const result = await executeCode(language, code);
  res.json(result);
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  socket.on('joinInterview', (interviewId) => {
    console.log(`👥 Socket ${socket.id} joined room: ${interviewId}`);
    socket.join(interviewId);
  });

  socket.on('codeUpdate', (data) => {
    socket.to(data.interviewId).emit('codeUpdate', data);
  });

  socket.on('timerUpdate', (data) => {
    socket.to(data.interviewId).emit('timerUpdate', data);
  });

  socket.on('executeCode', async (data) => {
    const { language, code } = data;
    const result = await executeCode(language, code);
    socket.emit('codeOutput', result);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Interviewer Dashboard API endpoints
// Fetch interviews for the logged-in interviewer
app.get('/api/interviewer/interviews', verifyToken, async (req, res) => {
  try {
    console.log('Handling /api/interviewer/interviews request'); // Log inside the handler
    const interviewerId = req.user.userId;
    const interviews = await Interview.find({ interviewer: interviewerId })
      .populate('candidate', 'name email') // Populate candidate details
      .sort('scheduledTime'); // Sort by scheduled time
    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interviewer interviews:', error);
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
});

// Fetch statistics for the logged-in interviewer
app.get('/api/interviewer/stats', verifyToken, async (req, res) => {
  try {
    console.log('Handling /api/interviewer/stats request'); // Log inside the handler
    const interviewerId = req.user.userId;

    const totalInterviews = await Interview.countDocuments({ interviewer: interviewerId });
    const completedInterviews = await Interview.countDocuments({ interviewer: interviewerId, status: 'completed' });
    const pendingInterviews = await Interview.countDocuments({ interviewer: interviewerId, status: 'scheduled' });

    // Calculate average rating (assuming rating is stored in feedback.rating and is a number)
    const interviewsWithRating = await Interview.find({ interviewer: interviewerId, 'feedback.rating': { $exists: true, $ne: null } });
    const totalRating = interviewsWithRating.reduce((sum, interview) => sum + interview.feedback.rating, 0);
    const averageRating = interviewsWithRating.length > 0 ? (totalRating / interviewsWithRating.length).toFixed(1) : 0;

    res.json({
      totalInterviews,
      completedInterviews,
      pendingInterviews,
      averageRating: parseFloat(averageRating) // Ensure average rating is a number
    });
  } catch (error) {
    console.error('Error fetching interviewer stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Koder API!' });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Add static file serving and catch-all route AFTER all API routes
// ** IMPORTANT: Adjust the path 'path/to/your/frontend/build' to your actual frontend build directory **
// ** This assumes your frontend build output is in a directory named 'build' or similar within the backend directory **
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist'))); // Common path for Vite/React build

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html')); // Common path for Vite/React build
});
