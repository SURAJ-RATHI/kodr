import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';

const { Title } = Typography;

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    if (role === 'candidate') {
      navigate('/candidate');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 600, textAlign: 'center', padding: '2rem' }}>
        <Title level={2}>Welcome to kodr</Title>
        <Title level={4} style={{ marginBottom: '2rem' }}>Please select your role</Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            size="large" 
            icon={<UserOutlined />}
            onClick={() => handleRoleSelect('candidate')}
            style={{ width: '100%', height: '60px' }}
          >
            I am a Candidate
          </Button>
          
          <Button 
            type="primary" 
            size="large" 
            icon={<TeamOutlined />}
            onClick={() => handleRoleSelect('interviewer')}
            style={{ width: '100%', height: '60px' }}
          >
            I am an Interviewer
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default RoleSelection; 