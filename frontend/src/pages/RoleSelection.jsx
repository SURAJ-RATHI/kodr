import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  padding: 2rem;
  position: relative;
  overflow: hidden;
  background: #1a1a1a;
`;

const Title = styled(motion.h1)`
  font-size: 4.5rem;
  margin-bottom: 3rem;
  text-align: center;
  color: #ffffff;
  position: relative;
  z-index: 2;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow: 0 0 20px rgba(0, 150, 255, 0.5);

  span {
    background: linear-gradient(45deg, #0096ff, #00ffd5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const RoleCards = styled.div`
  display: flex;
  gap: 4rem;
  margin-top: 2rem;
  position: relative;
  z-index: 2;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 2rem;
  }
`;

const RoleCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 3rem;
  width: 380px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, #0096ff, #00ffd5);
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: -1;
  }

  &:hover {
    transform: translateY(-15px);
    border-color: #0096ff;
    box-shadow: 0 20px 40px rgba(0, 150, 255, 0.2);

    &::before {
      opacity: 0.1;
    }
  }
`;

const RoleIcon = styled(motion.div)`
  font-size: 4rem;
  margin-bottom: 2rem;
  color: #0096ff;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  position: relative;

  svg {
    filter: drop-shadow(0 0 10px rgba(0, 150, 255, 0.5));
  }
`;

const RoleTitle = styled.h2`
  font-size: 2.2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(0, 150, 255, 0.3);
`;

const RoleDescription = styled.p`
  color: #b3b3b3;
  text-align: center;
  line-height: 1.8;
  font-size: 1.1rem;
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
  background: rgba(0, 150, 255, 0.03);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  border: 1px solid rgba(0, 150, 255, 0.1);
`;

const FloatingCode = styled(motion.div)`
  position: absolute;
  font-family: 'Courier New', monospace;
  color: rgba(0, 150, 255, 0.2);
  font-size: 1.2rem;
  pointer-events: none;
  white-space: nowrap;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 150, 255, 0.3);
`;

const GlowEffect = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 50%, rgba(0, 150, 255, 0.1) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
`;

const TechElement = styled(motion.div)`
  position: absolute;
  font-size: 1.5rem;
  color: rgba(0, 150, 255, 0.2);
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 150, 255, 0.05);
  border-radius: 8px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(0, 150, 255, 0.1);
`;

const CompilerWindow = styled(motion.div)`
  position: absolute;
  width: 300px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 150, 255, 0.2);
  backdrop-filter: blur(5px);
`;

const CompilerHeader = styled.div`
  background: rgba(0, 150, 255, 0.1);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(0, 150, 255, 0.2);
`;

const CompilerContent = styled.div`
  padding: 1rem;
  font-family: 'Courier New', monospace;
  color: rgba(0, 150, 255, 0.3);
  font-size: 0.8rem;
  line-height: 1.4;
`;

const InterviewBubble = styled(motion.div)`
  position: absolute;
  background: rgba(0, 150, 255, 0.05);
  border: 1px solid rgba(0, 150, 255, 0.1);
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
  'console.log();',
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