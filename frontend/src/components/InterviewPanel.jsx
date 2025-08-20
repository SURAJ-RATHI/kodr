import { useState, useRef, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import MonacoEditor from '@monaco-editor/react';
import KonvaWhiteboard from './KonvaWhiteboard';
import styled from '@emotion/styled';
import { FaCode, FaPencilAlt, FaHighlighter, FaEraser, FaMinus, FaArrowRight, FaUndo, FaRedo, FaTrash, FaPalette, FaExpand, FaCompress, FaSquare, FaCircle, FaTerminal } from 'react-icons/fa';
import VideoChat from './VideoChat';

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif; /* Assuming Inter font is used */
  
  /* Responsive design improvements */
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
  
  /* Mobile dropdown animations */
  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const PanelHeader = styled.div`
  background: rgba(34, 40, 49, 0.7);
  color: #61dafb; /* Match homepage title color */
  font-weight: 800; /* Match homepage title color */
  font-size: clamp(1.2rem, 3vw, 1.5rem); /* Responsive font size */
  padding: clamp(1.2rem, 3vw, 1.5rem) clamp(1.5rem, 4vw, 2rem); /* Increased padding for more height */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* Softer border */
  display: flex;
  align-items: center;
  justify-content: space-between;
  letter-spacing: 0.01em;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3); /* Darker shadow */
  border-radius: 18px 18px 0 0;
  backdrop-filter: blur(8px);
  
  /* Responsive design improvements */
  @media (max-width: 768px) {
    flex-direction: column;
    gap: clamp(0.75rem, 2vw, 1rem);
    align-items: stretch;
    padding: clamp(1rem, 2.5vw, 1.3rem) clamp(1rem, 3vw, 1.5rem); /* Increased mobile padding */
    font-size: clamp(1rem, 2.5vw, 1.2rem);
  }
  
  @media (max-width: 480px) {
    padding: clamp(0.8rem, 2vw, 1rem) clamp(0.75rem, 2vw, 1rem); /* Increased small screen padding */
    gap: clamp(0.5rem, 1.5vw, 0.8rem);
    font-size: clamp(0.9rem, 2.2vw, 1rem);
  }
`;

const PanelBody = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.05); /* Match feature card background */
  padding: clamp(1rem, 3vw, 1.5rem); /* Responsive padding */
  overflow: auto;
  display: flex;
  flex-direction: column;
  border-radius: 0 0 18px 18px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3); /* Darker shadow */
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out;

  ${({ isActive }) => isActive && `
    border-color: #61dafb; /* Highlight color when active */
    box-shadow: 0 0 15px rgba(97, 218, 251, 0.7); /* Increase glow effect */
  `}

  &:hover {
    border-color: rgba(97, 218, 251, 0.5); /* Subtle highlight on hover */
    box-shadow: 0 0 10px rgba(97, 218, 251, 0.3); /* Subtle glow on hover */
  }
  
  /* Responsive design improvements */
  @media (max-width: 768px) {
    padding: clamp(0.75rem, 2vw, 1rem);
    border-radius: 0 0 16px 16px;
  }
  
  @media (max-width: 480px) {
    padding: clamp(0.6rem, 1.5vw, 0.8rem);
    border-radius: 0 0 12px 12px;
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, #61DAFB, #007ACC); /* Match homepage button gradient */
  color: #fff;
  border: none;
  border-radius: 8px; /* Match homepage button border radius */
  padding: clamp(0.6rem, 2vw, 0.8rem) clamp(1.4rem, 3vw, 1.8rem); /* Responsive padding */
  font-weight: 700;
  font-size: clamp(1rem, 2.5vw, 1.1rem); /* Responsive font size */
  cursor: pointer;
  margin-left: 1rem;
  transition: all 0.3s ease; /* Smooth transition */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); /* Darker shadow */
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: 0.5s;
  }

  &:hover::before {
    left: 100%;
  }

  &:hover {
    transform: translateY(-2px) scale(1.02); /* Slightly less pronounced hover effect */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4); /* Darker shadow on hover */
  }
  
  /* Responsive design improvements */
  @media (max-width: 768px) {
    margin-left: 0.5rem;
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
  }
  
  @media (max-width: 480px) {
    margin-left: 0.3rem;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
`;

const ToggleButton = styled(Button)`
  margin-left: 0;
  margin-right: clamp(0.5rem, 2vw, 0.7rem); /* Responsive margin */
  padding: clamp(0.5rem, 2vw, 0.6rem) clamp(1rem, 2.5vw, 1.2rem); /* Responsive padding */
  font-size: clamp(0.95rem, 2.5vw, 1.05rem); /* Responsive font size */
  background: rgba(255, 255, 255, 0.1); /* Different background for toggle button */
  border: 1px solid rgba(255, 255, 255, 0.2); /* Border for toggle button */
  &:hover {
    background: rgba(255, 255, 255, 0.2); /* Hover effect for toggle button */
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
  }
  
  /* Responsive design improvements */
  @media (max-width: 768px) {
    margin-right: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
  }
  
  @media (max-width: 480px) {
    margin-right: 0.3rem;
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
`;

const OutputBox = styled.div`
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  padding: clamp(1rem, 3vw, 1.5rem);
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  line-height: 1.6;
  overflow-y: auto;
  border: 1px solid rgba(0, 255, 0, 0.3);
  white-space: pre-wrap;
  word-wrap: break-word;
  transition: all 0.3s ease;

  ${({ isActive }) => isActive && `
    border-color: #61dafb;
    box-shadow: 0 0 15px rgba(97, 218, 251, 0.3);
  `}

  &:hover {
    border-color: rgba(0, 255, 0, 0.5);
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
  }
  
  /* Responsive design improvements */
  @media (max-width: 768px) {
    padding: clamp(0.75rem, 2vw, 1rem);
    font-size: clamp(0.8rem, 2.2vw, 0.9rem);
    min-height: clamp(200px, 40vh, 300px);
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    font-size: 0.8rem;
    min-height: 180px;
  }
`;

const WhiteboardContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  ${({ isActive }) => isActive && `
    border-color: #61dafb;
    box-shadow: 0 0 15px rgba(97, 218, 251, 0.3);
  `}

  &:hover {
    border-color: rgba(97, 218, 251, 0.5);
    box-shadow: 0 0 10px rgba(97, 218, 251, 0.2);
  }
`;

const WhiteboardToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 1.1rem;
  background: rgba(34, 40, 49, 0.95); /* Keep toolbar background */
  padding: 0.8rem 1.5rem;
  border-bottom: 1px solid #222;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); /* Darker shadow */
  border-radius: 14px 14px 0 0;
  justify-content: space-between;
`;

const ToolGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1.1rem;
`;

const ToolButton = styled.button`
  background: none;
  border: none;
  color: #61dafb; /* Keep tool button color */
  font-size: 1.35rem;
  cursor: pointer;
  padding: 0.35rem 0.6rem;
  border-radius: 7px;
  position: relative;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  &:hover, &.active {
    background: linear-gradient(90deg, #232526 60%, rgba(0, 122, 204, 0.2)); /* Adjusted hover background */
    color: #fff;
    box-shadow: 0 2px 8px rgba(97, 218, 251, 0.3); /* Adjusted hover shadow */
  }
`;

const ShortcutBadge = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
  background: #007acc;
  color: #fff;
  font-size: 0.7rem;
  border-radius: 4px;
  padding: 0 4px;
  pointer-events: none;
  opacity: 0.85;
`;

const ActiveToolDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 1.2rem;
  color: #a0a0a0; /* Match homepage subtitle color */
  font-weight: 700;
  margin: 0.5rem 0 0.2rem 1.5rem;
  letter-spacing: 0.01em;
`;

const ColorInput = styled.input`
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  margin-left: 0.5rem;
  background: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.2); /* Adjusted shadow */
`;

const LanguageSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: clamp(0.5rem, 1.5vw, 0.6rem);
  font-size: clamp(0.875rem, 2.2vw, 0.9rem);
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
  }

  &:focus {
    border-color: #ffffff;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
  }

  option {
    background: #2a2f37;
    color: #fff;
  }
  
  /* Responsive design improvements */
  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.4rem;
    font-size: 0.8rem;
  }
`;

const sampleCode = {
  javascript: `// Write your JavaScript code here\nconsole.log("Welcome to Kodr! 🚀");\nconsole.log("Start coding...");\n\nfunction add(a, b) {\n  return a + b;\n}\n\n// Example: add(5, 10) returns 15\nconsole.log("Result:", add(5, 10));
`,
  python: `# Write your Python code here\nprint("Welcome to Kodr! 🚀")\nprint("Start coding...")\n\ndef subtract(a, b):\n  return a - b\n\nprint("Result:", subtract(10, 5))
`,
  cpp: `// Write your C++ code here\n#include <iostream>\n\nint main() {\n  std::cout << "Welcome to Kodr! 🚀" << std::endl;\n  std::cout << "Start coding..." << std::endl;\n  std::cout << "Hello, world!" << std::endl;\n  return 0;\n}
`,
  java: `// Write your Java code here\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Welcome to Kodr! 🚀");\n    System.out.println("Start coding...");\n    System.out.println("Hello, world!");\n  }\n}
`,
  c: `// Write your C code here\n#include <stdio.h>\n\nint main() {\n  printf("Welcome to Kodr! 🚀\\n");\n  printf("Start coding...\\n");\n  printf("Hello, world!");\n  return 0;\n}
`,
  // Add more languages here
  go: `// Write your Go code here\npackage main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Welcome to Kodr! 🚀")\n\tfmt.Println("Start coding...")\n\tfmt.Println("Hello, world!")\n}
`,
  ruby: `# Write your Ruby code here\nputs "Welcome to Kodr! 🚀"\nputs "Start coding..."\nputs "Hello, world!"
`,
  swift: `// Write your Swift code here\nimport Foundation\n\nprint("Welcome to Kodr! 🚀")\nprint("Start coding...")\nprint("Hello, world!")
`,
  kotlin: `// Write your Kotlin code here\nfun main() {\n  println("Welcome to Kodr! 🚀")\n  println("Start coding...")\n  println("Hello, world!")\n}
`,
};

const languages = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
  { label: 'C', value: 'c' },
  { label: 'Go', value: 'go' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Swift', value: 'swift' },
  { label: 'Kotlin', value: 'kotlin' },
];

export default function InterviewPanel({ socket, interviewId, interviewData, showVideoChat = true, role = 'candidate', isCompilerMode = false, onShareCompiler, onBackToHome }) {


  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);
  const [code, setCode] = useState(sampleCode.javascript);
  
  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('> Ready to run code');
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [whiteboardMax, setWhiteboardMax] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#61dafb');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [tool, setTool] = useState('pen');
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [isWhiteboardMaximized, setIsWhiteboardMaximized] = useState(false);
  const [mobileView, setMobileView] = useState('code'); // 'code' or 'whiteboard'
  const [autoSwitchedToCompiler, setAutoSwitchedToCompiler] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [showExitModal, setShowExitModal] = useState(false);
  

  
  const canvasRef = useRef();
  const [isCodeEditorActive, setIsCodeEditorActive] = useState(false);
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [isOutputActive, setIsOutputActive] = useState(false);
  const codeEditorPanelBodyRef = useRef(null);
  const whiteboardContainerRef = useRef(null);
  const outputBoxRef = useRef(null);

  // Check if device is mobile - optimized function
  const isMobile = () => {
    return window.innerWidth <= 768;
  };

  // Handle mobile view toggle
  const handleMobileViewToggle = (view) => {
    setMobileView(view);
    setAutoSwitchedToCompiler(false); // Clear auto-switch indicator when manually switching
  };



  // Add window resize listener for mobile detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && mobileView === 'code') {
        // Ensure code editor is shown by default on mobile
        setMobileView('code');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileView]);



  // Handle clicking outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('[data-profile-dropdown]')) {
        setShowProfileDropdown(false);
      }
    };

    // Handle both mouse and touch events for mobile compatibility
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Clean mobile profile button click handler
  const handleMobileProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };



  // Monitor output state changes for debugging
  useEffect(() => {
    if (!socket) return;

    const handleCodeUpdate = (data) => {
      if (data.interviewId === interviewId) {
        setCode(data.code);
        setLanguage(data.language);
      }
    };

    const handleCompilerCodeUpdate = (data) => {
      if (data.compilerId === interviewId) {
        setCode(data.code);
        setLanguage(data.language);
      }
    };

    const handleCodeOutput = (data) => {
      if (data && data.output) {
      setOutput(data.output);
      } else {
        setOutput('> Error: No output received from server\n> Please check your code and try again.');
      }
    };

    const handleWhiteboardUpdate = (data) => {
      if (data.interviewId === interviewId) {
        // setWhiteboardShapes(data.shapes); // Removed whiteboardShapes state
      }
    };



    socket.on('codeUpdate', handleCodeUpdate);
    socket.on('compilerCodeUpdate', handleCompilerCodeUpdate);
    socket.on('codeOutput', handleCodeOutput);
    socket.on('whiteboardUpdate', handleWhiteboardUpdate);

    return () => {
      socket.off('codeUpdate', handleCodeUpdate);
      socket.off('compilerCodeUpdate', handleCompilerCodeUpdate);
      socket.off('codeOutput', handleCodeOutput);
      socket.off('whiteboardUpdate', handleWhiteboardUpdate);
    };
  }, [socket, interviewId]);

  // Update sample code when language changes
  // useEffect(() => {
  //   setCode(sampleCode[language] || '// Write your code here');
  // }, [language]);

  // Keyboard shortcuts for tool selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < languages.length) {
        setLanguage(languages[idx].value);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Run Code
  const handleRunCode = () => {
    // Ensure output view is visible (not whiteboard)
    setShowWhiteboard(false);
    
    // On mobile, automatically switch to whiteboard/compiler view to show output
    if (isMobile()) {
      setMobileView('whiteboard');
      setAutoSwitchedToCompiler(true);
    }
    
    if (socket) {
      socket.emit('executeCode', {
        interviewId,
        code,
        language,
      });
      
      // Set a temporary output while waiting for response
      setOutput('> Running code...');
      
      // Set a timeout to detect if backend is not responding
      setTimeout(() => {
        if (output.includes('Running code...')) {
          setOutput('> Backend not responding - using mock output\n> Hello, world!\n> 15');
        }
      }, 5000); // 5 second timeout
    } else {
      // Mock output for testing when no socket
      setOutput('> Hello, world!\n> 15');
    }
  };

  // Whiteboard tool actions
  const handleTool = (toolName) => {
    setTool(toolName);
    if (!canvasRef.current) return;
    if (toolName === 'undo') canvasRef.current.undo();
    else if (toolName === 'redo') canvasRef.current.redo();
    else if (toolName === 'delete') canvasRef.current.clear();
  };

  // Whiteboard props
  const getStrokeProps = () => {
    if (tool === 'highlighter') return { strokeWidth: 10, strokeColor: strokeColor + '88', eraser: false };
    if (tool === 'eraser') return { eraser: true, eraserWidth: 16 };
    return { strokeWidth: strokeWidth, strokeColor: strokeColor, eraser: false };
  };

  const activeTool = languages.find(l => l.value === language);

  // Handle code changes and emit socket events
  const handleCodeChange = (value) => {
    setCode(value);
    if (socket) {
      if (isCompilerMode) {
        socket.emit('compilerCodeUpdate', {
          compilerId: interviewId,
          code: value,
          language,
        });
      } else {
        socket.emit('codeUpdate', {
          interviewId,
          code: value,
          language,
        });
      }
    }
  };

  // Handle language changes and emit socket events
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(sampleCode[newLanguage] || sampleCode.javascript);
    if (socket) {
      if (isCompilerMode) {
        socket.emit('compilerCodeUpdate', {
          compilerId: interviewId,
          code: sampleCode[newLanguage] || sampleCode.javascript,
          language: newLanguage,
        });
      } else {
        socket.emit('codeUpdate', {
          interviewId,
          code: sampleCode[newLanguage] || sampleCode.javascript,
          language: newLanguage,
        });
      }
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    // ... existing code ...
  };



  return (
    <Container>

      
      {/* Video Chat - Integrated in header instead of floating overlay */}
      {showVideoChat && (
        <div style={{ 
          position: 'absolute', 
          top: isMobile() ? '4px' : 'clamp(8px, 1.5vw, 12px)', 
          right: isMobile() ? '4px' : 'clamp(8px, 1.5vw, 12px)', 
          zIndex: 1000, 
          background: 'transparent', 
          borderRadius: isMobile() ? '4px' : 'clamp(6px, 1.5vw, 8px)', 
          padding: isMobile() ? '2px' : 'clamp(4px, 1vw, 6px)',
          maxWidth: isMobile() ? '120px' : 'none',
          maxHeight: isMobile() ? '90px' : 'none',
          overflow: 'hidden'
        }}>
          <VideoChat socket={socket} interviewId={interviewId} userId={'user'} />
        </div>
      )}
      
      {/* Main Header - Always visible at top */}
      <div style={{
          position: 'relative',
        background: 'rgba(34, 40, 49, 0.7)',
        color: '#61dafb',
        fontWeight: 800,
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          padding: isMobile() ? '0.4rem 1rem' : 'clamp(0.5rem, 1.2vw, 0.7rem) clamp(1.2rem, 3vw, 1.5rem)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        letterSpacing: '0.01em',
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.3)',
          borderRadius: isMobile() ? '12px 12px 0 0' : '16px 16px 0 0',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
          minHeight: isMobile() ? '36px' : 'clamp(38px, 5vw, 48px)',
          overflow: 'hidden',
        '@media (min-width: 1023px)': {
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'clamp(0.5rem, 1.5vw, 1rem)',
          flexShrink: 0
        }}>
          <span 
            onClick={() => {
              if (isCompilerMode) {
                setShowExitModal(true);
              } else if (onBackToHome) {
                onBackToHome();
              }
            }}
            style={{ 
              paddingRight: '0.5rem',
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', 
              color: '#61dafb',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1';
            }}
          >
                          <span style={{ fontSize: 'clamp(1.1em, 2.8vw, 1.2em)', color: '#61dafb' }}> &lt;/&gt;</span> Kodr 
          </span>
          

          
          {!isMobile() && (
              <LanguageSelect
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                style={{
                  padding: 'clamp(0.2rem, 0.8vw, 0.25rem)',
                  fontSize: 'clamp(0.65rem, 1.6vw, 0.75rem)',
                  minWidth: 'clamp(60px, 15vw, 80px)',
                  maxWidth: 'clamp(80px, 18vw, 100px)',
                  flexShrink: 0
                }}
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </LanguageSelect>
          )}
          {!isMobile() && (
              <Button 
                onClick={handleRunCode}
                style={{
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  padding: 'clamp(0.15rem, 0.6vw, 0.25rem) clamp(0.5rem, 1.2vw, 0.7rem)',
                  fontSize: 'clamp(0.65rem, 1.6vw, 0.75rem)',
                  minHeight: 'clamp(22px, 3.5vw, 26px)'
                }}
              >
                Run Code
              </Button>
          )}
          

        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
          flexShrink: 0,
          flexWrap: 'nowrap'
        }}>
          {isMobile() && (
            <>
              <LanguageSelect
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                style={{
                  padding: 'clamp(0.25rem, 1vw, 0.3rem)',
                  fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                  minWidth: 'clamp(70px, 18vw, 90px)',
                  maxWidth: 'clamp(100px, 22vw, 130px)',
                  flexShrink: 0
                }}
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </LanguageSelect>
              

          
              {/* Profile Button for Mobile - After Timer */}
              {!isCompilerMode && (
                <ToolButton
                  title={`${role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${role === 'interviewer' ? (interviewData?.interviewerEmail || 'Interviewer') : (interviewData?.candidateEmail || 'Candidate')}`}
                  onClick={() => {
                    setShowProfileDropdown(!showProfileDropdown);
                  }}
                style={{
                    fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', 
                    color: showProfileDropdown ? '#9c27b0' : '#9c27b0',
                    padding: 'clamp(0.25rem, 0.8vw, 0.3rem)',
                    minWidth: 'clamp(40px, 10vw, 50px)',
                    background: showProfileDropdown ? 'rgba(156, 39, 176, 0.3)' : 'rgba(156, 39, 176, 0.15)',
                    border: showProfileDropdown ? '1px solid rgba(156, 39, 176, 0.6)' : '1px solid rgba(156, 39, 176, 0.3)',
                    borderRadius: '6px',
          display: 'flex', 
          alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    if (!showProfileDropdown) {
                      e.target.style.background = 'rgba(156, 39, 176, 0.25)';
                      e.target.style.borderColor = 'rgba(156, 39, 176, 0.5)';
                      e.target.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showProfileDropdown) {
                      e.target.style.background = 'rgba(156, 39, 176, 0.15)';
                      e.target.style.borderColor = 'rgba(156, 39, 176, 0.3)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    width="1.2em" 
                    height="1.2em" 
                    fill="currentColor" 
                    style={{ color: '#9c27b0' }}
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </ToolButton>
              )}
              
                            {/* Copy ID Button for Mobile - Only show for compiler mode */}
              {isCompilerMode && (
                <ToolButton
                  title="Copy Compiler Session ID"
                  onClick={() => {
                    if (onShareCompiler) {
                      onShareCompiler();
                    } else {
                      // Fallback: copy the interviewId/compilerId
                      navigator.clipboard.writeText(interviewId).then(() => {
                        // You can add a success message here if needed
                      }).catch(() => {
                        // Handle error if needed
                      });
                    }
                  }}
                  style={{ 
                    fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', 
                    color: '#fff',
                    padding: 'clamp(0.25rem, 0.8vw, 0.3rem)',
                    minWidth: 'clamp(50px, 12vw, 70px)',
                    background: 'rgba(97, 218, 251, 0.2)',
                    border: '1px solid rgba(97, 218, 251, 0.4)',
                    borderRadius: '6px'
                  }}
                >
                  <svg 
                    viewBox="64 64 896 896" 
                    width="1em" 
                    height="1em" 
                    fill="currentColor" 
                    style={{ marginRight: '0.3rem', width: '0.9em', height: '0.9em' }}
                  >
                    <path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM664 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path>
                  </svg>
                  Copy ID
                </ToolButton>
              )}
            </>
          )}
        </div>
        

        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
          flexShrink: 0,
          flexWrap: 'nowrap'
        }}>
          {!isMobile() && (
            <>
            <ToolButton
              title={showWhiteboard ? 'Show Output' : 'Show Whiteboard'}
              onClick={() => {
                setShowWhiteboard(w => !w);
                setIsOutputActive(false);
                setIsWhiteboardActive(!showWhiteboard);
              }}
              style={{ 
                fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', 
                color: '#61dafb',
                padding: 'clamp(0.25rem, 0.8vw, 0.3rem)',
                minWidth: 'clamp(50px, 12vw, 70px)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px'
              }}
            >
              {showWhiteboard ? 'Output' : 'Whiteboard'}
            </ToolButton>
            
            {/* Timer - Between Whiteboard and Profile buttons */}
            {!isCompilerMode && (
              <div style={{
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                gap: '0.2rem', 
                padding: '0.3rem 0.5rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '6px', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                fontSize: 'clamp(0.65rem, 1.6vw, 0.75rem)', 
                flexShrink: 0
              }}>

                

                

              </div>
            )}
            
            {/* Profile Button - Next to Timer */}
            {!isCompilerMode && (
              <ToolButton
                title={`${role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${role === 'interviewer' ? (interviewData?.interviewerEmail || 'Interviewer') : (interviewData?.candidateEmail || 'Candidate')}`}
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                }}
                style={{
                  fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', 
                  color: showProfileDropdown ? '#9c27b0' : '#9c27b0',
                  padding: 'clamp(0.25rem, 0.8vw, 0.3rem)',
                  minWidth: 'clamp(40px, 10vw, 50px)',
                  background: showProfileDropdown ? 'rgba(156, 39, 176, 0.3)' : 'rgba(156, 39, 176, 0.15)',
                  border: showProfileDropdown ? '1px solid rgba(156, 39, 176, 0.6)' : '1px solid rgba(156, 39, 176, 0.3)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  if (!showProfileDropdown) {
                    e.target.style.background = 'rgba(156, 39, 176, 0.25)';
                    e.target.style.borderColor = 'rgba(156, 39, 176, 0.5)';
                    e.target.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showProfileDropdown) {
                    e.target.style.background = 'rgba(156, 39, 176, 0.15)';
                    e.target.style.borderColor = 'rgba(156, 39, 176, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }
                }}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  width="1.2em" 
                  height="1.2em" 
                  fill="currentColor" 
                  style={{ color: '#9c27b0' }}
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </ToolButton>
            )}
            
            
            {/* Copy ID Button - Only show for compiler mode */}
            {isCompilerMode && (
              <ToolButton
                title="Copy Compiler Session ID"
                onClick={() => {
                  if (onShareCompiler) {
                    onShareCompiler();
                  } else {
                    // Fallback: copy the interviewId/compilerId
                    navigator.clipboard.writeText(interviewId).then(() => {
                      // You can add a success message here if needed
                    }).catch(() => {
                      // Handle error if needed
                    });
                  }
                }}
                style={{ 
                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                  color: '#fff',
                  padding: 'clamp(0.3rem, 1vw, 0.4rem)',
                  minWidth: 'clamp(60px, 15vw, 80px)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px'
                }}
              >
                <svg 
                  viewBox="64 64 896 896" 
                  width="1em" 
                  height="1em" 
                  fill="currentColor" 
                  style={{ marginRight: '0.3rem', width: '0.9em', height: '0.9em' }}
                >
                  <path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path>
                </svg>
                Copy ID
              </ToolButton>
            )}

                             {/* REMOVED DUPLICATE FLOATING MOBILE PROFILE BUTTON */}
              

            </>
          )}
        </div>
      </div>
      
      {/* Desktop Layout - Horizontal Panels */}
      {!isMobile() && (
        <PanelGroup direction="horizontal" style={{ height: '100%' }}>
          {/* Code Editor Panel */}
          <Panel minSize={20} defaultSize={whiteboardMax ? 0 : 45} collapsible>
          <PanelBody
            isActive={isCodeEditorActive}
            onMouseEnter={() => setIsCodeEditorActive(true)}
              onMouseLeave={() => !isCodeEditorActive && setIsCodeEditorActive(false)}
            ref={codeEditorPanelBodyRef}
            style={{ height: '100%' }}
          >
            <div style={{ zIndex: 1, height: '100%', width: '100%' }}>
              <MonacoEditor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                theme="vs-dark"
                onChange={handleCodeChange}
                options={{ 
                  fontSize: 'clamp(14px, 2.5vw, 16px)',
                  minimap: { enabled: false }, 
                  quickSuggestions: false, 
                  scrollbar: { vertical: 'hidden' }
                }}
                onFocus={() => {
                  setIsCodeEditorActive(true);
                  setIsWhiteboardActive(false);
                  setIsOutputActive(false);
                }}
                onBlur={() => {
                  if (codeEditorPanelBodyRef.current && !codeEditorPanelBodyRef.current.contains(document.activeElement)) {
                       setIsCodeEditorActive(false);
                  }
               }}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </PanelBody>
        </Panel>
        <PanelResizeHandle style={{ width: 8, background: 'linear-gradient(90deg, rgba(97, 218, 251, 0.3), rgba(0, 122, 204, 0.3))', cursor: 'col-resize', borderRadius: 8 }} />
        {/* Output/Whiteboard Panel */}
        <Panel minSize={20} defaultSize={whiteboardMax ? 100 : 55} collapsible>
          <PanelBody style={{ 
            borderRadius: '18px', 
            padding: 'clamp(0.75rem, 2vw, 1rem)',
            height: '100%'
          }}>
            {showWhiteboard ? (
              <WhiteboardContainer
                isActive={isWhiteboardActive}
                onMouseEnter={() => setIsWhiteboardActive(true)}
                onMouseLeave={() => setIsWhiteboardActive(false)}
                onMouseDown={() => {
                  setIsWhiteboardActive(true);
                  setIsCodeEditorActive(false);
                  setIsOutputActive(false);
                }}
                  onMouseUp={() => setIsWhiteboardActive(false)}
                ref={whiteboardContainerRef}
              >
                <KonvaWhiteboard
                    width={window.innerWidth * (whiteboardMax ? 1 : Math.max(0.45, Math.min(0.5, 0.55)))}
                    height={window.innerHeight - (whiteboardMax ? Math.max(80, Math.min(100, window.innerHeight * 0.1)) : Math.max(150, Math.min(180, window.innerHeight * 0.2)))}
                  ref={canvasRef}
                  {...getStrokeProps()}
                />
              </WhiteboardContainer>
            ) : (
              <OutputBox
                isActive={isOutputActive}
                onMouseEnter={() => setIsOutputActive(true)}
                onMouseLeave={() => setIsOutputActive(false)}
                onMouseDown={() => {
                   setIsOutputActive(true);
                   setIsCodeEditorActive(false);
                   setIsWhiteboardActive(false);
                }}
                 ref={outputBoxRef}
              >
                {output ? output : 'Output will appear here.'}
                {!output && <div style={{ color: '#888' }}>No output available. Click "Run Code" to execute your code.</div>}
              </OutputBox>
            )}
          </PanelBody>
        </Panel>
      </PanelGroup>
      )}
      
      {/* Mobile Layout - Single Panel at a Time */}
      {isMobile() && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Mobile Toggle Buttons - Show only one at a time */}
                    <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'clamp(0.3rem, 1.2vw, 0.6rem)',
            gap: 'clamp(0.3rem, 1.5vw, 0.8rem)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            flexWrap: 'nowrap'
          }}>
            {mobileView === 'code' ? (
              <>
              <ToolButton
                  onClick={() => setMobileView('whiteboard')}
                  style={{ 
                    fontSize: 'clamp(0.8rem, 2vw, 1rem)', 
                    color: '#61dafb',
                    padding: 'clamp(0.3rem, 1.5vw, 0.6rem)',
                    minWidth: 'clamp(60px, 18vw, 100px)',
                    background: 'rgba(97, 218, 251, 0.1)',
                    border: '1px solid rgba(97, 218, 251, 0.3)',
                    borderRadius: '6px',
                    flexShrink: 0
                  }}
                >
                  Whiteboard/Compiler
              </ToolButton>
              <ToolButton
                  onClick={handleRunCode}
                  style={{ 
                    fontSize: 'clamp(0.8rem, 2vw, 1rem)', 
                    color: '#fff',
                    padding: 'clamp(0.3rem, 1.5vw, 0.6rem)',
                    minWidth: 'clamp(50px, 12vw, 80px)',
                    background: '#007acc',
                    border: '1px solid #007acc',
                    borderRadius: '6px',
                    flexShrink: 0
                  }}
                >
                  Run Code
                </ToolButton>
              </>
            ) : (
              <>
              <ToolButton
                  onClick={() => setMobileView('code')}
                  style={{ 
                    fontSize: 'clamp(0.8rem, 2vw, 1rem)', 
                    color: '#61dafb',
                    padding: 'clamp(0.3rem, 1.5vw, 0.6rem)',
                    minWidth: 'clamp(60px, 18vw, 100px)',
                    background: 'rgba(97, 218, 251, 0.1)',
                    border: '1px solid rgba(97, 218, 251, 0.3)',
                    borderRadius: '6px',
                    flexShrink: 0
                  }}
                >
                  Code Editor
              </ToolButton>
              <ToolButton
                  onClick={() => setShowWhiteboard(!showWhiteboard)}
                  style={{ 
                    fontSize: 'clamp(0.8rem, 2vw, 1rem)', 
                    color: '#61dafb',
                    padding: 'clamp(0.3rem, 1.5vw, 0.6rem)',
                    minWidth: 'clamp(60px, 18vw, 100px)',
                    background: 'rgba(97, 218, 251, 0.1)',
                    border: '1px solid rgba(97, 218, 251, 0.3)',
                    borderRadius: '6px',
                    flexShrink: 0
                  }}
              >
                {showWhiteboard ? 'Output' : 'Whiteboard'}
              </ToolButton>
              </>
            )}
            

          </div>
          
          {/* Code Editor View */}
          {mobileView === 'code' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <PanelBody
                isActive={isCodeEditorActive}
                onMouseEnter={() => setIsCodeEditorActive(true)}
                onMouseLeave={() => !isCodeEditorActive && setIsCodeEditorActive(false)}
                ref={codeEditorPanelBodyRef}
                style={{ flex: 1, height: '100%' }}
              >
                <div style={{ zIndex: 1, height: '100%', width: '100%' }}>
                  <MonacoEditor
                    height="100%"
                    language={language === 'cpp' ? 'cpp' : language}
                    value={code}
                    theme="vs-dark"
                    onChange={handleCodeChange}
                    options={{ 
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      minimap: { enabled: false }, 
                      quickSuggestions: false, 
                      scrollbar: { vertical: 'hidden' }
                    }}
                    onFocus={() => {
                      setIsCodeEditorActive(true);
                      setIsWhiteboardActive(false);
                      setIsOutputActive(false);
                    }}
                    onBlur={() => {
                      if (codeEditorPanelBodyRef.current && !codeEditorPanelBodyRef.current.contains(document.activeElement)) {
                           setIsCodeEditorActive(false);
                      }
                   }}
                  />
                </div>
              </PanelBody>
            </div>
          )}
          
          {/* Whiteboard/Compiler View */}
          {mobileView === 'whiteboard' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <PanelBody style={{ flex: 1, height: '100%', padding: 'clamp(0.75rem, 2vw, 1rem)', borderRadius: '18px' }}>
            {showWhiteboard ? (
              <WhiteboardContainer
                isActive={isWhiteboardActive}
                onMouseEnter={() => setIsWhiteboardActive(true)}
                onMouseLeave={() => setIsWhiteboardActive(false)}
                onMouseDown={() => {
                  setIsWhiteboardActive(true);
                  setIsCodeEditorActive(false);
                  setIsOutputActive(false);
                }}
                    onMouseUp={() => setIsWhiteboardActive(false)}
                ref={whiteboardContainerRef}
                    style={{ height: '100%', width: '100%' }}
              >
                <KonvaWhiteboard
                      width={Math.max(window.innerWidth - 48, 300)} // Full width minus padding, minimum 300px
                      height={Math.max(window.innerHeight - 250, 400)} // Full height minus headers, minimum 400px
                  ref={canvasRef}
                  {...getStrokeProps()}
                />
              </WhiteboardContainer>
            ) : (
              <OutputBox
                isActive={isOutputActive}
                onMouseEnter={() => setIsOutputActive(true)}
                onMouseLeave={() => setIsOutputActive(false)}
                onMouseDown={() => {
                   setIsOutputActive(true);
                   setIsCodeEditorActive(false);
                   setIsWhiteboardActive(false);
                }}
                 ref={outputBoxRef}
                     style={{ height: '100%', width: '100%' }}
                  >
                    {output ? output : 'Output will appear here.'}
                    {!output && <div style={{ color: '#888' }}>No output available. Click "Run Code" to execute your code.</div>}
                  </OutputBox>
            )}
          </PanelBody>
            </div>
          )}
        </div>
      )}
      
      {/* Share Link Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🔗</span>
                <h3 style={{
                  margin: 0,
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: 600
                }}>
                  Share Link with {role === 'interviewer' ? 'Candidate' : 'Interviewer'}
                </h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#fff'}
                onMouseLeave={(e) => e.target.style.color = '#888'}
              >
                ×
              </button>
            </div>
            
            {/* Modal Description */}
            <p style={{
              color: '#a0a0a0',
              marginBottom: '1.5rem',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              The {role === 'interviewer' ? 'candidate' : 'interviewer'} can use this link to join the interview session.
            </p>
            
            {/* URL Input and Copy Button */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <input
                type="text"
                value={`${window.location.origin}/interview/${interviewId}`}
                readOnly
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}/interview/${interviewId}`;
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    // You can add a toast notification here
                  }).catch(err => {
                    // Silent error handling for professional behavior
                  });
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#2c3e50',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.target.style.background = '#34495e'}
                onMouseLeave={(e) => e.target.style.background = '#2c3e50'}
              >
                <span>📋</span>
                Copy URL
              </button>
            </div>
            
            {/* Share Directly Button */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Interview Link',
                    text: 'Join the interview session',
                    url: `${window.location.origin}/interview/${interviewId}`
                  });
                } else {
                  // Fallback for browsers that don't support native sharing
                  const shareUrl = `${window.location.origin}/interview/${interviewId}`;
                  navigator.clipboard.writeText(shareUrl);
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <span>📤</span>
              Or Share Directly...
            </button>
          </div>
        </div>
      )}

      {/* Custom Exit Confirmation Modal */}
      {showExitModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)'
          }}>
            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '1rem',
                filter: 'drop-shadow(0 0 20px rgba(97, 218, 251, 0.5))'
              }}>
                🚪
              </div>
              <h3 style={{
                color: '#61dafb',
                fontSize: '1.3rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0'
              }}>
                Exit Session?
              </h3>
              <p style={{
                color: '#ccc',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                margin: 0
              }}>
                Are you sure you want to exit this session?
              </p>
            </div>

            {/* Session ID Display */}
            <div style={{
              background: 'rgba(97, 218, 251, 0.1)',
              border: '1px solid rgba(97, 218, 251, 0.2)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#888',
                fontSize: '0.8rem',
                margin: '0 0 0.5rem 0',
                fontWeight: '500'
              }}>
                Session ID (copy this to rejoin later):
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '0.75rem',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: '#61dafb',
                wordBreak: 'break-all',
                userSelect: 'all'
              }}>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  {interviewId}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(interviewId);
                    // You can add a success message here
                  }}
                  title="Copy session ID"
                  style={{
                    background: 'rgba(97, 218, 251, 0.2)',
                    border: '1px solid rgba(97, 218, 251, 0.3)',
                    borderRadius: '4px',
                    padding: '0.4rem 0.6rem',
                    color: '#61dafb',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(97, 218, 251, 0.3)';
                    e.target.style.borderColor = 'rgba(97, 218, 251, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(97, 218, 251, 0.2)';
                    e.target.style.borderColor = 'rgba(97, 218, 251, 0.3)';
                  }}
                >
                  <svg 
                    viewBox="64 64 896 896" 
                    width="0.8em" 
                    height="0.8em" 
                    fill="currentColor"
                  >
                    <path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path>
                  </svg>
                  Copy
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowExitModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '100px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowExitModal(false);
                  if (onBackToHome) {
                    onBackToHome();
                  }
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '100px',
                  boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
                }}
              >
                Exit Session
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Overlay for Profile Dropdown */}
      {showProfileDropdown && isMobile() && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998
          }}
          onClick={() => setShowProfileDropdown(false)}
        />
      )}
      
      {/* Profile Dropdown */}
      {showProfileDropdown && (
        <div 
          data-profile-dropdown
          style={{
            position: 'fixed',
            top: isMobile() ? '80px' : '60px',
            right: isMobile() ? '1rem' : '1rem',
            left: isMobile() ? '1rem' : 'auto',
            marginTop: isMobile() ? '0' : '0.5rem',
            background: '#1a1a1a',
            border: '2px solid #61dafb',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
            width: isMobile() ? 'calc(100vw - 2rem)' : '250px',
            minWidth: isMobile() ? '280px' : '250px',
            maxWidth: isMobile() ? '400px' : 'none',
            zIndex: 10000,
            backdropFilter: 'blur(10px)',
            transform: isMobile() ? 'none' : 'translateY(0)',
            animation: isMobile() ? 'slideInFromTop 0.3s ease-out' : 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* User Info Section */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)',
              fontWeight: '600',
              color: '#61dafb',
              marginBottom: '0.75rem'
            }}>
              {role === 'interviewer' ? 'Interviewer Profile' : 'Candidate Profile'}
            </div>
            
            <div style={{
              fontSize: 'clamp(0.7rem, 1.6vw, 0.8rem)',
              color: '#fff',
              opacity: 0.9,
              marginBottom: '0.5rem'
            }}>
              <strong>Name:</strong> {role === 'interviewer' ? (interviewData?.interviewerName || 'Interviewer') : (interviewData?.candidateName || 'Candidate')}
            </div>
            
            <div style={{
              fontSize: 'clamp(0.7rem, 1.6vw, 0.8rem)',
              color: '#fff',
              opacity: 0.9,
              marginBottom: '0.5rem'
            }}>
              <strong>Email:</strong> {role === 'interviewer' ? (interviewData?.interviewerEmail || 'Interviewer') : (interviewData?.candidateEmail || 'Candidate')}
            </div>
            
            <div style={{
              fontSize: 'clamp(0.7rem, 1.6vw, 0.8rem)',
              color: '#fff',
              opacity: 0.9
            }}>
              <strong>Role:</strong> {role === 'interviewer' ? 'Interviewer' : 'Candidate'}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ padding: '0.5rem' }}>
            <button
              onClick={() => {
                // Share interview link
                const interviewUrl = `${window.location.origin}/interview/${interviewId}`;
                navigator.clipboard.writeText(interviewUrl);
                setShowProfileDropdown(false);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(97, 218, 251, 0.1)',
                border: '1px solid rgba(97, 218, 251, 0.3)',
                borderRadius: '6px',
                color: '#61dafb',
                fontSize: 'clamp(0.7rem, 1.6vw, 0.8rem)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(97, 218, 251, 0.2)';
                e.target.style.borderColor = '#61dafb';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(97, 218, 251, 0.1)';
                e.target.style.borderColor = 'rgba(97, 218, 251, 0.3)';
              }}
            >
              🔗 Share Link
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to exit the interview?')) {
                  window.close();
                }
                setShowProfileDropdown(false);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '0.5rem',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '6px',
                color: '#ff6b6b',
                fontSize: 'clamp(0.7rem, 1.6vw, 0.8rem)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 107, 107, 0.2)';
                e.target.style.borderColor = '#ff6b6b';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 107, 107, 0.1)';
                e.target.style.borderColor = 'rgba(255, 107, 107, 0.3)';
              }}
            >
              🚪 Exit Interview
            </button>
          </div>
        </div>
      )}
    </Container>
  );
} 