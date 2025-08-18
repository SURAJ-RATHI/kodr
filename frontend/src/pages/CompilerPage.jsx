import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, message, Card, Space, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

import InterviewPanel from '../components/InterviewPanel';
import { io } from 'socket.io-client';

const { Title, Text } = Typography;

export default function CompilerPage() {
  // Add CSS animation for pulse effect
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const { compilerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const [compilerData, setCompilerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(!compilerId);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Join compiler session if ID exists
  useEffect(() => {
    if (socket && compilerId) {
      setIsLoading(true);
      socket.emit('joinCompiler', { compilerId });
      
      socket.on('compilerJoined', (data) => {
        console.log('Joined compiler session:', data);
        setCompilerData(data);
        setIsLoading(false);
      });

      socket.on('compilerCodeUpdate', (data) => {
        // Handle code updates from other users
        console.log('Code updated by another user:', data);
      });

      socket.on('compilerParticipantJoined', (data) => {
        console.log('New participant joined:', data);
        setCompilerData(data);
      });

      socket.on('compilerParticipantLeft', (data) => {
        console.log('Participant left:', data);
        setCompilerData(data);
      });

      // Handle connection errors
      socket.on('connect_error', () => {
        message.error('Failed to connect to compiler session');
        setIsLoading(false);
      });

      return () => {
        socket.off('compilerJoined');
        socket.off('compilerCodeUpdate');
        socket.off('compilerParticipantJoined');
        socket.off('compilerParticipantLeft');
        socket.off('connect_error');
      };
    }
  }, [socket, compilerId]);

  const handleCreateCompiler = () => {
    // Generate a unique compiler ID
    const newCompilerId = 'compiler_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    navigate(`/compiler/${newCompilerId}`);
  };

  const handleJoinCompiler = (id) => {
    if (id.trim()) {
      navigate(`/compiler/${id.trim()}`);
      // Refresh the page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      message.error('Please enter a valid compiler ID');
    }
  };

  const handleShareCompiler = () => {
    // Copy just the compiler session ID instead of full URL
    navigator.clipboard.writeText(compilerId).then(() => {
      message.success('Compiler ID copied to clipboard!');
    }).catch(() => {
      message.error('Failed to copy compiler ID');
    });
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  if (showCreateForm) {
    return (
             <div style={{ 
         minHeight: '100vh', 
         display: 'flex', 
         alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center', 
         justifyContent: 'center',
         padding: window.innerWidth <= 768 ? '0rem' : '2rem',
         background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(45, 45, 45, 0.9))'
       }}>
                 <Card 
           style={{ 
             width: '100%', 
             maxWidth: window.innerWidth <= 768 ? '100%' : '480px',
             minHeight: window.innerWidth <= 768 ? '100vh' : 'auto',
             background: 'rgba(255, 255, 255, 0.08)',
             border: window.innerWidth <= 768 ? 'none' : '1px solid rgba(97, 218, 251, 0.2)',
             borderRadius: window.innerWidth <= 768 ? '0' : '16px',
             backdropFilter: 'blur(20px)',
             boxShadow: window.innerWidth <= 768 ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.3)'
           }}
           bodyStyle={{ 
             padding: window.innerWidth <= 768 ? '1rem' : '2rem',
             height: window.innerWidth <= 768 ? '100%' : 'auto',
             display: window.innerWidth <= 768 ? 'flex' : 'block',
             flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
           }}
         >
                     <div style={{ 
             textAlign: 'center', 
             marginBottom: window.innerWidth <= 768 ? '1rem' : '2rem',
             flex: window.innerWidth <= 768 ? '0 0 auto' : 'none'
           }}>
                         <div style={{ 
               fontSize: window.innerWidth <= 768 ? '2.5rem' : '3rem', 
               marginBottom: window.innerWidth <= 768 ? '0.5rem' : '1rem',
               filter: 'drop-shadow(0 0 20px rgba(97, 218, 251, 0.5))',
               fontFamily: 'monospace',
               fontWeight: 'bold',
               color: '#61dafb'
             }}>
               &lt;/&gt; kodr's
             </div>
                         <Title level={3} style={{ 
               color: '#61dafb', 
               marginBottom: window.innerWidth <= 768 ? '0.25rem' : '0.5rem',
               fontWeight: '600'
             }}>
               Code Compiler
             </Title>
             <Text style={{ 
               color: '#ccc',
               fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
               lineHeight: '1.5'
             }}>
               Create or join a real-time coding session
             </Text>
          </div>

                     <Space direction="vertical" size="large" style={{ 
             width: '100%',
             flex: window.innerWidth <= 768 ? '1 1 auto' : 'none',
             display: 'flex',
             flexDirection: 'column',
             justifyContent: window.innerWidth <= 768 ? 'space-between' : 'flex-start'
           }}>
                         <Button 
               type="primary" 
               size="large" 
               onClick={handleCreateCompiler}
               style={{ 
                 width: '100%', 
                 height: window.innerWidth <= 768 ? '48px' : '56px',
                 background: 'linear-gradient(135deg, #61dafb, #007acc)',
                 border: 'none',
                 fontSize: window.innerWidth <= 768 ? '1rem' : '1.1rem',
                 fontWeight: '600',
                 borderRadius: window.innerWidth <= 768 ? '8px' : '12px',
                 boxShadow: '0 4px 20px rgba(97, 218, 251, 0.3)',
                 transition: 'all 0.3s ease'
               }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 25px rgba(97, 218, 251, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(97, 218, 251, 0.3)';
              }}
            >
              ✨ Create New Session
            </Button>

                         <div style={{ 
               textAlign: 'center', 
               position: 'relative',
               margin: window.innerWidth <= 768 ? '1rem 0' : '1.5rem 0'
             }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)'
              }} />
              <Text style={{ 
                color: '#888',
                background: 'rgba(26, 26, 26, 0.9)',
                padding: '0 1rem',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                OR
              </Text>
            </div>

            <div>
                             <Input
                 placeholder="Enter session ID to join..."
                 size="large"
                 style={{ 
                   background: 'rgba(255, 255, 255, 0.08)',
                   border: '1px solid rgba(255, 255, 255, 0.15)',
                   borderRadius: window.innerWidth <= 768 ? '8px' : '12px',
                   color: '#fff',
                   fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                   height: window.innerWidth <= 768 ? '44px' : '48px'
                 }}
                 onPressEnter={(e) => handleJoinCompiler(e.target.value)}
               />
               <Button 
                 size="large" 
                 onClick={() => {
                   const input = document.querySelector('input');
                   if (input) handleJoinCompiler(input.value);
                 }}
                 style={{ 
                   width: '100%', 
                   marginTop: window.innerWidth <= 768 ? '0.75rem' : '1rem',
                   background: 'rgba(255, 255, 255, 0.1)',
                   border: '1px solid rgba(255, 255, 255, 0.2)',
                   color: '#61dafb',
                   height: window.innerWidth <= 768 ? '44px' : '48px',
                   borderRadius: window.innerWidth <= 768 ? '8px' : '12px',
                   fontWeight: '500',
                   transition: 'all 0.2s ease'
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
                🔗 Join Session
              </Button>
            </div>

                         <div style={{ 
               textAlign: 'center', 
               marginTop: window.innerWidth <= 768 ? 'auto' : '1rem',
               marginBottom: window.innerWidth <= 768 ? '2rem' : '0'
             }}>
              <Button 
                icon={<HomeOutlined />} 
                onClick={handleBackToHome}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#888',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                ← Back to Home
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    );
  }

  if (!compilerId) {
    return null;
  }

    return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Compiler Panel */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ textAlign: 'center' }}>
                             <div style={{
                 fontSize: '3rem',
                 marginBottom: '1rem',
                 animation: 'pulse 1.5s infinite',
                 fontFamily: 'monospace',
                 fontWeight: 'bold',
                 color: '#61dafb'
               }}>
                 &lt;/&gt; kodr
               </div>
              <div style={{
                color: '#61dafb',
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Connecting to Compiler Session...
              </div>
              <div style={{
                color: '#888',
                fontSize: '0.9rem'
              }}>
                Please wait while we establish the connection
              </div>
            </div>
          </div>
        ) : (
          <InterviewPanel 
            socket={socket}
            interviewId={compilerId}
            interviewData={compilerData}
            showVideoChat={false}
            role="developer"
            isCompilerMode={true}
            onShareCompiler={handleShareCompiler}
            onBackToHome={handleBackToHome}
          />
        )}
      </div>
    </div>
  );
}
