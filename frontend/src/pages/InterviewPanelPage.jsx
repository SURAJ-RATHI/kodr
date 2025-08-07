import { useEffect, useState } from 'react';
import InterviewPanel from '../components/InterviewPanel';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export default function InterviewPanelPage() {
  const [socket, setSocket] = useState(null);
  const { selectedRole } = useAuth();

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL ;
    const s = io(API_URL);
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  // You can pass dummy interviewId/interviewData or make them optional in InterviewPanel
  return <InterviewPanel socket={socket} role={selectedRole} showVideoChat={selectedRole === 'interviewer'} />;
} 