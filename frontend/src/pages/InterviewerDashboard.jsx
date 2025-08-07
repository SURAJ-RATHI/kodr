import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, message, Badge, Tooltip, Space, Rate, DatePicker, TimePicker } from 'antd';
import { 
  SettingOutlined,
  BellOutlined,
  DashboardOutlined,
  LogoutOutlined,
  StarFilled,
  FrownOutlined,
  ShareAltOutlined,
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './InterviewerDashboard.css';
import { useAuth } from '../contexts/AuthContext';
import { generateInterviewUrl, shareInterviewUrl, canStartInterview, getInterviewStatusColor } from '../utils/interviewUtils';
import dayjs from 'dayjs';
import { Modal as AntdModal } from 'antd';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

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
    background: url('/subtle-pattern.svg') repeat;
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

const PositionTag = styled.div`
  background: rgba(97, 218, 251, 0.1);
  color: #61dafb;
  padding: 0.3rem 0.8rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-block;
  border: 1px solid rgba(97, 218, 251, 0.2);
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
  background: linear-gradient(45deg,rgba(6, 75, 95, 0.28), #007ACC);
  border: none;
  height: 45px;
  font-size: 1.1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
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
    color: #000;
  }
`;

const MotionTr = ({ children, ...props }) => {
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };
  return (
    <motion.tr 
      {...props} 
      variants={rowVariants} 
      initial="hidden" 
      animate="visible" 
      exit="hidden"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      style={{ height: 38 }}
    >
      {children}
    </motion.tr>
  );
};

const CustomEmpty = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    style={{ textAlign: 'center', padding: '2rem', color: '#888' }}
  >
    <FrownOutlined style={{ fontSize: '3rem', marginBottom: '1rem' }} />
    <p>No interviews found.</p>
  </motion.div>
);

const InterviewerDashboard = () => {
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedInterviews: 0,
    pendingInterviews: 0,
    averageRating: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [form] = Form.useForm();
  const { logout, user } = useAuth();
  const [feedbackModal, setFeedbackModal] = useState({ visible: false, interview: null, loading: false, feedback: null });
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState('closest');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    // Verify user role on component mount
    if (!user || user.role !== 'interviewer') {
      message.error('Unauthorized access');
      logout();
      return;
    }
    
    fetchInterviews();
    fetchStats();
  }, [user, logout]);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        logout();
        return;
      }

      const response = await fetch(`${API_URL}/api/interviewer/interviews`, {
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
        let errorText = await response.text();
        let errorDetails = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorDetails = errorData.message || JSON.stringify(errorData);
        } catch {}
        console.error('Failed to fetch interviews:', response.status, errorDetails);
        throw new Error(errorDetails);
      }

      const data = await response.json();
      const formattedData = data.map((interview, index) => ({
        ...interview,
        key: interview.id || interview._id || index,
        date: dayjs.utc(interview.scheduledTime).format('YYYY-MM-DD'),
        time: dayjs.utc(interview.scheduledTime).format('HH:mm'),
        candidateName: interview.candidate ? interview.candidate.name : interview.candidateName || 'N/A',
        candidateEmail: interview.candidate ? interview.candidate.email : interview.candidateEmail || 'N/A',
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

      const response = await fetch(`${API_URL}/api/interviewer/stats`, {
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
        let errorText = await response.text();
        let errorDetails = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorDetails = errorData.message || JSON.stringify(errorData);
        } catch {}
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
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('User not authenticated.');
        return;
      }

      const formattedDate = values.date.format('YYYY-MM-DD');
      const formattedTime = values.time.format('HH:mm');
      const position = Array.isArray(values.position) && values.position.length > 0
        ? values.position[0] 
        : values.position;

      const interviewData = {
        interviewerEmail: values.interviewerEmail,
        candidateName: values.candidateName,
        candidateEmail: values.candidateEmail,
        position: position,
        scheduledTime: `${formattedDate}T${formattedTime}:00Z`,
        title: `Interview for ${position}`,
        duration: 60,
        status: 'scheduled'
      };

      const response = await fetch(`${API_URL}/api/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(interviewData),
      });
      let errorText = await response.text();
      if (!response.ok) {
        let errorDetails = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorDetails = errorData.message || JSON.stringify(errorData);
        } catch {}
        throw new Error(errorDetails);
      }
      const data = JSON.parse(errorText);

      message.success(data.message || 'Interview scheduled successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchInterviews();
    } catch (error) {
      console.error('Scheduling interview error:', error);
      message.error(error.message || 'Failed to schedule interview');
    }
  };

  const openFeedbackModal = async (interview) => {
    setFeedbackModal({ visible: true, interview, loading: true, feedback: null });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/interviews/${interview.id}/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFeedbackModal((prev) => ({ ...prev, loading: false, feedback: data.feedback || {} }));
    } catch {
      setFeedbackModal((prev) => ({ ...prev, loading: false, feedback: {} }));
      message.error('Failed to load feedback');
    }
  };

  const closeFeedbackModal = () => setFeedbackModal({ visible: false, interview: null, loading: false, feedback: null });

  const handleFeedbackSubmit = async (values) => {
    setFeedbackModal((prev) => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/interviews/${feedbackModal.interview.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      message.success('Feedback submitted!');
      setFeedbackModal((prev) => ({ ...prev, loading: false, feedback: values }));
      fetchStats(); // Refresh stats if needed
    } catch {
      setFeedbackModal((prev) => ({ ...prev, loading: false }));
      message.error('Failed to submit feedback');
    }
  };

  const handleShareInterview = async (interview) => {
    try {
      const interviewUrl = generateInterviewUrl(interview.id || interview._id);
      const success = await shareInterviewUrl(interviewUrl, interview.title);
      
      if (success) {
        message.success('Interview URL copied to clipboard!');
      } else {
        message.error('An unexpected error occurred while sharing the interview.');
      }
    } catch (error) {
      console.error('Error sharing interview:', error);
      message.error('An unexpected error occurred while sharing the interview.');
    }
  };

  const handleStartInterview = async (interview) => {
    const interviewUrl = generateInterviewUrl(interview.id || interview._id);
    window.open(interviewUrl, '_blank');
  };

  const handleDeleteInterview = async (interview) => {
    AntdModal.confirm({
      title: 'Delete Interview',
      content: 'Are you sure you want to delete this interview? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            message.error('User not authenticated.');
            return;
          }
          const response = await fetch(`${API_URL}/api/interviews/${interview.id || interview._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.message || 'Failed to delete interview');
          }
          message.success(result.message || 'Interview deleted successfully');
          fetchInterviews();
        } catch (error) {
          console.error('Delete interview error:', error);
          message.error(error.message || 'Failed to delete interview');
        }
      },
    });
  };

  const handleEditInterview = (interview) => {
    setEditingInterview(interview);
    setIsEditModalVisible(true);
    const utcDate = interview.scheduledTime ? dayjs.utc(interview.scheduledTime) : null;
    form.setFieldsValue({
      interviewerEmail: interview.interviewerEmail,
      candidateName: interview.candidateName,
      candidateEmail: interview.candidateEmail,
      position: interview.position,
      date: utcDate,
      time: utcDate,
    });
  };

  const handleUpdateInterview = async (values) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('User not authenticated.');
        return;
      }
      // Combine date and time as UTC
      const dateUtc = values.date ? dayjs.utc(values.date) : null;
      const timeUtc = values.time ? dayjs.utc(values.time) : null;
      let scheduledTime = null;
      if (dateUtc && timeUtc) {
        scheduledTime = dayjs.utc(dateUtc)
          .hour(timeUtc.hour())
          .minute(timeUtc.minute())
          .second(0)
          .millisecond(0)
          .toISOString();
      }
      const position = Array.isArray(values.position) && values.position.length > 0
        ? values.position[0]
        : values.position;
      const interviewData = {
        interviewerEmail: values.interviewerEmail,
        candidateName: values.candidateName,
        candidateEmail: values.candidateEmail,
        position: position,
        scheduledTime: scheduledTime,
        title: `Interview for ${position}`,
        duration: 60,
        status: editingInterview.status,
        passcode: editingInterview.passcode
      };
      const response = await fetch(`${API_URL}/api/interviews/${editingInterview.id || editingInterview._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(interviewData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update interview');
      }
      message.success(result.message || 'Interview updated successfully');
      setIsEditModalVisible(false);
      setEditingInterview(null);
      form.resetFields();
      fetchInterviews();
    } catch (error) {
      console.error('Updating interview error:', error);
      message.error(error.message || 'Failed to update interview');
    }
  };

  const getSortedInterviews = (interviews) => {
    const sorted = [...interviews];
    switch (sortOption) {
      case 'farthest':
        sorted.sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime));
        break;
      case 'candidateAZ':
        sorted.sort((a, b) => (a.candidateName || '').localeCompare(b.candidateName || ''));
        break;
      case 'candidateZA':
        sorted.sort((a, b) => (b.candidateName || '').localeCompare(a.candidateName || ''));
        break;
      case 'statusAZ':
        sorted.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
        break;
      case 'closest':
      default:
        sorted.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
        break;
    }
    return sorted;
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
      render: (position) => {
        const positionText = Array.isArray(position) ? position.join(', ') : position;
        return positionText ? <PositionTag>{positionText}</PositionTag> : null;
      },
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
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <StyledButton
            type="default"
            size="small"
            style={{ background: 'transparent', color: '#61dafb', border: 'none', minWidth: 32, padding: 0 }}
            icon={<EditOutlined style={{ fontSize: 18 }} />}
            onClick={() => handleEditInterview(record)}
          />
          {canStartInterview(record, user?.id) ? (
            <StyledButton
              type="primary"
              size="small"
              onClick={() => handleStartInterview(record)}
            >
              Start Interview
            </StyledButton>
          ) : (
            <StyledButton
              type="primary"
              size="small"
              onClick={() => navigate(`/interview/${record.id || record._id}`)}
            >
              {record.status === 'in-progress' ? 'Join Interview' : 'View Interview'}
            </StyledButton>
          )}
          <StyledButton
            type="default"
            size="small"
            icon={<ShareAltOutlined />}
            onClick={() => handleShareInterview(record)}
            style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', minWidth: 32, padding: 0 }}
          />
          <StyledButton
            type="default"
            size="small"
            danger
            style={{ background: 'transparent', color: '#ff4d4f', border: 'none', minWidth: 32, padding: 0 }}
            icon={<DeleteOutlined style={{ fontSize: 18 }} />}
            onClick={() => handleDeleteInterview(record)}
          />
          <StyledButton
            type="default"
            size="small"
            style={{ background: 'linear-gradient(45deg, #232B3E, #181F2A)', color: '#FFD700', border: 'none', minWidth: 32, padding: 0 }}
            onClick={() => openFeedbackModal(record)}
            icon={<StarFilled />}
          />
        </div>
      ),
    },
  ];

  const filteredInterviews = upcomingInterviews.filter(interview => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
        (interview.candidateName && interview.candidateName.toLowerCase().includes(searchLower)) ||
        (interview.candidateEmail && interview.candidateEmail.toLowerCase().includes(searchLower)) ||
        (interview.position && interview.position.toLowerCase().includes(searchLower))
    );
    const matchesStatus = statusFilter === 'all' || (interview.status && interview.status.toLowerCase() === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const sortedInterviews = getSortedInterviews(filteredInterviews);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <DashboardOutlined style={{ fontSize: '1.8rem', color: '#61dafb' }} />
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', fontWeight: 800, letterSpacing: 0.5 }}>Interviewer Dashboard</h2>
        </div>
        <Space size="large" style={{ gap: '1.2rem', alignItems: 'center' }}>
          <Button type="primary" style={{ background: 'linear-gradient(45deg,rgba(6, 75, 95, 0.28), #007ACC)' }} icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>Schedule Interview</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchInterviews(); fetchStats(); }}>Refresh</Button>
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

      <StyledCard
        title="Upcoming Interviews"
        className="interviews-card"
        variants={itemVariants}
        extra={
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Input.Search
              placeholder="Search..."
              onSearch={value => setSearchQuery(value)}
              onChange={e => setSearchQuery(e.target.value)}
              className="dark-input"
            />
            <Select
              defaultValue="all"
              onChange={value => setStatusFilter(value)}
              style={{ width: 170 }}
              className="status-filter-modern"
              popupClassName="dark-select-dropdown"
            >
              <Option value="all">All Statuses</Option>
              <Option value="scheduled">Scheduled</Option>
              <Option value="in-progress">In Progress</Option>
              <Option value="completed">Completed</Option>
            </Select>
            <Select
              value={sortOption}
              onChange={setSortOption}
              style={{ width: 170 }}
              className="status-filter-modern"
              popupClassName="dark-select-dropdown"
            >
              <Option value="closest">Closest (Soonest)</Option>
              <Option value="farthest">Farthest (Latest)</Option>
              <Option value="candidateAZ">Candidate Name (A-Z)</Option>
              <Option value="candidateZA">Candidate Name (Z-A)</Option>
              <Option value="statusAZ">Status (A-Z)</Option>
            </Select>
          </div>
        }
      >
         <AnimatePresence>
          <Table
            columns={columns}
            dataSource={sortedInterviews}
            rowKey="id"
            pagination={false}
            showHeader={true}
            locale={{ emptyText: <CustomEmpty /> }}
            components={{
              body: {
                row: MotionTr,
              },
            }}
          />
        </AnimatePresence>
      </StyledCard>

      <Modal
        title={<span style={{ color: '#fff' }}>Schedule New Interview</span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        className="schedule-modal"
        centered
        styles={{ body: { background: 'linear-gradient(135deg, #181F2A 0%, #232B3E 100%)', borderRadius: 16 } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleScheduleInterview}
          style={{ color: '#fff' }}
        >
          <Form.Item
            name="interviewerEmail"
            label={<span style={{ color: '#b0b8c9' }}>Interviewer Email</span>}
            rules={[{ required: true, message: 'Please enter the interviewer\'s email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
            initialValue={user?.email}
          >
            <Input size="large" placeholder="Enter interviewer's email" />
          </Form.Item>
          <Form.Item name="candidateName" label={<span style={{ color: '#b0b8c9' }}>Candidate Name</span>} rules={[{ required: true, message: 'Please enter candidate\'s name' }]}>
            <Input size="large" placeholder="Enter candidate's full name" />
          </Form.Item>
          <Form.Item name="candidateEmail" label={<span style={{ color: '#b0b8c9' }}>Candidate Email</span>} rules={[{ required: true, message: 'Please enter candidate\'s email' }, { type: 'email' }]}>
            <Input size="large" placeholder="Enter candidate's email" />
          </Form.Item>
          <Form.Item name="position" label={<span style={{ color: '#b0b8c9' }}>Position</span>} rules={[{ required: true, message: 'Please select a position' }]}>
            <Select placeholder="Select a job role">
              <Option value="Frontend Developer">Frontend Developer</Option>
              <Option value="Backend Developer">Backend Developer</Option>
              <Option value="Full Stack Developer">Full Stack Developer</Option>
              <Option value="DevOps Engineer">DevOps Engineer</Option>
              <Option value="Data Scientist">Data Scientist</Option>
              <Option value="QA Engineer">QA Engineer</Option>
              <Option value="UI/UX Designer">UI/UX Designer</Option>
              <Option value="Mobile Developer">Mobile Developer</Option>
              <Option value="Product Manager">Product Manager</Option>
            </Select>
          </Form.Item>
          <Form.Item name="date" label={<span style={{ color: '#b0b8c9' }}>Date</span>} rules={[{ required: true, message: 'Please select a date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="time" label={<span style={{ color: '#b0b8c9' }}>Time</span>} rules={[{ required: true, message: 'Please select a time' }]}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item>
            <StyledButton type="primary" htmlType="submit" block>Schedule Interview</StyledButton>
          </Form.Item>
        </Form>
      </Modal>

      <Modal  
        title={<span style={{ color: '#fff' }}>Provide Feedback</span>}
        open={feedbackModal.visible }
        onCancel={closeFeedbackModal}
        footer={null}
        className="feedback-modal"
        centered
        styles={{ body: { background: '#181F2A', borderRadius: 16, color: '#fff' } }}
        bodyStyle={{ background: '#181F2A', color: '#fff', borderRadius: 16 }}
        titleStyle={{ color: '#fff' }}
      >
        <Form
          layout="vertical"
          onFinish={handleFeedbackSubmit}
          initialValues={feedbackModal.feedback || {}}
          key={feedbackModal.interview ? feedbackModal.interview.id : 'feedback-form'}
        >
          <Form.Item name="rating" label={<span style={{ color: '#fff' }}>Overall Rating</span>} rules={[{ required: true, message: "Please provide a rating" }]}> 
            <Rate className="custom-rate" style={{ fontSize: '2.4rem', color: '#ffd700', filter: 'drop-shadow(0 0 2px #000a)' }} />
          </Form.Item>
          <Form.Item name="comment" label="Comments">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <StyledButton type="primary" htmlType="submit" loading={feedbackModal.loading} block>
              Submit Feedback
            </StyledButton>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span style={{ color: '#fff' }}>Edit Interview</span>}
        open={isEditModalVisible}
        onCancel={() => { setIsEditModalVisible(false); setEditingInterview(null); }}
        footer={null}
        className="schedule-modal"
        centered
        styles={{ body: { background: 'linear-gradient(135deg, #181F2A 0%, #232B3E 100%)', borderRadius: 16 } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateInterview}
          style={{ color: '#fff' }}
        >
          <Form.Item
            name="interviewerEmail"
            label={<span style={{ color: '#b0b8c9' }}>Interviewer Email</span>}
            rules={[{ required: true, message: 'Please enter the interviewer\'s email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
          >
            <Input size="large" placeholder="Enter interviewer's email" />
          </Form.Item>
          <Form.Item name="candidateName" label={<span style={{ color: '#b0b8c9' }}>Candidate Name</span>} rules={[{ required: true, message: 'Please enter candidate\'s name' }]}> 
            <Input size="large" placeholder="Enter candidate's full name" />
          </Form.Item>
          <Form.Item name="candidateEmail" label={<span style={{ color: '#b0b8c9' }}>Candidate Email</span>} rules={[{ required: true, message: 'Please enter candidate\'s email' }, { type: 'email' }]}> 
            <Input size="large" placeholder="Enter candidate's email" />
          </Form.Item>
          <Form.Item name="position" label={<span style={{ color: '#b0b8c9' }}>Position</span>} rules={[{ required: true, message: 'Please select a position' }]}> 
            <Select placeholder="Select a job role">
              <Option value="Frontend Developer">Frontend Developer</Option>
              <Option value="Backend Developer">Backend Developer</Option>
              <Option value="Full Stack Developer">Full Stack Developer</Option>
              <Option value="DevOps Engineer">DevOps Engineer</Option>
              <Option value="Data Scientist">Data Scientist</Option>
              <Option value="QA Engineer">QA Engineer</Option>
              <Option value="UI/UX Designer">UI/UX Designer</Option>
              <Option value="Mobile Developer">Mobile Developer</Option>
              <Option value="Product Manager">Product Manager</Option>
            </Select>
          </Form.Item>
          <Form.Item name="date" label={<span style={{ color: '#b0b8c9' }}>Date</span>} rules={[{ required: true, message: 'Please select a date' }]}> 
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="time" label={<span style={{ color: '#b0b8c9' }}>Time</span>} rules={[{ required: true, message: 'Please select a time' }]}> 
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item>
            <StyledButton type="primary" htmlType="submit" block>Update Interview</StyledButton>
          </Form.Item>
        </Form>
      </Modal>
    </DashboardContainer>
  );
};

export default InterviewerDashboard; 