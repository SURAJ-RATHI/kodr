const nodemailer = require('nodemailer');

// =================================================================================================
// IMPORTANT: Email Configuration
// =================================================================================================
// For this to work, you need to set up an email account (like Gmail, SendGrid, etc.)
// and add the credentials to your backend's .env file.
//
// Add the following variables to your .env file:
//
// EMAIL_HOST=smtp.example.com
// EMAIL_PORT=587
// EMAIL_SECURE=false // true for 465, false for other ports
// EMAIL_USER=your-email@example.com
// EMAIL_PASS=your-email-password
// EMAIL_FROM='"Your App Name" <your-email@example.com>'
//
// For development with Gmail, you might need to "Allow less secure apps" or generate an "App Password".
// =================================================================================================

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendInterviewScheduledEmail = async (interview) => {
  const { 
    candidateEmail, 
    candidateName, 
    interviewerEmail, 
    title, 
    position, 
    scheduledTime, 
    passcode 
  } = interview;

  const formattedDate = new Date(scheduledTime).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const interviewUrl = `${process.env.FRONTEND_URL}/interview/${interview._id}`;

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
    <br/>
    <p>Thank you,</p>
    <p>The Koder Team</p>
  `;

  // Email to Candidate
  const candidateMailOptions = {
    from: process.env.EMAIL_FROM,
    to: candidateEmail,
    subject: `Interview Scheduled: ${title}`,
    html: `
      <h2>Hello ${candidateName},</h2>
      ${commonEmailBody}
    `,
  };

  // Email to Interviewer
  // Note: We need to fetch interviewer's name if we want to personalize this email.
  const interviewerMailOptions = {
    from: process.env.EMAIL_FROM,
    to: interviewerEmail,
    subject: `You have scheduled an interview: ${title}`,
    html: `
      <h2>Hello,</h2>
      <p>You have successfully scheduled an interview with ${candidateName}.</p>
      ${commonEmailBody}
    `,
  };

  try {
    // We send both emails and can handle their results separately if needed
    const sendCandidateEmail = transporter.sendMail(candidateMailOptions);
    const sendInterviewerEmail = transporter.sendMail(interviewerMailOptions);

    await Promise.all([sendCandidateEmail, sendInterviewerEmail]);
    console.log('✅ Interview notification emails sent successfully.');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending interview emails:', error);
    // In a real app, you might want a more robust error handling/logging mechanism
    return { success: false, error };
  }
};

// Email service will be implemented here.
module.exports = {
  sendInterviewScheduledEmail,
}; 