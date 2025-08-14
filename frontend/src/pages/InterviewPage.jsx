import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { message, Spin, Card, Button, Space, Typography, Tag, Modal, Input } from 'antd';
import { ArrowLeftOutlined, UserOutlined, CalendarOutlined, ClockCircleOutlined, ShareAltOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import InterviewPanel from '../components/InterviewPanel';
import InterviewUrlDisplay from '../components/InterviewUrlDisplay';
import { useAuth } from '../contexts/AuthContext';
import { generateInterviewUrl } from '../utils/interviewUtils';
import io from 'socket.io-client';

const { Title, Text } = Typography;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #232526 0%, #1a1a1a 100%);
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Enable vertical scrolling */
  overflow-x: hidden; /* Hide horizontal scrollbar */
`;

const Header = styled.div`
  background: rgba(34, 40, 49, 0.9);
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
  flex-shrink: 0; /* Prevent header from shrinking */
`;

const InterviewInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InterviewTitle = styled(Title)`
  color: #61dafb !important;
  margin: 0 !important;
  font-size: 1.5rem !important;
`;

const InterviewDetails = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: #b0b8c9;
  font-size: 1rem;

  & .ant-typography {
    color: #e0e0e0;
    font-weight: 500;
  }
`;

const StatusTag = styled(Tag)`
  border-radius: 12px;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const HeaderButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-weight: 500;
  
  &:hover, &:focus {
    background: rgba(255, 255, 255, 0.2);
    border-color: #61dafb;
    color: #61dafb;
  }
`;

const ExitButton = styled(Button)`
  background: transparent;
  border: 1px solid #E53E3E;
  color: #E53E3E;
  font-weight: 600;

  &:hover, &:focus {
    background: #E53E3E;
    color: #fff;
  }
`;

const StartButton = styled(Button)`
  background: linear-gradient(90deg, #38ef7d, #11998e);
  border: none;
  color: #fff;
  font-weight: 600;
  
  &:hover, &:focus {
    background: linear-gradient(90deg, #44f189, #13a89a);
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(56, 239, 125, 0.3);
  }

  &:disabled {
    background: #555 !important;
    color: #999 !important;
    cursor: not-allowed !important;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const TimerControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
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

const StopButton = styled(StartButton)`
  background: linear-gradient(90deg, #e53e3e, #c53030);
  
  &:hover, &:focus {
    background: linear-gradient(90deg, #fc8181, #e53e3e);
  }
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

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Let InterviewPanel handle its own scrolling */
  position: relative;
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
  background: rgba(34, 40, 49, 0.85);
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const StyledInput = styled(Input)`
  .ant-input {
    text-align: center;
    font-size: 1.5rem;
    letter-spacing: 0.5rem;
  }
`;

const PasscodeModal = ({ interviewId, onSuccess, isInterviewer = false }) => {
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
      const response = await fetch(`/api/interviews/${interviewId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          passcode,
          interviewer: isInterviewer // Pass interviewer flag
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify passcode');
      }
      message.success('Access granted!');
      onSuccess(data.interview, isInterviewer);
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
            style={{ width: '100%', marginTop: '2rem' }}
            size="large"
          >
            {isInterviewer ? 'Join as Interviewer' : 'Join Interview'}
          </Button>
        </Spin>
      </PasscodeCard>
    </ModalContainer>
  );
};
// =================================================================================================

const RoleBadge = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: ${(props) => (props.isInterviewer ? 'linear-gradient(45deg, #61dafb, #007acc)' : 'linear-gradient(45deg, #f09819, #ff5858)')};
  color: #fff;
  padding: 0.3rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

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
        message.success('Timer has started!');
        setTimerData({
          startTime: data.startTime,
          elapsedSeconds: data.elapsedSeconds,
          isRunning: true,
        });
      }
    });

    s.on('timerStopped', (data) => {
      if (data.interviewId === interviewId) {
        message.info('Timer has been paused.');
        setTimerData({
          startTime: null,
          elapsedSeconds: data.elapsedSeconds,
          isRunning: false,
        });
      }
    });

    s.on('timerError', (data) => {
      message.error(data.message || 'A problem occurred when starting the timer.');
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

  const handleRestartTimer = () => {
    if (socket && interviewId) {
      socket.emit('restartTimer', { interviewId });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'blue';
      case 'in-progress':
        return 'orange';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleBack = () => {
    // Navigate back based on role
    if (isInterviewer) {
      navigate('/interviewer-dashboard');
    } else {
      navigate('/home');
    }
  };

  const handleShare = () => {
    setShowUrlModal(true);
  };

  const getInterviewUrl = () => {
    return generateInterviewUrl(interviewId);
  };

  const showPasscodeModal = () => {
    console.log('Manually showing passcode modal');
    setInterviewLoading(false);
    setAutoPasscodeTried(false);
  };

  // Check if user is coming from interviewer dashboard (no passcode needed)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromDashboard = params.get('fromDashboard');
    
    console.log('Dashboard useEffect - fromDashboard:', fromDashboard, 'isAuthenticated:', isAuthenticated);
    
    if (fromDashboard === 'true' && isAuthenticated) {
      // User is coming from dashboard, join directly as interviewer
      console.log('Joining as interviewer from dashboard');
      setIsInterviewer(true);
      setInterviewLoading(true);
      
      const fetchInterview = async () => {
        try {
          console.log('Fetching interview data for ID:', interviewId);
          const API_URL = import.meta.env.VITE_API_URL;
          console.log('Using API URL:', API_URL);
          const response = await fetch(`${API_URL}/api/interviews/${interviewId}`);
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
    }
  }, [location.search, interviewId, isAuthenticated]);

  // Auto-submit passcode from query param if present (for candidates)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const passcode = params.get('passcode');
    const fromDashboard = params.get('fromDashboard');
    
    console.log('Passcode useEffect - passcode:', passcode, 'fromDashboard:', fromDashboard, 'autoPasscodeTried:', autoPasscodeTried);
    
    if (passcode && !fromDashboard && !autoPasscodeTried) {
      // Try to join interview with passcode as candidate
      console.log('Auto-submitting passcode as candidate');
      const joinWithPasscode = async () => {
        setInterviewLoading(true);
        try {
          console.log('Joining interview with passcode:', passcode);
          const API_URL = import.meta.env.VITE_API_URL;
          console.log('Using API URL for passcode:', API_URL);
          const response = await fetch(`${API_URL}/api/interviews/${interviewId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              passcode,
              interviewer: false // Explicitly set as candidate
            }),
          });
          console.log('Passcode API response status:', response.status);
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || 'Failed to verify passcode');
          }
          console.log('Passcode verification successful:', data);
          handlePasscodeSuccess(data, false);
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
        isInterviewer={false} // Default to candidate
      />
    );
  }

  const { date, time } = formatDateTime(interview.scheduledTime);

  return (
    <Container>
      <Header>
        <InterviewInfo>
          <InterviewTitle level={2}>
            {interview.title}
          </InterviewTitle>
          <InterviewDetails>
            <DetailItem>
              <UserOutlined />
              <Text>
                {interview.candidate?.name || interview.candidateName || 'N/A'}
              </Text>
            </DetailItem>
            <DetailItem>
              <CalendarOutlined />
              <Text>{date}</Text>
            </DetailItem>
            <DetailItem>
              <ClockCircleOutlined />
              <Text>{time}</Text>
            </DetailItem>
            <StatusTag color={getStatusColor(interview.status)}>
              {interview.status.toUpperCase()}
            </StatusTag>
            
            <Timer timerData={timerData} />

            {isInterviewer && (
              <TimerControls>
                {!timerData.isRunning && (
                  <StartButton type="primary" onClick={handleStartTimer}>
                    {timerData.elapsedSeconds > 0 ? 'Resume' : 'Start'}
                  </StartButton>
                )}
                {timerData.isRunning && (
                  <StopButton danger type="primary" onClick={handleStopTimer}>
                    Pause
                  </StopButton>
                )}
                {(timerData.isRunning || timerData.elapsedSeconds > 0) && (
                  <HeaderButton onClick={handleRestartTimer}>
                    Restart
                  </HeaderButton>
                )}
              </TimerControls>
            )}
          </InterviewDetails>
        </InterviewInfo>
        <HeaderActions>
          <HeaderButton 
            icon={<ShareAltOutlined />} 
            onClick={handleShare}
          >
            Share Link
          </HeaderButton>
          <ExitButton
            danger
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            Exit
          </ExitButton>
        </HeaderActions>
      </Header>
      
      <ContentArea>
        <RoleBadge isInterviewer={isInterviewer}>
          {isInterviewer ? 'Interviewer' : 'Candidate'}
        </RoleBadge>
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