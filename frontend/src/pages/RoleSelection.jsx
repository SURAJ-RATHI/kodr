import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from '@emotion/styled';
import { motion, useAnimation } from 'framer-motion';
import { FaCode, FaUserTie, FaLaptopCode, FaCodeBranch, FaTerminal, FaKeyboard, FaFileCode, FaBug, FaCheckCircle, FaPlay, FaStop, FaCog, FaJava } from 'react-icons/fa';
import { SiLeetcode, SiHackerrank, SiJavascript, SiPython } from 'react-icons/si';

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
  color: #ffffff;
  position: relative;
  z-index: 2;
  font-weight: 800;
  letter-spacing: clamp(1px, 0.5vw, 2px);
  text-transform: uppercase;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);

  span {
    color: #ffffff;
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

  &:hover {
    transform: translateY(-15px);
    border-color: #ffffff;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
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

const AnimatedBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
`;

const Hexagon = styled(motion.div)`
  position: absolute;
  width: 100px;
  height: 115px;
  background: rgba(255, 255, 255, 0.03);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const FloatingCode = styled(motion.div)`
  position: absolute;
  font-family: 'Courier New', monospace;
  color: rgba(255, 255, 255, 0.2);
  font-size: 1.2rem;
  pointer-events: none;
  white-space: nowrap;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
`;

const GlowEffect = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
`;

const TechElement = styled(motion.div)`
  position: absolute;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.2);
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CompilerWindow = styled(motion.div)`
  position: absolute;
  width: 300px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
`;

const CompilerHeader = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const CompilerContent = styled.div`
  padding: 1rem;
  font-family: 'Courier New', monospace;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.8rem;
  line-height: 1.4;
`;

const InterviewBubble = styled(motion.div)`
  position: absolute;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  max-width: 250px;
  backdrop-filter: blur(5px);
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
  line-height: 1.4;
`;

const codeSnippets = [
  'function solve() {',
  'class Interview {',
  'const result = [];',
  'async function fetch() {',
  'return new Promise();',
  'try {',
  '} catch (error) {',
  '// Code execution',
];

const techElements = [
  { icon: <FaKeyboard />, text: "Coding" },
  { icon: <FaFileCode />, text: "Development" },
  { icon: <FaBug />, text: "Debugging" },
  { icon: <FaCheckCircle />, text: "Testing" },
  { icon: <SiJavascript />, text: "JavaScript" },
  { icon: <SiPython />, text: "Python" },
  { icon: <FaJava />, text: "Java" },
  { icon: <FaPlay />, text: "Run" },
  { icon: <FaStop />, text: "Stop" },
  { icon: <FaCog />, text: "Settings" },
];

const compilerOutputs = [
  `> Compiling...
> Running tests...
✓ All tests passed
> Build successful`,
  `> Starting interview...
> Loading questions...
> Ready for candidate`,
  `> Analyzing code...
> Checking complexity...
> Performance: Optimal`,
  `> Debugging...
> Found 0 errors
> Code review complete`,
];

const interviewQuestions = [
  "What's the time complexity of this algorithm?",
  "How would you optimize this solution?",
  "Explain your approach to this problem.",
  "Can you handle edge cases?",
  "What's the space complexity?",
  "How would you test this code?",
];

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
      <AnimatedBackground>
        {[...Array(15)].map((_, i) => (
          <Hexagon
            key={`hex-${i}`}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0,
              rotate: Math.random() * 360,
            }}
            animate={{
              scale: [0, 1, 0],
              rotate: [0, 360],
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
            }}
            transition={{
              duration: 8 + Math.random() * 7,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            style={{
              width: 50 + Math.random() * 100,
              height: 58 + Math.random() * 115,
            }}
          />
        ))}

        {techElements.map((element, i) => (
          <TechElement
            key={`tech-${i}`}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: [0, 0.5, 0],
              scale: [0, 1, 0],
              x: [0, Math.random() * 300 - 150],
              y: [0, Math.random() * 300 - 150],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: i * 0.6,
            }}
          >
            {element.icon}
            <span>{element.text}</span>
          </TechElement>
        ))}

        {compilerOutputs.map((output, i) => (
          <CompilerWindow
            key={`compiler-${i}`}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: [0, 0.7, 0],
              scale: [0, 1, 0],
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 1.2,
            }}
          >
            <CompilerHeader>
              <FaCode />
              <span>Compiler</span>
            </CompilerHeader>
            <CompilerContent>
              {output}
            </CompilerContent>
          </CompilerWindow>
        ))}

        {interviewQuestions.map((question, i) => (
          <InterviewBubble
            key={`question-${i}`}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
              x: [0, Math.random() * 250 - 125],
              y: [0, Math.random() * 250 - 125],
            }}
            transition={{
              duration: 7 + Math.random() * 3,
              repeat: Infinity,
              delay: i * 1,
            }}
          >
            {question}
          </InterviewBubble>
        ))}
      </AnimatedBackground>

      {codeSnippets.map((snippet, i) => (
        <FloatingCode
          key={`code-${i}`}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
            rotate: Math.random() * 360,
          }}
          animate={{
            opacity: [0, 0.5, 0],
            y: [0, -400],
            x: [0, Math.random() * 400 - 200],
            rotate: [0, 360],
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 0.8,
          }}
        >
          {snippet}
        </FloatingCode>
      ))}

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
        >
          <RoleIcon
            animate={controls}
          >
            <FaCode />
            <SiLeetcode />
          </RoleIcon>
          <RoleTitle>Candidate</RoleTitle>
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
        >
          <RoleIcon
            animate={controls}
          >
            <FaUserTie />
            <SiHackerrank />
          </RoleIcon>
          <RoleTitle>Interviewer</RoleTitle>
          <RoleDescription>
            Looking to evaluate talent? Join as an interviewer and help shape the next generation of developers.
          </RoleDescription>
        </RoleCard>
      </RoleCards>
    </RoleContainer>
  );
};

export default RoleSelection; 