import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { message, Spin, Card, Button, Space, Typography, Modal, Input } from 'antd';
import { ArrowLeftOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import InterviewPanel from '../components/InterviewPanel';
import InterviewUrlDisplay from '../components/InterviewUrlDisplay';
import { useAuth } from '../contexts/AuthContext';
import { generateInterviewUrl } from '../utils/interviewUtils';
import io from 'socket.io-client';

/**
 * ROLE DETERMINATION LOGIC:
 * 
 * 1. INTERVIEWER Role:
 *    - URL contains: ?fromDashboard=true
 *    - User must be authenticated (isAuthenticated: true)
 *    - Automatically fetches interview data with auth token
 *    - No passcode required
 * 
 * 2. CANDIDATE Role:
 *    - URL contains: ?passcode=XXXXX (from email link)
 *    - OR: User clicks "Start Interview" from homepage
 *    - OR: User manually enters passcode in modal
 *    - Always requires passcode verification
 *    - Never requires authentication
 * 
 * 3. Default Behavior:
 *    - If no role indicators found → Default to CANDIDATE
 *    - Shows passcode modal for manual entry
 */

const { Text, Title } = Typography;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #232526 0%, #1a1a1a 100%);
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Enable vertical scrolling */
  overflow-x: hidden; /* Hide horizontal scrollbar */
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Let InterviewPanel handle its own scrolling */
  position: relative;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-direction: column;
  gap: 1rem;
`;

const LoadingActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-direction: column;
  gap: 1rem;
  color: #ff4d4f;
`;

const TimerDisplay = styled.div`
  color: #FFD700;
  font-weight: 700;
  font-size: 1.2rem;
  background: #232B3E;
  border-radius: 8px;
  padding: 0.4rem 1rem;
  margin-left: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Timer = ({ timerData }) => {
  const { startTime, elapsedSeconds, isRunning } = timerData;
  const [displayTime, setDisplayTime] = useState(elapsedSeconds || 0);
  const intervalRef = useRef();

  useEffect(() => {
    const clearTimer = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (isRunning) {
      clearTimer();
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const start = new Date(startTime);
        const currentElapsed = (now - start) / 1000;
        setDisplayTime((elapsedSeconds || 0) + currentElapsed);
      }, 1000);
    } else {
      clearTimer();
      setDisplayTime(elapsedSeconds || 0);
    }

    return () => clearTimer();
  }, [startTime, elapsedSeconds, isRunning]);
  
  const finalDisplayTime = isNaN(displayTime) || displayTime < 0 ? 0 : displayTime;
  const mins = String(Math.floor(finalDisplayTime / 60)).padStart(2, '0');
  const secs = String(Math.floor(finalDisplayTime % 60)).padStart(2, '0');

  return (
    <TimerDisplay>
      <span>⏰</span>
      <span>{mins}:{secs}</span>
    </TimerDisplay>
  );
};

// =================================================================================================
// PasscodeModal Component (Inlined)
// =================================================================================================
const ModalContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #232526 0%, #1a1a1a 100%);
`;

const PasscodeCard = styled.div`
  background: linear-gradient(135deg, #232526 0%, #1a1a1a 100%);
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const StyledInput = styled(Input)`
  .ant-input {
    text-align: center;
    font-size: 1.5rem;
    letter-spacing: 0.5rem;
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: #fff !important;
    border-radius: 12px !important;
    height: 48px;
  }
  
  .ant-input::placeholder {
    color: #fff !important;
  }
  
  .ant-input:focus,
  .ant-input:hover {
    border-color: #61dafb !important;
    box-shadow: 0 0 0 2px rgba(97, 218, 251, 0.2) !important;
  }
`;

const PasscodeModal = ({ interviewId, onSuccess, isInterviewer = false, onModeChange }) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!passcode) {
      setError('Please enter the passcode.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      console.log('PasscodeModal - Environment variables:', {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE
      });
      
      if (!API_URL) {
        throw new Error('VITE_API_URL environment variable is not set. Please check your .env file.');
      }
      
      console.log('PasscodeModal - Using API URL:', API_URL);
      console.log('PasscodeModal - Request body:', { passcode, interviewer: isInterviewer });
      
      const response = await fetch(`${API_URL}/api/interviews/${interviewId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          passcode,
          interviewer: isInterviewer // Pass interviewer flag
        }),
      });

      console.log('PasscodeModal - Response status:', response.status);
      
      // Check if response has content
      const responseText = await response.text();
      console.log('PasscodeModal - Response text:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText || 'No response body'}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Response text was:', responseText);
        throw new Error(`Invalid response from server: ${responseText || 'Empty response'}`);
      }

      message.success('Access granted!');
      
      // For candidates, ensure we have the full interview data
      if (!isInterviewer && data.interview) {
        // Use the interview data from the join API response
        onSuccess(data.interview, isInterviewer);
      } else {
        // Fallback for other cases
        onSuccess(data.interview || data, isInterviewer);
      }
    } catch (err) {
      console.error('Error joining interview:', err);
      setError(err.message || 'An incorrect passcode or error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer>
      <PasscodeCard>
        <Spin spinning={loading}>
          <Title level={3} style={{ color: '#61dafb' }}>
            {isInterviewer ? 'Join as Interviewer' : 'Enter Passcode'}
          </Title>
          <Text style={{ color: '#b0b8c9', display: 'block', marginBottom: '2rem' }}>
            {isInterviewer 
              ? 'Join this interview session as the interviewer.'
              : 'A passcode is required to join this interview session.'
            }
          </Text>
          <StyledInput
            prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />}
            placeholder="PASSCODE"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value.toUpperCase())}
            onPressEnter={handleJoin}
            size="large"
          />
          {error && <Text style={{ color: '#ff4d4f', display: 'block', marginTop: '1rem' }}>{error}</Text>}
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={handleJoin}
            loading={loading}
            style={{ 
              width: '100%', 
              marginTop: '2rem',
              background: 'linear-gradient(45deg, #61DAFB, #007ACC)',
              border: 'none',
              height: '48px',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '1rem'
            }}
            size="large"
          >
            {isInterviewer ? 'Join as Interviewer' : 'Join Interview'}
          </Button>
          
          {/* Interviewer sign-in option */}
          {!isInterviewer && (
            <div style={{ 
              marginTop: '1.5rem', 
              textAlign: 'center', 
              padding: '1rem', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px', 
              border: '1px solid rgba(255, 255, 255, 0.1)' 
            }}>
              <Text style={{ color: '#b0b8c9', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                Are you an interviewer?
              </Text>
              <Button 
                type="link" 
                style={{ 
                  padding: 0, 
                  height: 'auto', 
                  color: '#61dafb',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
                onClick={() => onModeChange(true)}
              >
                Sign in as Interviewer
              </Button>
            </div>
          )}
          
          {/* Back to candidate mode option */}
          {isInterviewer && (
            <div style={{ 
              marginTop: '1.5rem', 
              textAlign: 'center', 
              padding: '1rem', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px', 
              border: '1px solid rgba(255, 255, 255, 0.1)' 
            }}>
              <Text style={{ color: '#b0b8c9', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                Joining as candidate?
              </Text>
              <Button 
                type="link" 
                style={{ 
                  padding: 0, 
                  height: 'auto', 
                  color: '#61dafb',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
                onClick={() => onModeChange(false)}
              >
                Enter Passcode
              </Button>
            </div>
          )}
        </Spin>
      </PasscodeCard>
    </ModalContainer>
  );
};
// =================================================================================================



const InterviewPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [interview, setInterview] = useState(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [timerData, setTimerData] = useState({
    startTime: null,
    elapsedSeconds: 0,
    isRunning: false,
  });
  const [socket, setSocket] = useState(null);
  const [autoPasscodeTried, setAutoPasscodeTried] = useState(false);
  const [isInterviewer, setIsInterviewer] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(null);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (interviewLoading && !interview) {
      const timeout = setTimeout(() => {
        console.log('Loading timeout reached, showing passcode modal');
        setInterviewLoading(false);
      }, 10000); // 10 second timeout
      
      setLoadingTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [interviewLoading, interview]);

  const handlePasscodeSuccess = (data, interviewerFlag = false) => {
    console.log('handlePasscodeSuccess called with:', data, 'interviewer:', interviewerFlag);
    console.log('Setting interview data and interviewer flag');
    
    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
    
    setInterview(data);
    setIsInterviewer(interviewerFlag);
    setInterviewLoading(false);
    console.log('Interview loading set to false, interview data set');

    if (data.timer) {
      console.log('Setting timer data:', data.timer);
      setTimerData({
        startTime: data.timer.startTime || null,
        elapsedSeconds: data.timer.elapsedSeconds || 0,
        isRunning: data.timer.isRunning || false,
      });
    }

    // Connect to socket ONLY after successful authentication
    console.log('Creating socket connection');
    const API_URL = import.meta.env.VITE_API_URL ;
    const s = io(API_URL);
    setSocket(s);
    console.log('Socket created and set:', s);

    s.on('connect', () => {
      console.log('Socket connected:', s.id);
      s.emit('joinInterview', interviewId);
    });
    
    s.on('timerStarted', (data) => {
      if (data.interviewId === interviewId) {
        setTimerData({
          startTime: data.startTime,
          elapsedSeconds: data.elapsedSeconds,
          isRunning: true,
        });
      }
    });

    s.on('timerStopped', (data) => {
      if (data.interviewId === interviewId) {
        setTimerData({
          startTime: null,
          elapsedSeconds: data.elapsedSeconds,
          isRunning: false,
        });
      }
    });

      s.on('timerError', (data) => {
        console.error('Timer error:', data.message || 'A problem occurred when starting the timer.');
      });

    s.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    // Return a cleanup function for the socket
    return () => {
      if (s) {
        console.log('Disconnecting socket...');
        s.disconnect();
      }
    };
  };

  const handleStartTimer = () => {
    if (socket && interviewId && interview) {
      socket.emit('startTimer', { interviewId });
    }
  };

  const handleStopTimer = () => {
    if (socket && interviewId) {
      socket.emit('stopTimer', { interviewId });
    }
  };

  const handleBack = () => {
    // Navigate back based on role
    if (isInterviewer) {
      navigate('/interviewer-dashboard');
    } else {
      navigate('/home');
    }
  };

  const getInterviewUrl = () => {
    return generateInterviewUrl(interviewId);
  };

  const showPasscodeModal = () => {
    console.log('Manually showing passcode modal');
    setInterviewLoading(false);
    setAutoPasscodeTried(false);
  };

  // Determine user role and handle interview access
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromDashboard = params.get('fromDashboard');
    const passcode = params.get('passcode');
    
    console.log('Role determination useEffect - fromDashboard:', fromDashboard, 'passcode:', passcode, 'isAuthenticated:', isAuthenticated);
    
    // Clear role determination logic
    if (fromDashboard === 'true' && isAuthenticated) {
      // User is coming from dashboard → INTERVIEWER
      console.log('User identified as INTERVIEWER (from dashboard)');
      setIsInterviewer(true);
      setInterviewLoading(true);
      
      const fetchInterview = async () => {
        try {
          console.log('Fetching interview data for ID:', interviewId);
          const API_URL = import.meta.env.VITE_API_URL;
          console.log('Using API URL:', API_URL);
          
          // Get authentication token
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token found');
          }
          
          const response = await fetch(`${API_URL}/api/interviews/${interviewId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('API response status:', response.status);
          if (!response.ok) {
            throw new Error('Interview not found or server error');
          }
          const data = await response.json();
          console.log('Interview data fetched successfully:', data);
          handlePasscodeSuccess(data, true);
        } catch (err) {
          console.error('Error fetching interview:', err);
          setError('Interview not found or server error');
          setInterviewLoading(false);
        }
      };
      
      fetchInterview();
    } else if (passcode) {
      // User has passcode in URL → CANDIDATE
      console.log('User identified as CANDIDATE (passcode in URL)');
      setIsInterviewer(false);
      // This will be handled by the passcode useEffect below
    } else {
      // No specific role indicator → Default to CANDIDATE (will show passcode modal)
      console.log('User identified as CANDIDATE (default role)');
      setIsInterviewer(false);
    }
  }, [location.search, interviewId, isAuthenticated]);

  // Auto-submit passcode if provided in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const passcode = params.get('passcode');
    const fromDashboard = params.get('fromDashboard');
    
    console.log('Passcode useEffect - passcode:', passcode, 'fromDashboard:', fromDashboard, 'autoPasscodeTried:', autoPasscodeTried);
    
    if (passcode && !fromDashboard && !autoPasscodeTried) {
      // User has passcode → Always CANDIDATE role
      console.log('Auto-submitting passcode as CANDIDATE');
      setIsInterviewer(false); // Ensure role is set correctly
      
      const joinWithPasscode = async () => {
        setInterviewLoading(true);
        try {
          console.log('Joining interview with passcode:', passcode);
          
          // Extract interview data from URL parameters (sent from HomePage)
          const params = new URLSearchParams(location.search);
          const candidateName = params.get('candidateName');
          const candidateEmail = params.get('candidateEmail');
          const interviewerName = params.get('interviewerName');
          const interviewerEmail = params.get('interviewerEmail');
          const position = params.get('position');
          const scheduledTime = params.get('scheduledTime');
          const title = params.get('title');
          
          // Create mock interview object from URL parameters
          const mockInterviewData = {
            _id: interviewId,
            candidateName: decodeURIComponent(candidateName || ''),
            candidateEmail: decodeURIComponent(candidateEmail || ''),
            interviewerName: decodeURIComponent(interviewerName || ''),
            interviewerEmail: decodeURIComponent(interviewerEmail || ''),
            position: decodeURIComponent(position || ''),
            scheduledTime: decodeURIComponent(scheduledTime || ''),
            title: decodeURIComponent(title || ''),
            passcode: passcode
          };
          
          console.log('Created mock interview data from URL params:', mockInterviewData);
          
          // Call the join API to validate passcode
          const API_URL = import.meta.env.VITE_API_URL;
          const response = await fetch(`${API_URL}/api/interviews/${interviewId}/join`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ 
              passcode,
              interviewer: false
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || 'Passcode validation failed'}`);
          }
          
          console.log('Passcode validation successful for CANDIDATE');
          // Use the mock data instead of API response for display
          handlePasscodeSuccess(mockInterviewData, false);
        } catch (err) {
          console.error('Error joining interview with passcode:', err);
          setError(err.message || 'An incorrect passcode or error occurred.');
          setInterviewLoading(false);
        } finally {
          setAutoPasscodeTried(true);
        }
      };
      joinWithPasscode();
    }
  }, [location.search, interviewId, autoPasscodeTried]);

  // Show passcode modal if no authentication method found
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const passcode = params.get('passcode');
    const fromDashboard = params.get('fromDashboard');
    
    console.log('InterviewPage useEffect - params:', { passcode, fromDashboard, interview, interviewLoading, autoPasscodeTried });
    
    if (!passcode && !fromDashboard && !interview && !interviewLoading && !autoPasscodeTried) {
      // Show passcode modal for manual entry
      console.log('Showing passcode modal - no auth method found');
      // Don't set loading to true here, just show the modal directly
    }
  }, [location.search, interviewId, interview, interviewLoading, autoPasscodeTried]);

  // Loading state - only show when actually fetching data
  if (interviewLoading && !interview) {
    return (
      <LoadingContainer>
        <Spin size="large" />
        <Text style={{ color: '#61dafb' }}>Loading interview...</Text>
        <LoadingActions>
          <Button type="primary" onClick={() => setInterviewLoading(true)}>
            Refresh
          </Button>
          <Button onClick={showPasscodeModal} icon={<LockOutlined />}>
            Enter Passcode
          </Button>
          <Button onClick={handleBack} icon={<ArrowLeftOutlined />}>
            Back to {isInterviewer ? 'Dashboard' : 'Home'}
          </Button>
        </LoadingActions>
      </LoadingContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorContainer>
        <Title level={3} style={{ color: '#ff4d4f' }}>{error}</Title>
        <Button type="primary" onClick={handleBack} icon={<ArrowLeftOutlined />}>
          Back to {isInterviewer ? 'Dashboard' : 'Home'}
        </Button>
      </ErrorContainer>
    );
  }

  // Show passcode modal if no interview loaded yet and no loading in progress
  if (!interview && !interviewLoading) {
    console.log('Rendering PasscodeModal - no interview loaded and not loading');
    return (
      <PasscodeModal 
        interviewId={interviewId} 
        onSuccess={handlePasscodeSuccess}
        isInterviewer={isInterviewer} // Use current interviewer state
        onModeChange={setIsInterviewer} // Allow switching between modes
      />
    );
  }

  return (
    <Container>
      <ContentArea>

        


        {socket && (
          <InterviewPanel 
            socket={socket} 
            interviewId={interviewId} 
            interviewData={interview} 
            role={isInterviewer ? 'interviewer' : 'candidate'}
          />
        )}
      </ContentArea>

      <Modal
        open={showUrlModal}
        onCancel={() => setShowUrlModal(false)}
        footer={null}
        centered
        width={600}
        closable={false}
        styles={{ 
          body: { background: 'transparent', padding: 0 },
          content: { background: 'transparent', boxShadow: 'none' },
        }}
      >
        <InterviewUrlDisplay
          interviewUrl={getInterviewUrl()}
          interviewTitle={interview?.title || 'Interview'}
          onCopy={(url) => console.log('URL copied:', url)}
          onShare={(url) => console.log('URL shared:', url)}
          onClose={() => setShowUrlModal(false)}
        />
      </Modal>
    </Container>
  );
};

export default InterviewPage; 