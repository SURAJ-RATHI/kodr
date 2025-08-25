import { motion } from 'framer-motion'
import styled from '@emotion/styled'
import { useState } from 'react';
import { Modal, Input, Button as AntdButton, message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL ;

// Custom styles for dark theme inputs
const darkInputStyles = `
  .dark-input .ant-input {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: #fff !important;
    border-radius: 12px !important;
  }
  
  .dark-input .ant-input::placeholder {
    color: #fff !important;
  }
  
  .dark-input .ant-input:focus,
  .dark-input .ant-input:hover {
    border-color: #61dafb !important;
    box-shadow: 0 0 0 2px rgba(97, 218, 251, 0.2) !important;
  }
  
  .dark-modal .ant-modal-title {
    color: #61dafb !important;
  }
  
  .dark-modal .ant-modal-close {
    color: rgba(255, 255, 255, 0.6) !important;
  }
  
  .dark-modal .ant-modal-close:hover {
    color: #61dafb !important;
  }
`;

const Footer = styled.footer`
  width: 100%;
  padding: clamp(1rem, 3vw, 1.5rem) 0 clamp(0.75rem, 2vw, 1rem) 0;
  text-align: center;
  color: #888;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  background: transparent;
  margin-top: clamp(2rem, 6vw, 4rem);
  letter-spacing: 0.02em;
  
  a {
    color: #61dafb;
    text-decoration: none;
    margin-left: 0.3em;
    &:hover {
      text-decoration: underline;
    }
  }
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    margin-top: 2rem;
    padding: 1rem 0 0.75rem 0;
  }
  
  @media (max-width: 480px) {
    margin-top: 1.5rem;
    padding: 0.75rem 0 0.5rem 0;
    font-size: 0.8rem;
  }
`;

const HomeContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 4vw, 2rem);
  text-align: center;

  @media (max-width: 900px) {
    padding: clamp(1rem, 3vw, 1.5rem);
  }

  @media (max-width: 600px) {
    padding: clamp(0.75rem, 2vw, 1rem);
  }
  
  @media (max-width: 480px) {
    padding: clamp(0.5rem, 1.5vw, 0.75rem);
  }
`

const Title = styled(motion.h1)`
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 800;
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
  background: linear-gradient(45deg, #61DAFB, #007ACC);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(97, 218, 251, 0.3);
  position: relative;
  display: flex;
  align-items: center;
  gap: clamp(0.3rem, 1vw, 0.5rem);

  &::after {
    content: '';
    position: absolute;
    bottom: clamp(-8px, -2vw, -10px);
    left: 50%;
    transform: translateX(-50%);
    width: clamp(60px, 15vw, 100px);
    height: clamp(3px, 1vw, 4px);
    background: linear-gradient(45deg, #61DAFB, #007ACC);
    border-radius: clamp(1px, 0.5vw, 2px);
  }

  .code-brackets {
    font-size: clamp(2rem, 6vw, 3.5rem);
    font-weight: 900;
    color: #61DAFB;
    opacity: 1;
    text-shadow: 0 0 4px #61dafb, 0 0 8px #007acc55;
    margin-right: clamp(0.2rem, 0.5vw, 0.3rem);
    animation: blinkLogo 1.2s infinite alternate;
  }

  @keyframes blinkLogo {
    0% { opacity: 1; }
    100% { opacity: 0.3; }
  }

  @media (max-width: 900px) {
    font-size: clamp(2.5rem, 6vw, 3.2rem);
    .code-brackets { font-size: clamp(1.8rem, 4vw, 2.2rem); }
  }
  
  @media (max-width: 600px) {
    font-size: clamp(2rem, 5vw, 2.1rem);
    .code-brackets { font-size: clamp(1.2rem, 3vw, 1.3rem); }
  }
  
  @media (max-width: 480px) {
    font-size: clamp(1.8rem, 4.5vw, 2rem);
    .code-brackets { font-size: clamp(1rem, 2.5vw, 1.2rem); }
    gap: 0.2rem;
  }
`

const Subtitle = styled(motion.p)`
  font-size: clamp(1.125rem, 3vw, 1.5rem);
  color: #a0a0a0;
  margin-bottom: clamp(2rem, 5vw, 3rem);
  max-width: clamp(400px, 80vw, 600px);
  line-height: 1.6;

  @media (max-width: 900px) {
    font-size: clamp(1rem, 2.5vw, 1.1rem);
    margin-bottom: clamp(1.5rem, 4vw, 2rem);
  }
  
  @media (max-width: 600px) {
    font-size: clamp(0.9rem, 2.2vw, 1rem);
    margin-bottom: clamp(1rem, 3vw, 1.2rem);
  }
  
  @media (max-width: 480px) {
    font-size: clamp(0.8rem, 2vw, 0.9rem);
    margin-bottom: clamp(0.75rem, 2.5vw, 1rem);
  }
`

const ButtonContainer = styled.div`
  display: flex;
  gap: clamp(1rem, 3vw, 2rem);
  margin-top: clamp(1.5rem, 4vw, 2rem);

  @media (max-width: 600px) {
    flex-direction: column;
    gap: clamp(0.75rem, 2vw, 1rem);
    width: 100%;
    align-items: center;
  }
  
  @media (max-width: 480px) {
    gap: 0.75rem;
    margin-top: clamp(1rem, 3vw, 1.5rem);
  }
`

const Button = styled(motion.button)`
  padding: clamp(0.75rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem);
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  border: none;
  border-radius: clamp(6px, 1.5vw, 8px);
  cursor: pointer;
  background: ${props => props.primary 
    ? 'linear-gradient(45deg, #61DAFB, #007ACC)' 
    : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border: ${props => props.primary ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'};
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: clamp(0.3rem, 1vw, 0.5rem);

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
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }

  .button-icon {
    font-size: clamp(1rem, 2.5vw, 1.2rem);
  }

  @media (max-width: 900px) {
    font-size: clamp(0.9rem, 2.2vw, 1rem);
    padding: clamp(0.7rem, 2vw, 0.8rem) clamp(1rem, 3vw, 1.2rem);
  }
  
  @media (max-width: 600px) {
    font-size: clamp(0.85rem, 2vw, 0.95rem);
    padding: clamp(0.6rem, 1.8vw, 0.7rem) clamp(0.8rem, 2.5vw, 1rem);
    width: clamp(80%, 90%, 90%);
    justify-content: center;
  }
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
    padding: 0.6rem 0.8rem;
    width: 85%;
  }
`

const FeatureGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 40vw, 280px), 1fr));
  gap: clamp(1.5rem, 4vw, 2rem);
  margin-top: clamp(2rem, 6vw, 4rem);
  width: 100%;
  max-width: 1200px;

  @media (max-width: 900px) {
    gap: clamp(1rem, 3vw, 1.2rem);
    margin-top: clamp(1.5rem, 4vw, 2rem);
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: clamp(0.75rem, 2vw, 1rem);
    margin-top: clamp(1rem, 3vw, 1.2rem);
    max-width: 98vw;
  }
  
  @media (max-width: 480px) {
    gap: 0.75rem;
    margin-top: 1rem;
    max-width: 95vw;
  }
`

const FeatureCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  padding: clamp(1.5rem, 4vw, 2rem);
  border-radius: clamp(8px, 2vw, 12px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(97, 218, 251, 0.3);
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(97, 218, 251, 0.2);
  }

  &:active {
    transform: translateY(-2px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(97, 218, 251, 0.1),
      transparent
    );
    transform: translateX(-100%);
    transition: 0.5s;
  }

  &:hover::before {
    transform: translateX(100%);
  }

  h3 {
    color: #61DAFB;
    margin-bottom: clamp(0.75rem, 2vw, 1rem);
    font-size: clamp(1.25rem, 3vw, 1.5rem);
    display: flex;
    align-items: center;
    gap: clamp(0.3rem, 1vw, 0.5rem);

    &::before {
      content: '⚡';
      font-size: clamp(1rem, 2.5vw, 1.2rem);
    }
  }

  p {
    color: #a0a0a0;
    line-height: 1.6;
    font-size: clamp(0.875rem, 2.2vw, 1rem);
  }

  @media (max-width: 900px) {
    padding: clamp(1rem, 3vw, 1.2rem);
    h3 { font-size: clamp(1.1rem, 2.5vw, 1.1rem); }
    p { font-size: clamp(0.9rem, 2.2vw, 0.98rem); }
  }
  
  @media (max-width: 600px) {
    padding: clamp(0.8rem, 2.5vw, 0.8rem);
    h3 { font-size: clamp(1rem, 2.5vw, 1rem); }
    p { font-size: clamp(0.85rem, 2vw, 0.93rem); }
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    h3 { font-size: 0.9rem; }
    p { font-size: 0.8rem; }
  }
`

const HomePage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8
      }
    }
  }

  const [isPasscodeModalVisible, setIsPasscodeModalVisible] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeLoading, setPasscodeLoading] = useState(false);
  const [isInterviewerMode, setIsInterviewerMode] = useState(false);

  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('startInterview') === 'true') {
      setIsPasscodeModalVisible(true);
    }
  }, [location.search]);

  // Inject custom styles for dark theme
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = darkInputStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleStartInterviewClick = () => {
    setIsPasscodeModalVisible(true);
  };

  const handlePasscodeSubmit = async () => {
    if (!passcode) {
      message.error('Please enter the passcode.');
      return;
    }
    setPasscodeLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/interviews/find-by-passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Invalid passcode');
      }
      // Redirect to interview page with full interview data
      const queryParams = new URLSearchParams({
        passcode: encodeURIComponent(passcode),
        candidateName: encodeURIComponent(data.candidateName || ''),
        candidateEmail: encodeURIComponent(data.candidateEmail || ''),
        interviewerName: encodeURIComponent(data.interviewerName || ''),
        interviewerEmail: encodeURIComponent(data.interviewerEmail || ''),
        position: encodeURIComponent(data.position || ''),
        scheduledTime: encodeURIComponent(data.scheduledTime || ''),
        title: encodeURIComponent(data.title || '')
      });
      window.location.href = `/interview/${data.interviewId}?${queryParams.toString()}`;
    } catch (error) {
      message.error(error.message || 'Invalid passcode');
    } finally {
      setPasscodeLoading(false);
    }
  };

  return (
    <HomeContainer
      as={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Title variants={itemVariants}>
        <span className="code-brackets">{'</>'}</span>
        Kodr
      </Title>
      <Subtitle variants={itemVariants}>
        Elevate your technical interviews with real-time coding, collaboration, and smart timing
      </Subtitle>
      {loading ? (
        <div style={{ textAlign: 'center', margin: '2rem', color: '#61dafb' }}>Checking authentication...</div>
      ) : (
        <ButtonContainer>
          <Button
            primary
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartInterviewClick}
          >
            Start Interview
          </Button>
          <Button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Navigate to a compiler page or open compiler functionality
              navigate('/compiler');
            }}
          >
            <span className="button-icon">⚡</span>
            Compiler
          </Button>
        </ButtonContainer>
      )}
      <FeatureGrid variants={containerVariants}>
        <FeatureCard
          variants={itemVariants}
          whileHover={{ y: -10, transition: { duration: 0.2 } }}
          onClick={() => navigate('/compiler')}
        >
          <h3>Real-time Collaboration</h3>
          <p>Code together with built-in editor and whiteboard. Perfect for pair programming and technical discussions.</p>
        </FeatureCard>
        <FeatureCard
          variants={itemVariants}
          whileHover={{ y: -10, transition: { duration: 0.2 } }}
          onClick={handleStartInterviewClick}
        >
          <h3>Smart Timer</h3>
          <p>Configurable interview duration with smart alerts. Keep your interviews on track and professional.</p>
        </FeatureCard>
        <FeatureCard
          variants={itemVariants}
          whileHover={{ y: -10, transition: { duration: 0.2 } }}
          onClick={handleStartInterviewClick}
        >
          <h3>Video Integration</h3>
          <p>High-quality video calls with screen sharing. Connect face-to-face while coding together.</p>
        </FeatureCard>
      </FeatureGrid>
      <Footer>
        &copy; {new Date().getFullYear()} kodr &mdash; Modern Interview Platform
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a>
      </Footer>
      {isPasscodeModalVisible && (
        <Modal
          title={
            <span style={{ 
              color: '#61dafb', 
              fontSize: '1.5rem', 
              fontWeight: '700',
              textAlign: 'center',
              display: 'block'
            }}>
              {isInterviewerMode ? "Sign in as Interviewer" : "Enter Passcode to Join Interview"}
            </span>
          }
          visible={isPasscodeModalVisible}
          onCancel={() => {
            setIsPasscodeModalVisible(false);
            setIsInterviewerMode(false);
          }}
          footer={null}
          centered
          className="dark-modal"
          styles={{
            body: { 
              background: 'linear-gradient(135deg, #232526 0%, #1a1a1a 100%)',
              borderRadius: '16px',
              padding: '2rem'
            },
            header: {
              background: 'linear-gradient(135deg, #232526 0%, #1a1a1a 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px 16px 0 0'
            },
            content: {
              background: 'linear-gradient(135deg, #232526 0%, #1a1a1a 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            }
          }}
        >
          {isInterviewerMode ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ color: '#b0b8c9', marginBottom: '2rem', fontSize: '1rem' }}>
                To join as an interviewer, please use your interviewer account credentials.
              </p>
              <AntdButton
                type="primary"
                block
                size="large"
                onClick={() => {
                  setIsPasscodeModalVisible(false);
                  navigate('/interviewer-login');
                }}
                style={{ 
                  marginBottom: '1rem',
                  background: 'linear-gradient(45deg, #61DAFB, #007ACC)',
                  border: 'none',
                  height: '48px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}
              >
                Go to Interviewer Login
              </AntdButton>
              <AntdButton
                type="default"
                block
                onClick={() => setIsInterviewerMode(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  height: '48px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}
              >
                Back to Passcode Entry
              </AntdButton>
            </div>
          ) : (
            <>
              <Input
                placeholder="Enter passcode"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                onPressEnter={handlePasscodeSubmit}
                size="large"
                style={{ 
                  marginBottom: '1.5rem',
                  height: '48px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '1rem'
                }}
                className="dark-input"
              />
              <AntdButton
                type="primary"
                block
                loading={passcodeLoading}
                onClick={handlePasscodeSubmit}
                style={{ 
                  marginBottom: '1.5rem',
                  background: 'linear-gradient(45deg, #61DAFB, #007ACC)',
                  border: 'none',
                  height: '48px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                Join Interview
              </AntdButton>
              
              {/* Interviewer sign-in option */}
              <div style={{ textAlign: 'center', marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <p style={{ color: '#b0b8c9', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  Are you an interviewer?
                </p>
                <AntdButton
                  type="link"
                  onClick={() => setIsInterviewerMode(true)}
                  style={{ 
                    padding: 0, 
                    height: 'auto', 
                    color: '#61dafb',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  Sign in as Interviewer
                </AntdButton>
              </div>
              
              {/* Authentication notice for candidates */}
              {!isAuthenticated && (
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '1.5rem', 
                  padding: '1.5rem', 
                  background: 'rgba(97, 218, 251, 0.1)', 
                  borderRadius: '12px',
                  border: '1px solid rgba(97, 218, 251, 0.2)'
                }}>
                  <p style={{ color: '#61dafb', fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>💡</span>
                    You can join as a candidate without signing in. Just enter the passcode above.
                  </p>
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </HomeContainer>
  );
}

export default HomePage 