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
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

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
    origin: true, // Allow all origins
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors()); // Allow all origins for testing
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
      console.log('Creating user with:', {
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'candidate'
      });
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
    console.log('Google payload:', payload); // Debug: print the payload
    // Robust fallback for name
    const { sub: googleId, name, given_name, family_name, email, picture } = payload;
    const finalName = name || ((given_name && family_name) ? `${given_name} ${family_name}` : given_name || email || "Unknown");
    console.log('Creating user with:', {
      googleId,
      name: finalName,
      email,
      picture,
      role: role || 'candidate'
    });
    // Find or create user
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({
        googleId,
        name: finalName,
        email,
        picture,
        role: role || 'candidate'
      });
    } else if (role && user.role !== role) {
      // Update role if provided and different
      user.role = role;
      await user.save();
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

// =================================================================================================
// Email Service (integrated directly to avoid file issues)
// =================================================================================================
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendInterviewScheduledEmail = async (interview) => {
  const { candidateEmail, candidateName, interviewerEmail, title, position, scheduledTime, passcode } = interview;
  const formattedDate = new Date(scheduledTime).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
  const interviewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/interview/${interview._id}`;
  const commonEmailBody = `
    <p>This is a confirmation that the following interview has been scheduled:</p>
    <ul>
      <li><strong>Title:</strong> ${title}</li>
      <li><strong>Position:</strong> ${position}</li>
      <li><strong>Date & Time:</strong> ${formattedDate}</li>
    </ul>
    <p>Please use the following details to join the session:</p>
    <p><strong>Interview Link:</strong> <a href="${interviewUrl}">${interviewUrl}</a></p>
    <p><strong>Passcode:</strong> ${passcode}</p>
    <br/><p>Thank you,</p><p>The Koder Team</p>
  `;
  const candidateMailOptions = {
    from: process.env.EMAIL_FROM,
    to: candidateEmail,
    subject: `Interview Scheduled: ${title}`,
    html: `<h2>Hello ${candidateName},</h2>${commonEmailBody}`,
  };
  const interviewerMailOptions = {
    from: process.env.EMAIL_FROM,
    to: interviewerEmail,
    subject: `You have scheduled an interview: ${title}`,
    html: `<h2>Hello,</h2><p>You have successfully scheduled an interview with ${candidateName}.</p>${commonEmailBody}`,
  };
  try {
    await Promise.all([
      transporter.sendMail(candidateMailOptions),
      transporter.sendMail(interviewerMailOptions)
    ]);
    console.log('✅ Interview notification emails sent successfully.');
  } catch (error) {
    console.error('❌ Error sending interview emails:', error);
    // Do not re-throw, as this is a background task
  }
};
// =================================================================================================

// Interview Scheduling Endpoint
app.post('/api/interviews', verifyToken, async (req, res) => {
  try {
    const { candidateId, candidateName, candidateEmail, position, scheduledTime, title, duration, status, interviewerEmail } = req.body;

    // Basic validation - now candidateName and candidateEmail are required instead of candidateId
    if (!candidateName || !candidateEmail || !position || !scheduledTime) {
      return res.status(400).json({ message: 'Missing required interview details: candidate name, email, position, and scheduled time are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidateEmail)) {
      return res.status(400).json({ message: 'Invalid candidate email format' });
    }

    let candidate = null;
    let candidateIdToUse = null;

    // If candidateId is provided, verify the candidate exists
    if (candidateId) {
      candidate = await User.findById(candidateId);
      if (!candidate) {
        return res.status(404).json({ message: 'Selected candidate not found' });
      }
      candidateIdToUse = candidateId;
    } else {
      // Check if a user with this email already exists
      candidate = await User.findOne({ email: candidateEmail });
      if (candidate) {
        candidateIdToUse = candidate._id;
      }
      // If no existing user, we'll create the interview without linking to a user
    }

    // If interviewerEmail is provided, find the interviewer by email
    let interviewerId = req.user.userId;
    let interviewerEmailToSave = interviewerEmail;
    if (interviewerEmail) {
      const interviewerUser = await User.findOne({ email: interviewerEmail });
      if (!interviewerUser) {
        return res.status(404).json({ message: 'Interviewer not found for provided email' });
      }
      interviewerId = interviewerUser._id;
      interviewerEmailToSave = interviewerUser.email;
    } else {
      // Use current user's email if not provided
      const currentUser = await User.findById(req.user.userId);
      interviewerEmailToSave = currentUser.email;
    }

    // Check if the scheduled time is in the future
    const interviewTime = new Date(scheduledTime);
    if (interviewTime <= new Date()) {
      return res.status(400).json({ message: 'Interview must be scheduled for a future time' });
    }

    const passcode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const newInterview = new Interview({
      candidate: candidateIdToUse,
      candidateName: candidateName,
      candidateEmail: candidateEmail,
      interviewer: interviewerId,
      interviewerEmail: interviewerEmailToSave,
      position,
      scheduledTime: interviewTime,
      title: title || `Interview for ${position}`,
      duration: duration || 60,
      status: status || 'scheduled',
      passcode,
    });

    await newInterview.save();
    
    // Asynchronously send emails, don't block the response
    sendInterviewScheduledEmail(newInterview).catch(err => {
      console.error("Async email sending failed:", err);
    });

    // Add interview reference to interviewer
    await User.findByIdAndUpdate(interviewerId, { $push: { interviews: newInterview._id } });
    
    // Add interview reference to candidate if they exist in the system
    if (candidateIdToUse) {
      await User.findByIdAndUpdate(candidateIdToUse, { $push: { interviews: newInterview._id } });
    }

    res.status(201).json({ 
      message: 'Interview scheduled successfully', 
      interview: newInterview,
      candidateExists: !!candidateIdToUse
    });

  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ message: 'Failed to schedule interview', error: error.message });
  }
});

// Get Interview Details
app.get('/api/interviews/:interviewId', verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId)
      .populate('interviewer', 'name email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if the user is either the interviewer or candidate
    const isInterviewer = interview.interviewer._id.toString() === req.user.userId;
    const isCandidate = interview.candidate && interview.candidate.toString() === req.user.userId;
    
    if (!isInterviewer && !isCandidate) {
      return res.status(403).json({ message: 'Not authorized to view this interview' });
    }

    // If candidate exists in User collection, populate it
    if (interview.candidate) {
      await interview.populate('candidate', 'name email');
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
    .populate('interviewer', 'name email')
    .sort({ scheduledTime: 1 });

    // Populate candidate data for interviews where candidate exists in User collection
    for (let interview of interviews) {
      if (interview.candidate) {
        await interview.populate('candidate', 'name email');
      }
    }

    res.json(interviews);
  } catch (error) {
    console.error('Error fetching user interviews:', error);
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
});

// Start Interview and Generate URL
app.post('/api/interviews/:interviewId/start', verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId)
      .populate('candidate', 'name email')
      .populate('interviewer', 'name email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if the user is the interviewer
    if (interview.interviewer._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the interviewer can start the interview' });
    }

    // Check if the interview is already completed or cancelled
    if (interview.status === 'completed' || interview.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot start a completed or cancelled interview' });
    }

    // Update interview status to in-progress
    interview.status = 'in-progress';
    interview.timer = {
      startTime: new Date(),
      duration: interview.duration * 60 * 1000, // Convert minutes to milliseconds
      isRunning: true,
      remainingTime: interview.duration * 60 * 1000
    };

    await interview.save();

    // Generate interview URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const interviewUrl = `${baseUrl}/interview/${interview._id}`;

    res.json({ 
      message: 'Interview started successfully', 
      interview,
      interviewUrl,
      timer: interview.timer
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ message: 'Failed to start interview', error: error.message });
  }
});

// Get Interview URL
app.get('/api/interviews/:interviewId/url', verifyToken, async (req, res) => {
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
      return res.status(403).json({ message: 'Not authorized to access this interview' });
    }

    // Generate interview URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const interviewUrl = `${baseUrl}/interview/${interview._id}`;

    res.json({ 
      interviewUrl,
      interview,
      canStart: interview.interviewer._id.toString() === req.user.userId && interview.status === 'scheduled'
    });
  } catch (error) {
    console.error('Error generating interview URL:', error);
    res.status(500).json({ message: 'Failed to generate interview URL', error: error.message });
  }
});

// Verify user for an interview
app.get('/api/interviews/:interviewId/verify-user', verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const isInterviewer = interview.interviewerEmail === user.email;
    const isCandidate = interview.candidateEmail === user.email;

    if (isInterviewer || isCandidate) {
      return res.status(200).json({ message: 'User is authorized' });
    } else {
      return res.status(403).json({ message: 'User is not authorized for this interview' });
    }
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ message: 'Failed to verify user' });
  }
});

// Replace or update the /api/interviews/:interviewId/join endpoint to allow passcode-only access
app.post('/api/interviews/:interviewId/join', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { passcode } = req.body;
    if (!passcode) {
      return res.status(400).json({ message: 'Passcode is required' });
    }
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    if (interview.passcode !== passcode) {
      return res.status(401).json({ message: 'Invalid passcode' });
    }
    // Optionally: return only safe interview data
    return res.json({ interview });
  } catch (error) {
    console.error('Join interview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update interview details
app.put('/api/interviews/:interviewId', verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Optionally, check if the user is authorized to update
    if (interview.interviewer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this interview' });
    }

    // Only update fields if they are present in the request body
    const updatableFields = [
      'interviewerEmail', 'candidateName', 'candidateEmail', 'position',
      'scheduledTime', 'title', 'duration', 'status', 'passcode'
    ];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        interview[field] = req.body[field];
      }
    });

    await interview.save();
    res.json({ message: 'Interview updated successfully', interview });
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ message: 'Failed to update interview', error: error.message });
  }
});

// Delete interview
app.delete('/api/interviews/:interviewId', verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    // Only the interviewer can delete
    if (interview.interviewer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this interview' });
    }
    await interview.deleteOne();
    res.json({ message: 'Interview deleted successfully', interview });
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ message: 'Failed to delete interview', error: error.message });
  }
});

// Add this endpoint after other app.post/app.get routes
app.post('/api/interviews/find-by-passcode', async (req, res) => {
  try {
    const { passcode } = req.body;
    if (!passcode) {
      return res.status(400).json({ message: 'Passcode is required' });
    }
    const interview = await Interview.findOne({ passcode });
    if (!interview) {
      return res.status(404).json({ message: 'Invalid passcode' });
    }
    return res.json({ interviewId: interview._id });
  } catch (error) {
    console.error('Error in find-by-passcode:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/koder')
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
    const { interviewId, language, code } = data;
    console.log(`⚡ executeCode received: interviewId=${interviewId}, socket=${socket.id}`);
    const result = await executeCode(language, code);
    if (interviewId) {
      console.log(`🔊 Emitting codeOutput to room: ${interviewId}`);
      io.to(interviewId).emit('codeOutput', { ...result, interviewId });
    } else {
      console.log(`🔊 Emitting codeOutput to socket: ${socket.id}`);
      socket.emit('codeOutput', result);
    }
  });

  socket.on('startTimer', async ({ interviewId }) => {
    try {
      const interview = await Interview.findById(interviewId);
      if (interview && !interview.timer.isRunning) {
        if (!interview.timer) interview.timer = {};
        interview.timer.startTime = new Date();
        interview.timer.isRunning = true;
        interview.status = 'in-progress';
        await interview.save();
        io.to(interviewId).emit('timerStarted', { 
          interviewId, 
          startTime: interview.timer.startTime,
          elapsedSeconds: interview.timer.elapsedSeconds 
        });
      }
    } catch (error) {
      console.error('Error starting/resuming timer:', error);
      socket.emit('timerError', { message: 'Failed to start timer' });
    }
  });

  socket.on('stopTimer', async ({ interviewId }) => {
    try {
      const interview = await Interview.findById(interviewId);
      if (interview && interview.timer.isRunning) {
        const now = new Date();
        const start = new Date(interview.timer.startTime);
        const elapsed = (now - start) / 1000;
        
        interview.timer.elapsedSeconds += elapsed;
        interview.timer.isRunning = false;
        interview.timer.startTime = null;

        await interview.save();
        io.to(interviewId).emit('timerStopped', { 
          interviewId, 
          elapsedSeconds: interview.timer.elapsedSeconds 
        });
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      socket.emit('timerError', { message: 'Failed to stop timer' });
    }
  });

  socket.on('restartTimer', async ({ interviewId }) => {
    try {
      const interview = await Interview.findById(interviewId);
      if (interview) {
        if (!interview.timer) interview.timer = {};
        interview.timer.startTime = new Date();
        interview.timer.elapsedSeconds = 0;
        interview.timer.isRunning = true;
        await interview.save();
        io.to(interviewId).emit('timerStarted', { 
          interviewId, 
          startTime: interview.timer.startTime, 
          elapsedSeconds: 0 
        });
      }
    } catch (error) {
      console.error('Error restarting timer:', error);
      socket.emit('timerError', { message: 'Failed to restart timer' });
    }
  });

  // Multi-user video chat and chat signaling
  // Store users in each interview video room
  const videoRooms = io.videoRooms || (io.videoRooms = {});

  socket.on('join-video-room', ({ interviewId, userId }) => {
    const room = interviewId + '-video';
    socket.join(room);
    if (!videoRooms[room]) videoRooms[room] = {};
    videoRooms[room][socket.id] = { userId };
    // Notify all users in the room of the new participant list
    io.to(room).emit('video-participants', Object.keys(videoRooms[room]).map(id => ({ id, userId: videoRooms[room][id].userId })));
    // Notify others to initiate connection
    socket.to(room).emit('video-initiate', { to: socket.id });
  });

  socket.on('video-signal', ({ signal, to, interviewId }) => {
    io.to(to).emit('video-signal', { signal, from: socket.id });
  });

  socket.on('leave-video-room', ({ interviewId }) => {
    const room = interviewId + '-video';
    socket.leave(room);
    if (videoRooms[room]) {
      delete videoRooms[room][socket.id];
      io.to(room).emit('video-participants', Object.keys(videoRooms[room]).map(id => ({ id, userId: videoRooms[room][id].userId })));
    }
  });

  socket.on('video-chat-message', ({ interviewId, userId, message }) => {
    const room = interviewId + '-video';
    io.to(room).emit('video-chat-message', { userId, message, timestamp: Date.now() });
  });

  socket.on('video-chat-dm', ({ interviewId, fromUserId, toSocketId, message }) => {
    // Send to recipient and sender only
    io.to(toSocketId).emit('video-chat-dm', { fromUserId, message, timestamp: Date.now(), private: true });
    socket.emit('video-chat-dm', { fromUserId, message, timestamp: Date.now(), private: true });
  });

  socket.on('raise-hand', ({ interviewId, userId }) => {
    const room = interviewId + '-video';
    io.to(room).emit('raise-hand', { userId });
  });

  socket.on('emoji-reaction', ({ interviewId, userId, emoji }) => {
    const room = interviewId + '-video';
    io.to(room).emit('emoji-reaction', { userId, emoji, timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    // Remove from all video rooms
    Object.keys(videoRooms).forEach(room => {
      if (videoRooms[room][socket.id]) {
        delete videoRooms[room][socket.id];
        io.to(room).emit('video-participants', Object.keys(videoRooms[room]).map(id => ({ id, userId: videoRooms[room][id].userId })));
      }
    });
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
      .populate('interviewer', 'name email') // Populate interviewer details
      .sort('scheduledTime'); // Sort by scheduled time

    // Populate candidate data for interviews where candidate exists in User collection
    for (let interview of interviews) {
      if (interview.candidate) {
        await interview.populate('candidate', 'name email');
      }
    }

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

// Feedback for Interview
app.post('/api/interviews/:interviewId/feedback', verifyToken, async (req, res) => {
  try {
    const { rating, comments } = req.body;
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    // Only interviewer or candidate can submit feedback
    if (
      interview.interviewer.toString() !== req.user.userId &&
      interview.candidate.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: 'Not authorized to submit feedback for this interview' });
    }
    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    // Update feedback
    interview.feedback = {
      rating: rating ?? interview.feedback?.rating,
      comments: comments ?? interview.feedback?.comments
    };
    await interview.save();
    res.json({ message: 'Feedback submitted successfully', feedback: interview.feedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

app.get('/api/interviews/:interviewId/feedback', verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    // Only interviewer or candidate can view feedback
    if (
      interview.interviewer.toString() !== req.user.userId &&
      interview.candidate.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: 'Not authorized to view feedback for this interview' });
    }
    res.json({ feedback: interview.feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
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

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, originalName: req.file.originalname });
});
