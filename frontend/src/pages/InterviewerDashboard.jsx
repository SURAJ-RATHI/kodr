import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Statistic, Modal, Form, Input, DatePicker, TimePicker, Select, message, Badge, Tooltip, Space } from 'antd';
import { 
  CalendarOutlined, 
  UserOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  PlusOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  SettingOutlined,
  BellOutlined,
  TeamOutlined,
  DashboardOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import './InterviewerDashboard.css';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;

const DashboardContainer = styled(motion.div)`
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(35, 37, 38, 0.98) 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url('/path/to/subtle-pattern.svg') repeat;
    opacity: 0.05;
    z-index: 0;
    pointer-events: none;
  }

  @media (max-width: 900px) {
    padding: 1.5rem 1rem;
  }

  @media (max-width: 600px) {
    padding: 1rem 0.5rem;
  }

  * { /* Apply to all children */
    position: relative; /* Ensure content is above pseudo-element */
    z-index: 1;
  }
`;

const Header = styled(motion.div)`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const QuickActions = styled(motion.div)`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
`;

const QuickActionButton = styled(motion.button)`
  padding: 1rem 2rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(45deg, #61DAFB, #007ACC);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  transition: all 0.3s ease;
  min-width: 220px;
  justify-content: center;

  &:hover {
    background: linear-gradient(45deg, #007ACC, #61DAFB);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 122, 204, 0.4);
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 122, 204, 0.3);
  }

  svg {
    font-size: 1.4rem;
  }
`;

const Title = styled(motion.h1)`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 2rem;
  background: linear-gradient(45deg, #61DAFB, #007ACC);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(97, 218, 251, 0.5);
  text-align: center;

  @media (max-width: 900px) {
    font-size: 2.5rem;
  }
  @media (max-width: 600px) {
    font-size: 2rem;
  }
`;

const StyledCard = styled(motion(Card))`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden; /* Ensures pseudo-element is clipped */

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  }

  .ant-card-head {
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    color: #ffffff;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .ant-card-body {
    color: #ffffff;
  }
`;

const StyledButton = styled(Button)`
  background: linear-gradient(45deg, #61DAFB, #007ACC);
  border: none;
  height: 45px;
  font-size: 1.1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-weight: 600;

  &:hover {
    background: linear-gradient(45deg, #007ACC, #61DAFB);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(97, 218, 251, 0.3);
  }
`;

const NotificationBadge = styled(Badge)`
  .ant-badge-count {
    background: #61dafb;
    box-shadow: 0 0 12px rgba(97, 218, 251, 0.5);
    border: 2px solid rgba(255, 255, 255, 0.1);
  }
`;

// Animation variants for table rows
const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    },
  }),
};

// Custom row component for Ant Design Table with Framer Motion
const MotionTr = ({ children, ...props }) => {
  const index = props['data-row-key']; // Ant Design uses data-row-key for row key
  return (
    <motion.tr
      {...props}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      custom={index}
    >
      {children}
    </motion.tr>
  );
};

const InterviewerDashboard = () => {
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedInterviews: 0,
    pendingInterviews: 0,
    averageRating: 0,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { logout, user } = useAuth();
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    // Verify user role on component mount
    if (!user || user.role !== 'interviewer') {
      message.error('Unauthorized access');
      logout();
      return;
    }
    
    fetchInterviews();
    fetchStats();
    fetchCandidates();
  }, [user, logout]);

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        logout();
        return;
      }

      const response = await fetch('/api/candidates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          message.error('Session expired. Please log in again.');
          logout();
          return;
        }
        // Attempt to parse JSON, but fallback to text if it fails
        let errorDetails = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || JSON.stringify(errorData);
        } catch (jsonError) {
          const textResponse = await response.text();
          errorDetails = `Error ${response.status}: ${response.statusText}. Response was not valid JSON: ${textResponse.substring(0, 100)}...`;
        }
        console.error('Failed to fetch candidates:', response.status, errorDetails);
        throw new Error(errorDetails);
      }

      const data = await response.json();
      console.log('Fetched candidates data:', data);
      setCandidates(data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      message.error(`Failed to fetch candidates: ${error.message}`);
    }
  };

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        logout();
        return;
      }

      const response = await fetch('/api/interviewer/interviews', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          message.error('Session expired. Please log in again.');
          logout();
          return;
        }
        // Attempt to parse JSON, but fallback to text if it fails
        let errorDetails = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || JSON.stringify(errorData);
        } catch (jsonError) {
          const textResponse = await response.text();
          errorDetails = `Error ${response.status}: ${response.statusText}. Response was not valid JSON: ${textResponse.substring(0, 100)}...`;
        }
        console.error('Failed to fetch interviews:', response.status, errorDetails);
        throw new Error(errorDetails);
      }

      const data = await response.json();
      const formattedData = data.map((interview, index) => ({
        ...interview,
        key: interview.id || interview._id || index,
        date: new Date(interview.scheduledTime).toLocaleDateString(),
        time: new Date(interview.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        candidateName: interview.candidate ? interview.candidate.name : 'N/A',
        candidateEmail: interview.candidate ? interview.candidate.email : 'N/A',
        skills: interview.skills || [],
      }));
      setUpcomingInterviews(formattedData);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
      message.error(`Failed to fetch interviews: ${error.message}`);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        logout();
        return;
      }

      const response = await fetch('/api/interviewer/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          message.error('Session expired. Please log in again.');
          logout();
          return;
        }
        // Attempt to parse JSON, but fallback to text if it fails
        let errorDetails = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || JSON.stringify(errorData);
        } catch (jsonError) {
          const textResponse = await response.text();
          errorDetails = `Error ${response.status}: ${response.statusText}. Response was not valid JSON: ${textResponse.substring(0, 100)}...`;
        }
        console.error('Failed to fetch statistics:', response.status, errorDetails);
        throw new Error(errorDetails);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      message.error(`Failed to fetch statistics: ${error.message}`);
    }
  };

  const handleScheduleInterview = async (values) => {
    try {
      // TODO: Replace with actual API call
      // console.log('Scheduling interview:', values);
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('User not authenticated.');
        return;
      }

      // Format date and time for the backend
      const formattedDate = values.date.format('YYYY-MM-DD');
      const formattedTime = values.time.format('HH:mm');

      // Construct the interview data payload
      const interviewData = {
        candidateId: values.candidateId,
        position: values.position,
        scheduledTime: `${formattedDate}T${formattedTime}:00Z`, // Assuming backend expects ISO 8601 format
        // Add other relevant fields like title, duration, etc., if needed by backend
        title: `Interview for ${values.position}`, // Example title
        duration: 60, // Defaulting duration to 60 minutes
        status: 'Scheduled' // Initial status
      };

      // This is the frontend part ready to send data to the backend.
      // The actual backend endpoint needs to be implemented to handle this request.
      console.log('Attempting to schedule interview with data:', interviewData);

      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(interviewData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle backend errors
        throw new Error(result.message || 'Failed to schedule interview');
      }

      message.success(result.message || 'Interview scheduled successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchInterviews(); // Refresh the interview list
    } catch (error) {
      console.error('Scheduling interview error:', error);
      message.error(error.message || 'Failed to schedule interview');
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'schedule':
        setIsModalVisible(true);
        break;
      case 'start':
        // Handle start interview - Placeholder
        message.info('Starting interview...');
        // window.location.href = `/interview/${record.id}` // Need to determine which interview to start
        break;
      case 'feedback':
        // Handle feedback - Placeholder
        message.info('Opening feedback form...');
        break;
      case 'manage_team':
        // Handle manage team - Placeholder
        message.info('Opening team management...');
        break;
      default:
        break;
    }
  };

  const columns = [
    {
      title: 'Candidate',
      dataIndex: 'candidateName',
      key: 'candidateName',
      render: (text, record) => (
        <div>
          <div className="candidate-name">{text}</div>
          <div className="candidate-email">{record.candidateEmail}</div>
        </div>
      ),
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      render: (text) => <div>{text}</div>
    },
    {
      title: 'Skills',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills) => (
        <div className="skills-container">
          {skills.map((skill) => (
            <span key={skill} className="skill-tag">
              {skill}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_, record) => (
        <div>
          <div>{record.date}</div>
          <div>{record.time}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`status-badge ${status.toLowerCase()}`}>
          {status}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div>
          <StyledButton
            type="primary"
            size="small"
            onClick={() => window.location.href = `/interview/${record.id}`}
          >
            Start Interview
          </StyledButton>
        </div>
      ),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05 // Reduced stagger for quicker reveal
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <DashboardContainer
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Header variants={itemVariants}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <DashboardOutlined style={{ fontSize: '1.8rem', color: '#61dafb' }} />
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem' }}>Interviewer Dashboard</h2>
        </div>
        <Space size="large">
          <Tooltip title="Notifications">
            <NotificationBadge count={5}>
              <Button type="text" icon={<BellOutlined style={{ fontSize: '1.4rem', color: '#fff' }} />} />
            </NotificationBadge>
          </Tooltip>
          <Tooltip title="Settings">
            <Button type="text" icon={<SettingOutlined style={{ fontSize: '1.4rem', color: '#fff' }} />} />
          </Tooltip>
          <Tooltip title="Logout">
            <Button type="text" icon={<LogoutOutlined style={{ fontSize: '1.4rem', color: '#fff' }} />} onClick={logout} />
          </Tooltip>
        </Space>
      </Header>

      <QuickActions variants={containerVariants} initial="hidden" animate="visible">
        <QuickActionButton
          variants={itemVariants}
          whileHover={{ scale: 1.03, boxShadow: '0 10px 25px rgba(0, 122, 204, 0.5)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleQuickAction('schedule')}
        >
          <PlusOutlined />
          Schedule Interview
        </QuickActionButton>
        <QuickActionButton
          variants={itemVariants}
          whileHover={{ scale: 1.03, boxShadow: '0 10px 25px rgba(0, 122, 204, 0.5)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleQuickAction('start')}
        >
          <VideoCameraOutlined />
          Start Interview
        </QuickActionButton>
        <QuickActionButton
          variants={itemVariants}
          whileHover={{ scale: 1.03, boxShadow: '0 10px 25px rgba(0, 122, 204, 0.5)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleQuickAction('feedback')}
        >
          <FileTextOutlined />
          Give Feedback
        </QuickActionButton>
        <QuickActionButton
          variants={itemVariants}
          whileHover={{ scale: 1.03, boxShadow: '0 10px 25px rgba(0, 122, 204, 0.5)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleQuickAction('manage_team')}
        >
          <TeamOutlined />
          Manage Team
        </QuickActionButton>
      </QuickActions>

      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} md={6}>
          <StyledCard variants={itemVariants} whileHover={{ scale: 1.03 }}>
            <Statistic
              title="Total Interviews"
              value={stats.totalInterviews}
              prefix={<CalendarOutlined style={{ color: '#61dafb' }} />}
            />
          </StyledCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StyledCard variants={itemVariants} whileHover={{ scale: 1.03 }}>
            <Statistic
              title="Completed"
              value={stats.completedInterviews}
              prefix={<CheckCircleOutlined style={{ color: '#61dafb' }} />}
              valueStyle={{ color: '#61DAFB' }}
            />
          </StyledCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StyledCard variants={itemVariants} whileHover={{ scale: 1.03 }}>
            <Statistic
              title="Pending"
              value={stats.pendingInterviews}
              prefix={<ClockCircleOutlined style={{ color: '#007acc' }} />}
              valueStyle={{ color: '#007ACC' }}
            />
          </StyledCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StyledCard variants={itemVariants} whileHover={{ scale: 1.03 }}>
            <Statistic
              title="Average Rating"
              value={stats.averageRating}
              precision={1}
              prefix={<UserOutlined style={{ color: '#61dafb' }} />}
              valueStyle={{ color: '#61DAFB' }}
            />
          </StyledCard>
        </Col>
      </Row>

      <StyledCard
        title="Upcoming Interviews"
        className="interviews-card"
        variants={itemVariants}
        extra={
          <StyledButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleQuickAction('schedule')}
          >
            Schedule Interview
          </StyledButton>
        }
      >
         <AnimatePresence>
          <Table
            columns={columns}
            dataSource={upcomingInterviews}
            rowKey="id"
            pagination={false}
            showHeader={true} /* Ensure header is shown */
            components={{
              body: {
                row: MotionTr,
              },
            }}
          />
        </AnimatePresence>
      </StyledCard>

      <Modal
        title="Schedule New Interview"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        className="schedule-modal"
        centered /* Center the modal */
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleScheduleInterview}
          onSubmit={(e) => e.preventDefault()} // Prevent default form submission on Enter key
        >
          {/* Interviewer Email (Pre-filled) */}
          <Form.Item
            label="Interviewer Email"
          >
            <Input size="large" value={user?.email} />
          </Form.Item>

          <Form.Item
            name="candidateId"
            label="Candidate"
            rules={[{ required: true, message: 'Please select the candidate!' }]}
          >
            <Select showSearch placeholder="Select a candidate">
              {candidates.map(candidate => (
                <Option key={candidate._id} value={candidate._id}>
                  {`${candidate.name} (${candidate.email})`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="position"
            label="Position"
            rules={[{ required: true, message: 'Please select position' }]}
          >
            <Select size="large" placeholder="Select position">
              <Option value="Frontend Developer">Frontend Developer</Option>
              <Option value="Backend Developer">Backend Developer</Option>
              <Option value="Full Stack Developer">Full Stack Developer</Option>
              <Option value="DevOps Engineer">DevOps Engineer</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item
            name="time"
            label="Time"
            rules={[{ required: true, message: 'Please select time' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" size="large" />
          </Form.Item>

          <Form.Item
            name="candidateEmail"
            label="Candidate Email"
            rules={[
              { required: true, message: 'Please enter the candidate\'s email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input size="large" placeholder="Candidate Email" />
          </Form.Item>

          <Form.Item>
            <StyledButton type="primary" htmlType="submit" block>
              Schedule Interview
            </StyledButton>
          </Form.Item>
        </Form>
      </Modal>
    </DashboardContainer>
  );
};

export default InterviewerDashboard; 