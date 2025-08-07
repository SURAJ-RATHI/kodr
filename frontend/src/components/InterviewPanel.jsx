import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import MonacoEditor from '@monaco-editor/react';
import KonvaWhiteboard from './KonvaWhiteboard';
import { ClipLoader } from 'react-spinners';
import styled from '@emotion/styled';
import { FaCode, FaPencilAlt, FaHighlighter, FaEraser, FaMinus, FaArrowRight, FaUndo, FaRedo, FaTrash, FaPalette, FaExpand, FaCompress, FaSquare, FaCircle, FaTerminal } from 'react-icons/fa';
import VideoChat from './VideoChat';

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #232526 0%, #1a1a1a 100%);
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif; /* Assuming Inter font is used */
`;

const PanelHeader = styled.div`
  background: rgba(34, 40, 49, 0.7);
  color: #61dafb; /* Match homepage title color */
  font-weight: 800; /* Match homepage title font weight */
  font-size: 1.5rem; /* Slightly larger font size */
  padding: 1.2rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* Softer border */
  display: flex;
  align-items: center;
  justify-content: space-between;
  letter-spacing: 0.01em;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3); /* Darker shadow */
  border-radius: 18px 18px 0 0;
  backdrop-filter: blur(8px);
`;

const PanelBody = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.05); /* Match feature card background */
  padding: 1.5rem;
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
`;

const Button = styled.button`
  background: linear-gradient(45deg, #61DAFB, #007ACC); /* Match homepage button gradient */
  color: #fff;
  border: none;
  border-radius: 8px; /* Match homepage button border radius */
  padding: 0.8rem 1.8rem; /* Adjusted padding */
  font-weight: 700;
  font-size: 1.1rem; /* Adjusted font size */
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
`;

const ToggleButton = styled(Button)`
  margin-left: 0;
  margin-right: 0.7rem;
  padding: 0.6rem 1.2rem;
  font-size: 1.05rem;
  background: rgba(255, 255, 255, 0.1); /* Different background for toggle button */
  border: 1px solid rgba(255, 255, 255, 0.2); /* Border for toggle button */
  &:hover {
    background: rgba(255, 255, 255, 0.2); /* Hover effect for toggle button */
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
  }
`;

const OutputBox = styled.div`
  background: rgba(24, 28, 32, 0.95); /* Keep output box background */
  color: #fff;
  border-radius: 14px;
  padding: 1.3rem;
  min-height: 120px;
  font-family: 'Fira Mono', 'Consolas', monospace;
  font-size: 1.12rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); /* Darker shadow */
  border: 2px solid rgba(255, 255, 255, 0.1); /* Add border for consistency */
  transition: border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out;

  ${({ isActive }) => isActive && `
    border-color: #61dafb; /* Highlight color when active */
    box-shadow: 0 0 15px rgba(97, 218, 251, 0.7); /* Add a glow effect */
  `}

  &:hover {
    border-color: rgba(97, 218, 251, 0.5); /* Subtle highlight on hover */
    box-shadow: 0 0 10px rgba(97, 218, 251, 0.3); /* Subtle glow on hover */
  }
`;

const WhiteboardContainer = styled.div`
  width: 100%;
  height: 100%;
  background: rgba(34, 40, 49, 0.95); /* Keep whiteboard background */
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3); /* Darker shadow */
  transition: box-shadow 0.3s, background 0.3s, border-color 0.3s ease-in-out;
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: default; /* Set default cursor */

  ${({ isActive }) => isActive && `
    border-color: #61dafb; /* Highlight color when active */
    box-shadow: 0 0 15px rgba(97, 218, 251, 0.7); /* Increase glow effect */
  `}

  &:hover {
    border-color: rgba(97, 218, 251, 0.5); /* Subtle highlight on hover */
    box-shadow: 0 0 10px rgba(97, 218, 251, 0.3); /* Subtle glow on hover */
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
  margin-right: 1rem;
  padding: 0.5rem 2rem 0.5rem 0.8rem; /* Adjusted padding for width */
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  font-size: 1rem;
  appearance: none; /* Remove default arrow */
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.362%22%20height%3D%22292.362%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287.217%20195.883c-2.928%202.929-6.768%204.394-10.606%204.394s-7.678-1.465-10.606-4.394L146.18%2075.802L26.354%20195.883c-2.928%202.929-6.768%204.394-10.606%204.394s-7.678-1.465-10.606-4.394c-5.858-5.858-5.858-15.355%200-21.213L135.573%204.394c5.858-5.858%2015.355-5.858%2021.213%200l129.218%20170.276c5.857%205.858%205.857%2015.355%200%2021.213z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 0.7em top 50%;
  background-size: 0.65em auto;

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
  }

  & option {
    background: #1a1a1a;
    color: #fff;
  }
`;

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

const whiteboardTools = [
  { name: 'pencil', icon: <FaPencilAlt />, label: 'Pencil', shortcut: 1 },
  { name: 'highlighter', icon: <FaHighlighter />, label: 'Highlighter', shortcut: 2 },
  { name: 'eraser', icon: <FaEraser />, label: 'Eraser', shortcut: 3 },
  { name: 'line', icon: <FaMinus />, label: 'Line', shortcut: 4 },
  { name: 'arrow', icon: <FaArrowRight />, label: 'Arrow', shortcut: 5 },
  { name: 'square', icon: <FaSquare />, label: 'Square', shortcut: 6 },
  { name: 'circle', icon: <FaCircle />, label: 'Circle', shortcut: 7 },
  { name: 'undo', icon: <FaUndo />, label: 'Undo', shortcut: 8 },
  { name: 'redo', icon: <FaRedo />, label: 'Redo', shortcut: 9 },
  { name: 'delete', icon: <FaTrash />, label: 'Delete' },
];

const sampleCode = {
  javascript: `// Write your JavaScript code here\nconsole.log("Hello, world!");\n\nfunction add(a, b) {\n  return a + b;\n}\n\nconsole.log(add(5, 10));
`,
  python: `# Write your Python code here\nprint("Hello, world!")\n\ndef subtract(a, b):\n  return a - b\n\nprint(subtract(10, 5))
`,
  cpp: `// Write your C++ code here\n#include <iostream>\n\nint main() {\n  std::cout << "Hello, world!" << std::endl;\n  return 0;\n}
`,
  java: `// Write your Java code here\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}
`,
  c: `// Write your C code here\n#include <stdio.h>\n\nint main() {\n  printf("Hello, world!");\n  return 0;\n}
`,
  // Add more languages here
  go: `// Write your Go code here\npackage main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, world!")\n}
`,
  ruby: `# Write your Ruby code here\nputs "Hello, world!"
`,
  swift: `// Write your Swift code here\nimport Foundation\n\nprint("Hello, world!")
`,
  kotlin: `// Write your Kotlin code here\nfun main() {\n  println("Hello, world!")\n}
`,
};

export default function InterviewPanel({ socket, interviewId, interviewData, role: propRole, showVideoChat = true }) {
  const { userRole, selectedRole } = useAuth();
  const role = selectedRole || propRole || userRole;
  const [language, setLanguage] = useState(interviewData?.code?.language || 'javascript');
  const [code, setCode] = useState(interviewData?.code?.content || '// Start coding here...');
  const [output, setOutput] = useState('> Ready to code...\n');
  const [loading, setLoading] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [whiteboardMax, setWhiteboardMax] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#007acc');
  const [shapeMsg, setShapeMsg] = useState('');
  const canvasRef = useRef();
  const [isCodeEditorActive, setIsCodeEditorActive] = useState(false);
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [isOutputActive, setIsOutputActive] = useState(false);
  const codeEditorPanelBodyRef = useRef(null);
  const whiteboardContainerRef = useRef(null);
  const outputBoxRef = useRef(null);
  const [historyStep, setHistoryStep] = useState(0);
  const [isWhiteboardMaximized, setIsWhiteboardMaximized] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleCodeUpdate = (data) => {
      if (data.interviewId === interviewId) {
        setCode(data.code);
        setLanguage(data.language);
      }
    };

    const handleCodeOutput = (data) => {
      console.log('Received codeOutput:', data);
      setOutput(data.output);
      setLoading(false);
    };

    const handleWhiteboardUpdate = (data) => {
      if (data.interviewId === interviewId) {
        setWhiteboardShapes(data.shapes);
      }
    };

    const handleTimerUpdate = (data) => {
      // Logic to handle timer updates from other clients if needed in the future
      console.log('Timer update received in panel:', data);
    };

    socket.on('codeUpdate', handleCodeUpdate);
    socket.on('codeOutput', handleCodeOutput);
    socket.on('whiteboardUpdate', handleWhiteboardUpdate);
    socket.on('timerUpdate', handleTimerUpdate);

    return () => {
      socket.off('codeUpdate', handleCodeUpdate);
      socket.off('codeOutput', handleCodeOutput);
      socket.off('whiteboardUpdate', handleWhiteboardUpdate);
      socket.off('timerUpdate', handleTimerUpdate);
    };
  }, [socket, interviewId]);

  // Update sample code when language changes
  useEffect(() => {
    setCode(sampleCode[language] || '// Write your code here');
  }, [language]);

  // Keyboard shortcuts for tool selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < whiteboardTools.length) {
        setTool(whiteboardTools[idx].name);
        if (["line","arrow","square","circle"].includes(whiteboardTools[idx].name)) {
          setShapeMsg('Shape drawing coming soon!');
          setTimeout(() => setShapeMsg(''), 1500);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Run Code
  const handleRunCode = () => {
    setLoading(true);
    setOutput('');
    setShowWhiteboard(false); // Ensure output is visible
    setIsOutputActive(true); // Set output as active
    setIsCodeEditorActive(false); // Deactivate code editor
    setIsWhiteboardActive(false); // Deactivate whiteboard
    console.log('Run Code clicked. Socket:', socket, 'interviewId:', interviewId, 'language:', language, 'code:', code);
    if (socket) {
      socket.emit('executeCode', { interviewId, language, code });
    }
  };

  // Whiteboard tool actions
  const handleTool = (toolName) => {
    setTool(toolName);
    if (["line","arrow","square","circle"].includes(toolName)) {
      setShapeMsg('Shape drawing coming soon!');
      setTimeout(() => setShapeMsg(''), 1500);
      return;
    }
    if (!canvasRef.current) return;
    if (toolName === 'undo') canvasRef.current.undo();
    else if (toolName === 'redo') canvasRef.current.redo();
    else if (toolName === 'delete') canvasRef.current.clearCanvas();
    // Pencil, highlighter, eraser handled by props
  };

  // Whiteboard props
  const getStrokeProps = () => {
    if (tool === 'highlighter') return { strokeWidth: 10, strokeColor: color + '88', eraser: false };
    if (tool === 'eraser') return { eraser: true, eraserWidth: 16 };
    return { strokeWidth: 4, strokeColor: color, eraser: false };
  };

  const activeTool = whiteboardTools.find(t => t.name === tool);

  // Handle code changes and emit socket events
  const handleCodeChange = (value) => {
    setCode(value);
    if (socket) {
      socket.emit('codeUpdate', {
        interviewId,
        code: value,
        language,
      });
    }
  };

  // Handle language changes and emit socket events
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (socket) {
      socket.emit('codeUpdate', {
        interviewId,
        code,
        language: newLanguage,
      });
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    // ... existing code ...
  };

  return (
    <Container>
      {/* Video Chat Overlay */}
      {showVideoChat && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, background: 'rgba(34,40,49,0.95)', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.4)', padding: 8 }}>
          <VideoChat socket={socket} interviewId={interviewId} userId={role || 'user'} />
        </div>
      )}
      <PanelGroup direction="horizontal" style={{ height: '100%' }}>
        {/* Code Editor Panel */}
        <Panel minSize={20} defaultSize={whiteboardMax ? 0 : 45} collapsible>
          <PanelHeader>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.4rem', color: '#61dafb' }}>
              <span style={{ fontSize: '1.5em', color: '#61dafb' }}>&lt;/&gt;</span> Koder
              <span style={{ marginLeft: '1.5rem', fontSize: '1rem', color: '#a0a0a0', fontWeight: 500 }}>
                Role: {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unknown'}
              </span>
            </span>
            <div>
              <LanguageSelect
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </LanguageSelect>
              <Button onClick={handleRunCode}>Run Code</Button>
            </div>
          </PanelHeader>
          {/* Role-based feature toggling */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0.5rem 2rem 0.5rem 0', gap: '1rem' }}>
            {role === 'interviewer' && (
              <Button style={{ background: 'linear-gradient(45deg, #00C853, #009688)' }} onClick={() => alert('Interview started!')}>
                Start Interview
              </Button>
            )}
          </div>
          <PanelBody
            isActive={isCodeEditorActive}
            onMouseEnter={() => setIsCodeEditorActive(true)}
            onMouseLeave={() => !isCodeEditorActive && setIsCodeEditorActive(false)} // Only deactivate on mouse leave if not focused
            ref={codeEditorPanelBodyRef}
          >
            <MonacoEditor
              height="calc(100vh - 150px)" /* Adjusted height */
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              theme="vs-dark"
              onChange={handleCodeChange}
              options={{ fontSize: 16, minimap: { enabled: false }, quickSuggestions: false, scrollbar: { vertical: 'hidden' } /* Added options */ }}
              onFocus={() => {
                setIsCodeEditorActive(true);
                setIsWhiteboardActive(false);
                setIsOutputActive(false);
              }}
              onBlur={() => {
                // Only deactivate code editor if mouse is not currently hovering over it
                if (codeEditorPanelBodyRef.current && !codeEditorPanelBodyRef.current.contains(document.activeElement)) {
                     setIsCodeEditorActive(false);
                }
             }}
            />
          </PanelBody>
        </Panel>
        <PanelResizeHandle style={{ width: 8, background: 'linear-gradient(90deg, rgba(97, 218, 251, 0.3), rgba(0, 122, 204, 0.3))', cursor: 'col-resize', borderRadius: 8 }} />
        {/* Output/Whiteboard Panel */}
        <Panel minSize={20} defaultSize={whiteboardMax ? 100 : 55} collapsible>
          <PanelHeader style={{ borderRadius: '18px 18px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.01em', color: '#a0a0a0' }}>
              {showWhiteboard ? 'Whiteboard' : 'Output'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ToolButton
                title={whiteboardMax ? 'Minimize Whiteboard' : 'Maximize Whiteboard'}
                onClick={() => setWhiteboardMax(m => !m)}
                style={{ fontSize: '1.3rem', color: '#a0a0a0' }}
              >
                {whiteboardMax ? <FaCompress /> : <FaExpand />}
              </ToolButton>
              <ToolButton
                title={showWhiteboard ? 'Show Output' : 'Show Whiteboard'}
                onClick={() => {
                  setShowWhiteboard(w => !w);
                  setIsOutputActive(false); // Deactivate output when toggling to whiteboard
                  setIsWhiteboardActive(!showWhiteboard); // Activate whiteboard if showing
                }}
                style={{ fontSize: '1.2rem', color: '#61dafb' }}
              >
                {showWhiteboard ? 'Output' : 'Whiteboard'}
              </ToolButton>
            </span>
          </PanelHeader>
          <PanelBody style={{ height: '100%', padding: '1.5rem', borderRadius: '0 0 18px 18px' }}>
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
                onMouseUp={() => setIsWhiteboardActive(false)} // Deactivate on mouse up
                ref={whiteboardContainerRef}
              >
                <KonvaWhiteboard
                  width={window.innerWidth * (whiteboardMax ? 1 : 0.55)}
                  height={window.innerHeight - (whiteboardMax ? 100 : 180)}
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
              >{output || 'Output will appear here.'}</OutputBox>
            )}
          </PanelBody>
        </Panel>
      </PanelGroup>
    </Container>
  );
} 