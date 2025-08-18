# Kodr - Technical Interview Platform

A comprehensive technical interview platform with real-time collaboration, code compilation, whiteboard functionality, and video chat capabilities.

## 🚀 Features

### Core Interview Features
- **Real-time Code Editor**: Monaco Editor with syntax highlighting for multiple programming languages
- **Live Code Compilation**: Execute and test code in real-time during interviews
- **Interactive Whiteboard**: Collaborative drawing and diagramming with Konva.js
- **Video Chat Integration**: Real-time video communication using Agora SDK
- **Interview Management**: Schedule, start, and manage technical interviews
- **Role-based Access**: Separate interfaces for interviewers and candidates
- **Real-time Collaboration**: Live synchronization of code, whiteboard, and chat

### Technical Capabilities
- **Multi-language Support**: JavaScript, Python, Java, C++, and more
- **Resizable Panels**: Flexible workspace layout with drag-and-drop resizing
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **WebSocket Integration**: Real-time updates and collaboration
- **JWT Authentication**: Secure user authentication and authorization
- **MongoDB Database**: Scalable data storage for interviews and users

### User Experience
- **Modern UI/UX**: Clean, intuitive interface with smooth animations
- **Dark Theme**: Professional dark mode design
- **Responsive Design**: Adapts to different screen sizes
- **Keyboard Shortcuts**: Power user features for efficiency
- **Real-time Updates**: Live status and progress indicators

## 📁 Project Structure

```
kodr/
├── backend/                          # Backend server
│   ├── models/                       # MongoDB models
│   │   ├── Interview.js             # Interview data model
│   │   └── User.js                  # User authentication model
│   ├── routes/                       # API route handlers
│   ├── services/                     # Business logic services
│   │   └── emailService.js          # Email notification service
│   ├── utils/                        # Utility functions
│   ├── uploads/                      # File upload storage
│   ├── package.json                  # Backend dependencies
│   └── server.js                     # Main server file
│
├── frontend/                         # React frontend application
│   ├── public/                       # Static assets
│   │   ├── subtle-pattern.svg       # Background patterns
│   │   └── vite.svg                 # Vite logo
│   ├── src/                          # Source code
│   │   ├── components/               # Reusable UI components
│   │   │   ├── Background3D.jsx     # 3D background effects
│   │   │   ├── InterviewPanel.jsx   # Main interview interface
│   │   │   ├── InterviewUrlDisplay.jsx # Interview URL sharing
│   │   │   ├── KonvaWhiteboard.jsx  # Interactive whiteboard
│   │   │   ├── PasscodeModal.jsx    # Authentication modal
│   │   │   ├── ProtectedRoute.jsx   # Route protection
│   │   │   ├── RoleSelection.jsx    # User role selection
│   │   │   └── VideoChat.jsx        # Video chat component
│   │   ├── contexts/                 # React contexts
│   │   │   └── AuthContext.jsx      # Authentication context
│   │   ├── pages/                    # Application pages
│   │   │   ├── CompilerPage.jsx     # Code compilation page
│   │   │   ├── HomePage.jsx         # Landing page
│   │   │   ├── InterviewPage.jsx    # Interview interface
│   │   │   ├── InterviewPanelPage.jsx # Interview panel
│   │   │   ├── InterviewerDashboard.jsx # Interviewer management
│   │   │   ├── InterviewerLogin.jsx # Interviewer authentication
│   │   │   ├── RoleSelection.jsx    # Role selection page
│   │   │   └── UserInfoPage.jsx     # User profile page
│   │   ├── utils/                    # Utility functions
│   │   │   └── interviewUtils.js    # Interview helper functions
│   │   ├── App.jsx                   # Main application component
│   │   ├── main.jsx                  # Application entry point
│   │   └── index.css                 # Global styles
│   ├── package.json                  # Frontend dependencies
│   ├── vite.config.js                # Vite build configuration
│   └── vercel.json                   # Vercel deployment config
│
├── INTERVIEW_URL_GUIDE.md            # Interview URL system documentation
├── package.json                      # Root package configuration
└── README.md                         # This file
```

## 🛠️ Technologies Used

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Fast build tool and development server
- **Monaco Editor** - Professional code editor (same as VS Code)
- **Konva.js** - 2D canvas library for whiteboard functionality
- **Three.js** - 3D graphics for background effects
- **Socket.io Client** - Real-time communication
- **Ant Design** - UI component library
- **Emotion** - CSS-in-JS styling
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **Multer** - File upload handling
- **Nodemailer** - Email service integration

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/SURAJ-RATHI/kodr.git
   cd kodr
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Configuration**
   
   Create `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/kodr
   JWT_SECRET=your_jwt_secret_here
   PORT=3000
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env file
   ```

5. **Run the application**
   ```bash
   # Terminal 1: Start backend server
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend development server
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Production Build

```bash
# Build frontend for production
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

## 🔧 Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 Usage

### For Interviewers
1. **Login/Signup** - Access the interviewer dashboard
2. **Create Interview** - Schedule a new technical interview
3. **Start Interview** - Begin the interview session
4. **Share URL** - Send interview link to candidate
5. **Monitor Progress** - Track candidate's code and whiteboard activity
6. **End Interview** - Conclude and save results

### For Candidates
1. **Receive URL** - Get interview link from interviewer
2. **Join Interview** - Access the interview interface
3. **Code & Collaborate** - Write code and use whiteboard
4. **Real-time Communication** - Chat and video call with interviewer
5. **Submit Solutions** - Complete coding challenges

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Interviews
- `GET /api/interviews` - List interviews
- `POST /api/interviews` - Create interview
- `GET /api/interviews/:id` - Get interview details
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Delete interview

### Real-time
- WebSocket connection for live collaboration
- Code synchronization
- Whiteboard updates
- Chat messages

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Secure WebSocket connections
- Input validation and sanitization
- CORS protection
- Rate limiting

## 🚀 Deployment

### Vercel (Frontend)
- Automatic deployment from GitHub
- Environment variables configuration
- Custom domain support

### Backend Deployment
- Node.js hosting (Heroku, DigitalOcean, AWS)
- MongoDB Atlas for database
- Environment variable configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🔄 Changelog

### Latest Updates
- Removed timer functionality from InterviewPanel
- Enhanced UI components and styling
- Improved mobile responsiveness
- Added new compiler page functionality
- Updated authentication system

---

**Built with ❤️ for technical interviews** 