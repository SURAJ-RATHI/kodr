import { motion } from 'framer-motion'
import styled from '@emotion/styled'
import { useState } from 'react';
import { Modal, Input, Button as AntdButton, message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL ;

const Footer = styled.footer`
  width: 100%;
  padding: 1.5rem 0 1rem 0;
  text-align: center;
  color: #888;
  font-size: 1rem;
  background: transparent;
  margin-top: 4rem;
  letter-spacing: 0.02em;
  a {
    color: #61dafb;
    text-decoration: none;
    margin-left: 0.3em;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const HomeContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;

  @media (max-width: 900px) {
    padding: 1.5rem 1rem;
  }

  @media (max-width: 600px) {
    padding: 1rem 0.5rem;
  }
`

const Title = styled(motion.h1)`
  font-size: 4.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #61DAFB, #007ACC);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(97, 218, 251, 0.3);
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 4px;
    background: linear-gradient(45deg, #61DAFB, #007ACC);
    border-radius: 2px;
  }

  .code-brackets {
    font-size: 3.5rem;
    font-weight: 900;
    color: #61DAFB;
    opacity: 1;
    text-shadow: 0 0 4px #61dafb, 0 0 8px #007acc55;
    margin-right: 0.3rem;
    animation: blinkLogo 1.2s infinite alternate;
  }

  @keyframes blinkLogo {
    0% { opacity: 1; }
    100% { opacity: 0.3; }
  }

  @media (max-width: 900px) {
    font-size: 3.2rem;
    .code-brackets { font-size: 2.2rem; }
  }
  @media (max-width: 600px) {
    font-size: 2.1rem;
    .code-brackets { font-size: 1.3rem; }
  }
`

const Subtitle = styled(motion.p)`
  font-size: 1.5rem;
  color: #a0a0a0;
  margin-bottom: 3rem;
  max-width: 600px;
  line-height: 1.6;

  @media (max-width: 900px) {
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }
  @media (max-width: 600px) {
    font-size: 1rem;
    margin-bottom: 1.2rem;
  }
`

const ButtonContainer = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 2rem;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    align-items: center;
  }
`

const Button = styled(motion.button)`
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border: none;
  border-radius: 8px;
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
  gap: 0.5rem;

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
    font-size: 1.2rem;
  }

  @media (max-width: 900px) {
    font-size: 1rem;
    padding: 0.8rem 1.2rem;
  }
  @media (max-width: 600px) {
    font-size: 0.95rem;
    padding: 0.7rem 1rem;
    width: 90%;
    justify-content: center;
  }
`

const FeatureGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
  width: 100%;
  max-width: 1200px;

  @media (max-width: 900px) {
    gap: 1.2rem;
    margin-top: 2rem;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-top: 1.2rem;
    max-width: 98vw;
  }
`

const FeatureCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

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
    margin-bottom: 1rem;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &::before {
      content: '⚡';
      font-size: 1.2rem;
    }
  }

  p {
    color: #a0a0a0;
    line-height: 1.6;
  }

  @media (max-width: 900px) {
    padding: 1.2rem;
    h3 { font-size: 1.1rem; }
    p { font-size: 0.98rem; }
  }
  @media (max-width: 600px) {
    padding: 0.8rem;
    h3 { font-size: 1rem; }
    p { font-size: 0.93rem; }
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

  const { isAuthenticated, user, loading } = useAuth();
  console.log('[HomePage] Auth state:', { isAuthenticated, user, loading });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('HomePage auth debug:', { isAuthenticated, user });
  }, [isAuthenticated, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('startInterview') === 'true') {
      if (isAuthenticated) {
        setIsPasscodeModalVisible(true);
      } else {
        navigate(`/login?redirect=/home?startInterview=true`);
      }
    }
    // If modal is open but user is not authenticated, close modal and redirect
    if (isPasscodeModalVisible && !isAuthenticated) {
      setIsPasscodeModalVisible(false);
      navigate(`/login?redirect=/home?startInterview=true`);
    }
  }, [isAuthenticated, location.search, navigate, isPasscodeModalVisible]);

  const handleStartInterviewClick = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/home?startInterview=true`);
    } else {
      setIsPasscodeModalVisible(true);
    }
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
      // Redirect to interview page
      window.location.href = `/interview/${data.interviewId}?passcode=${encodeURIComponent(passcode)}`;
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
        Koder
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
        >
          <h3>Real-time Collaboration</h3>
          <p>Code together with built-in editor and whiteboard. Perfect for pair programming and technical discussions.</p>
        </FeatureCard>
        <FeatureCard
          variants={itemVariants}
          whileHover={{ y: -10, transition: { duration: 0.2 } }}
        >
          <h3>Smart Timer</h3>
          <p>Configurable interview duration with smart alerts. Keep your interviews on track and professional.</p>
        </FeatureCard>
        <FeatureCard
          variants={itemVariants}
          whileHover={{ y: -10, transition: { duration: 0.2 } }}
        >
          <h3>Video Integration</h3>
          <p>High-quality video calls with screen sharing. Connect face-to-face while coding together.</p>
        </FeatureCard>
      </FeatureGrid>
      <Footer>
        &copy; {new Date().getFullYear()} Koder &mdash; Modern Interview Platform
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a>
      </Footer>
      {isAuthenticated && isPasscodeModalVisible && (
        <Modal
          title="Enter Passcode to Join Interview"
          visible={isPasscodeModalVisible}
          onCancel={() => setIsPasscodeModalVisible(false)}
          footer={null}
          centered
        >
          <Input
            placeholder="Enter passcode"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            onPressEnter={handlePasscodeSubmit}
            size="large"
            style={{ marginBottom: 16 }}
          />
          <AntdButton
            type="primary"
            block
            loading={passcodeLoading}
            onClick={handlePasscodeSubmit}
          >
            Join Interview
          </AntdButton>
        </Modal>
      )}
    </HomeContainer>
  );
}

export default HomePage 