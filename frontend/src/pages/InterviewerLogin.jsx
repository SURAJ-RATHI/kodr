import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useAuth } from '../contexts/AuthContext';
import { FaUserTie, FaLock, FaEnvelope, FaGoogle, FaUserPlus } from 'react-icons/fa';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #232526 0%, #1a1a1a 100%);
`;

const Card = styled.div`
  background: rgba(34, 40, 49, 0.85);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.25);
  border-radius: 22px;
  border: 2px solid transparent;
  background-clip: padding-box;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    inset: -2px;
    z-index: -1;
    border-radius: 24px;
    background: linear-gradient(120deg, #61dafb, #007acc, #232526 80%);
    opacity: 0.7;
  }
`;

const Title = styled.h1`
  color: #61dafb;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border-radius: 12px;
  border: 1.5px solid ${props => props.error ? '#ff4d4f' : '#333'};
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 1.1rem;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #61dafb;
    box-shadow: 0 0 0 2px rgba(97, 218, 251, 0.2);
  }
`;

const Icon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #61dafb;
  font-size: 1.2rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(90deg, #61dafb, #007acc);
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(97, 218, 251, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  font-size: 0.9rem;
  margin-top: -0.5rem;
  text-align: left;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin: 1.5rem 0;
  color: #666;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #333;
  }

  span {
    padding: 0 1rem;
    font-size: 0.9rem;
  }
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1rem;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  svg {
    font-size: 1.3rem;
  }
`;

const GoogleSignInContainer = styled.div`
  width: 100%;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #61dafb;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem;
  margin-top: 1rem;
  text-decoration: underline;
  transition: all 0.3s ease;

  &:hover {
    color: #007acc;
  }
`;

const InterviewerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleInitialized, setGoogleInitialized] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const { login, handleGoogleAuth } = useAuth();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID is not configured');
      setError('Google Sign-In is not properly configured. Please contact support.');
      return;
    }

    // Load Google Sign-In script
    const loadGoogleScript = () => {
      return new Promise((resolve, reject) => {
        if (window.google) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
        document.body.appendChild(script);
      });
    };

    // Initialize Google Sign-In
    const initializeGoogleSignIn = async () => {
      try {
        await loadGoogleScript();

        if (!window.google) {
          throw new Error('Google Sign-In script not loaded');
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          ux_mode: 'popup'
        });

        window.google.accounts.id.renderButton(
          document.getElementById('googleSignIn'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: isSignup ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'center'
          }
        );
        setGoogleInitialized(true);
      } catch (err) {
        console.error('Error initializing Google Sign-In:', err);
        setError('Failed to initialize Google Sign-In. Please refresh the page or try again later.');
      }
    };

    if (!googleInitialized) {
      initializeGoogleSignIn();
    }

    return () => {
      // Cleanup
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        script.remove();
      }
    };
  }, [googleInitialized, isSignup]);

  const handleGoogleSignIn = async (response) => {
    setError('');
    setLoading(true);

    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      // Prepare the data for Google authentication
      const googleData = {
        credential: response.credential,
        role: 'interviewer',
        isSignup: isSignup,
        userData: {
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        }
      };

      console.log('Attempting Google auth with role:', googleData.role);
      const result = await handleGoogleAuth(googleData);
      
      if (!result.success) {
        setError(result.error || 'Google authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('An unexpected error occurred during Google sign-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignup) {
      if (!name || !email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role: 'interviewer'
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Signup failed');
        }

        // After successful signup, log the user in
        const loginResult = await login(email, password, 'interviewer');
        if (!loginResult.success) {
          setError(loginResult.error || 'Signup successful but login failed. Please try logging in.');
        }
      } catch (err) {
        console.error('Signup error:', err);
        setError(err.message || 'An unexpected error occurred during signup. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Existing login logic
      if (!email || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      try {
        const result = await login(email, password, 'interviewer');
        if (!result.success) {
          setError(result.error || 'Invalid email or password');
        }
      } catch (err) {
        console.error('Login error:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  };

  return (
    <Container>
      <Card>
        <Title>
          <FaUserTie />
          {isSignup ? 'Interviewer Signup' : 'Interviewer Login'}
        </Title>
        <Form onSubmit={handleSubmit}>
          {isSignup && (
            <InputGroup>
              <Icon>
                <FaUserPlus />
              </Icon>
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!error}
                required
                disabled={loading}
              />
            </InputGroup>
          )}
          <InputGroup>
            <Icon>
              <FaEnvelope />
            </Icon>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!error}
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup>
            <Icon>
              <FaLock />
            </Icon>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!error}
              required
              disabled={loading}
            />
          </InputGroup>
          {isSignup && (
            <InputGroup>
              <Icon>
                <FaLock />
              </Icon>
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!error}
                required
                disabled={loading}
              />
            </InputGroup>
          )}
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button type="submit" disabled={loading}>
            {loading ? (isSignup ? 'Signing up...' : 'Logging in...') : (isSignup ? 'Sign Up' : 'Login')}
          </Button>
        </Form>

        <ToggleButton type="button" onClick={toggleMode}>
          {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
        </ToggleButton>

        <Divider>
          <span>or</span>
        </Divider>

        <GoogleSignInContainer>
          <div id="googleSignIn" style={{ width: '100%' }} />
        </GoogleSignInContainer>
      </Card>
    </Container>
  );
};

export default InterviewerLogin; 