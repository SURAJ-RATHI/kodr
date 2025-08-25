import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from '@emotion/styled';
import { motion, useAnimation } from 'framer-motion';
import { FaCode, FaUserTie } from 'react-icons/fa';
import { SiLeetcode, SiHackerrank } from 'react-icons/si';

const RoleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: clamp(1rem, 4vw, 2rem);
  position: relative;
  overflow: hidden;
  background: #1a1a1a;
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    padding: clamp(0.75rem, 3vw, 1.5rem);
  }
  
  @media (max-width: 480px) {
    padding: clamp(0.5rem, 2vw, 1rem);
  }
`;

const Title = styled(motion.h1)`
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  margin-bottom: clamp(2rem, 5vw, 3rem);
  text-align: center;
  color:rgb(214, 225, 228); /* Changed to blue */
  position: relative;
  z-index: 2;
  font-weight: 800;
  letter-spacing: clamp(1px, 0.5vw, 2px);
  text-transform: uppercase;
  text-shadow: 0 0 20px rgba(97, 218, 251, 0.5); /* Blue glow */

  span {
    color: #61dafb; /* Changed to blue */
  }
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    font-size: clamp(2rem, 6vw, 3.5rem);
    margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
    letter-spacing: 1px;
  }
  
  @media (max-width: 480px) {
    font-size: clamp(1.8rem, 5vw, 2.5rem);
    margin-bottom: clamp(1rem, 3vw, 2rem);
    letter-spacing: 0.5px;
  }
`;

const RoleCards = styled.div`
  display: flex;
  gap: clamp(2rem, 6vw, 4rem);
  margin-top: clamp(1.5rem, 4vw, 2rem);
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: clamp(1.5rem, 4vw, 2rem);
    margin-top: clamp(1rem, 3vw, 1.5rem);
  }
  
  @media (max-width: 480px) {
    gap: 1.5rem;
    margin-top: 1rem;
  }
`;

const RoleCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: clamp(12px, 3vw, 20px);
  padding: clamp(2rem, 5vw, 3rem);
  width: clamp(280px, 60vw, 380px);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  /* Candidate card styling (green) */
  ${props => props.role === 'candidate' && `
    border-color: rgba(76, 175, 80, 0.3);
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.1);
    
    &:hover {
      border-color: #4caf50;
      box-shadow: 0 20px 40px rgba(76, 175, 80, 0.3);
      background: rgba(76, 175, 80, 0.05);
    }
  `}

  /* Interviewer card styling (red) */
  ${props => props.role === 'interviewer' && `
    border-color: rgba(244, 67, 54, 0.3);
    box-shadow: 0 0 20px rgba(244, 67, 54, 0.1);
    
    &:hover {
      border-color: #f44336;
      box-shadow: 0 20px 40px rgba(244, 67, 54, 0.3);
      background: rgba(244, 67, 54, 0.05);
    }
  `}

  &:hover {
    transform: translateY(-15px);
  }
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    width: clamp(250px, 80vw, 320px);
    padding: clamp(1.5rem, 4vw, 2.5rem);
    border-radius: 16px;
  }
  
  @media (max-width: 480px) {
    width: clamp(220px, 90vw, 280px);
    padding: clamp(1.25rem, 3vw, 2rem);
    border-radius: 12px;
  }
`;

const RoleIcon = styled(motion.div)`
  font-size: clamp(2.5rem, 8vw, 4rem);
  margin-bottom: clamp(1.5rem, 4vw, 2rem);
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  position: relative;
  transition: color 0.3s ease;

  /* Candidate icon styling (green) */
  ${props => props.role === 'candidate' && `
    color: #4caf50;
    filter: drop-shadow(0 0 10px rgba(76, 175, 80, 0.5));
  `}

  /* Interviewer icon styling (red) */
  ${props => props.role === 'interviewer' && `
    color: #f44336;
    filter: drop-shadow(0 0 10px rgba(244, 67, 54, 0.5));
  `}

  svg {
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
  }
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    font-size: clamp(2rem, 6vw, 3rem);
    margin-bottom: clamp(1.25rem, 3vw, 1.75rem);
    gap: 0.75rem;
  }
  
  @media (max-width: 480px) {
    font-size: clamp(1.75rem, 5vw, 2.5rem);
    margin-bottom: 1.25rem;
    gap: 0.5rem;
  }
`;

const RoleTitle = styled.h2`
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  text-align: center;
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  transition: color 0.3s ease;

  /* Candidate title styling (green) */
  ${props => props.role === 'candidate' && `
    color: #4caf50;
    text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  `}

  /* Interviewer title styling (red) */
  ${props => props.role === 'interviewer' && `
    color: #f44336;
    text-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
  `}
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    font-size: clamp(1.25rem, 3.5vw, 1.8rem);
    margin-bottom: clamp(0.75rem, 2.5vw, 1.25rem);
  }
  
  @media (max-width: 480px) {
    font-size: clamp(1.125rem, 3vw, 1.5rem);
    margin-bottom: 0.75rem;
  }
`;

const RoleDescription = styled.p`
  color: #b3b3b3;
  text-align: center;
  line-height: 1.8;
  font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    font-size: clamp(0.85rem, 2.2vw, 1rem);
    line-height: 1.6;
  }
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
    line-height: 1.5;
  }
`;

const GlowEffect = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
`;

const RoleSelection = () => {
  const navigate = useNavigate();
  const { setSelectedRole } = useAuth();
  const [hoveredRole, setHoveredRole] = useState(null);
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse"
      }
    });
  }, [controls]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'interviewer') {
      navigate('/login');
    } else {
      navigate('/home');
    }
  };

  return (
    <RoleContainer>
      <GlowEffect />
      
      <Title
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Choose Your <span>Role</span>
      </Title>
      
      <RoleCards>
        <RoleCard
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onHoverStart={() => setHoveredRole('candidate')}
          onHoverEnd={() => setHoveredRole(null)}
          onClick={() => handleRoleSelect('candidate')}
          role="candidate"
        >
          <RoleIcon
            animate={controls}
            role="candidate"
          >
            <FaCode />
            <SiLeetcode />
          </RoleIcon>
          <RoleTitle
            role="candidate"
          >
            Candidate
          </RoleTitle>
          <RoleDescription>
            Ready to showcase your coding skills? Join as a candidate and take on exciting coding challenges.
          </RoleDescription>
        </RoleCard>

        <RoleCard
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onHoverStart={() => setHoveredRole('interviewer')}
          onHoverEnd={() => setHoveredRole(null)}
          onClick={() => handleRoleSelect('interviewer')}
          role="interviewer"
        >
          <RoleIcon
            animate={controls}
            role="interviewer"
          >
            <FaUserTie />
            <SiHackerrank />
          </RoleIcon>
          <RoleTitle
            role="interviewer"
          >
            Interviewer
          </RoleTitle>
          <RoleDescription>
            Looking to evaluate talent? Join as an interviewer and help shape the next generation of developers.
          </RoleDescription>
        </RoleCard>
      </RoleCards>
    </RoleContainer>
  );
};

export default RoleSelection; 