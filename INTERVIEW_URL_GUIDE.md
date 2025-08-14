# Interview URL Generation Guide

This guide explains how the interview URL generation system works in the kodr application.

## Overview

The interview URL generation system allows interviewers to create shareable URLs for their interviews, enabling candidates to join interviews directly through a link. The system includes real-time collaboration features and proper authentication.

## Features

### 1. Dynamic Interview URLs
- **Format**: `https://yourdomain.com/interview/{interviewId}`
- **Example**: `https://kodr.com/interview/64f8a1b2c3d4e5f6a7b8c9d0`

### 2. Real-time Collaboration
- Live code editing synchronization
- Shared whiteboard functionality
- Real-time status updates

### 3. Authentication & Authorization
- Only authorized users (interviewer or candidate) can access interview URLs
- JWT token-based authentication
- Role-based access control

## How It Works

### 1. Creating an Interview
1. Interviewer schedules an interview through the dashboard
2. System generates a unique interview ID
3. Interview is stored in the database with status 'scheduled'

### 2. Starting an Interview
1. Interviewer clicks "Start Interview" button
2. System updates interview status to 'in-progress'
3. Timer starts automatically
4. Interview URL becomes active

### 3. Sharing the URL
1. Interviewer can share the URL via:
   - Copy to clipboard
   - Native sharing API (mobile)
   - Direct link sharing
2. Candidate receives the URL and can join the interview

### 4. Joining an Interview
1. Candidate clicks the interview URL
2. System validates authentication and authorization
3. Candidate is redirected to the interview interface
4. Real-time collaboration begins

## API Endpoints

### Start Interview
```http
POST /api/interviews/:interviewId/start
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Interview started successfully",
  "interview": { /* interview object */ },
  "interviewUrl": "https://kodr.com/interview/64f8a1b2c3d4e5f6a7b8c9d0",
  "timer": {
    "startTime": "2024-01-15T10:00:00Z",
    "duration": 3600000,
    "isRunning": true,
    "remainingTime": 3600000
  }
}
```

### Get Interview URL
```http
GET /api/interviews/:interviewId/url
Authorization: Bearer <token>
```

**Response:**
```json
{
  "interviewUrl": "https://kodr.com/interview/64f8a1b2c3d4e5f6a7b8c9d0",
  "interview": { /* interview object */ },
  "canStart": true
}
```

### Get Interview Details
```http
GET /api/interviews/:interviewId
Authorization: Bearer <token>
```

## Frontend Components

### 1. InterviewPage
- Main interview interface
- Fetches interview data
- Handles authentication
- Renders InterviewPanel

### 2. InterviewPanel
- Code editor with real-time sync
- Whiteboard functionality
- Output display
- Socket connection management

### 3. InterviewUrlDisplay
- URL display and copying
- Share functionality
- Native sharing API support

### 4. InterviewerDashboard
- Interview management
- Start/Join interview buttons
- Share URL functionality

## Utility Functions

### generateInterviewUrl(interviewId, baseUrl)
Generates a complete interview URL.

### copyInterviewUrl(interviewUrl)
Copies URL to clipboard.

### shareInterviewUrl(interviewUrl, title)
Shares URL using native sharing API or clipboard fallback.

### canStartInterview(interview, userId)
Checks if user can start the interview.

## Environment Variables

```env
FRONTEND_URL=https://yourdomain.com
MONGODB_URI=mongodb://localhost:27017/kodr
JWT_SECRET=your-secret-key
```

## Security Considerations

1. **Authentication Required**: All interview URLs require valid JWT tokens
2. **Authorization**: Only interviewer and candidate can access interview URLs
3. **Token Validation**: Server validates tokens on every request
4. **CORS**: Proper CORS configuration for cross-origin requests
5. **Rate Limiting**: Implement rate limiting for API endpoints

## Usage Examples

### For Interviewers

1. **Schedule an Interview**
   ```javascript
   // Interview is automatically created with unique ID
   const interview = await scheduleInterview(interviewData);
   ```

2. **Start an Interview**
   ```javascript
   const response = await fetch(`/api/interviews/${interviewId}/start`, {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token}` }
   });
   ```

3. **Share Interview URL**
   ```javascript
   const interviewUrl = generateInterviewUrl(interviewId);
   await shareInterviewUrl(interviewUrl, interviewTitle);
   ```

### For Candidates

1. **Join Interview via URL**
   ```javascript
   // Navigate to interview URL
   window.location.href = interviewUrl;
   ```

2. **Access Interview Interface**
   ```javascript
   // InterviewPage component handles authentication and rendering
   ```

## Error Handling

### Common Errors

1. **404 - Interview Not Found**
   - Interview ID doesn't exist
   - Check interview ID validity

2. **403 - Not Authorized**
   - User is not interviewer or candidate
   - Check user permissions

3. **401 - Authentication Required**
   - Missing or invalid JWT token
   - Re-authenticate user

4. **400 - Cannot Start Interview**
   - Interview already completed/cancelled
   - Check interview status

## Troubleshooting

### URL Not Working
1. Check if interview exists
2. Verify user authentication
3. Ensure user has proper permissions
4. Check interview status

### Real-time Features Not Working
1. Verify socket connection
2. Check network connectivity
3. Ensure interview is in 'in-progress' status
4. Check browser console for errors

### Sharing Not Working
1. Check clipboard permissions
2. Verify native sharing API support
3. Test with different browsers/devices

## Best Practices

1. **Always validate URLs** before sharing
2. **Use HTTPS** for production URLs
3. **Implement proper error handling**
4. **Add loading states** for better UX
5. **Test on multiple devices** and browsers
6. **Monitor socket connections** for performance
7. **Implement proper cleanup** on component unmount

## Future Enhancements

1. **QR Code Generation** for easy mobile sharing
2. **Email Integration** for automatic URL sharing
3. **Calendar Integration** for scheduling
4. **Recording Feature** for interview playback
5. **Analytics Dashboard** for interview insights
6. **Multi-language Support** for international users 