import React, { useState } from 'react';
import { Input, Button, message, Typography, Space } from 'antd';
import { CopyOutlined, ShareAltOutlined, LinkOutlined, CloseOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

const { Text, Title } = Typography;

const Container = styled.div`
  background: linear-gradient(135deg, #232b3e 0%, #181f2a 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #8892b0;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    color: #61dafb;
    transform: rotate(90deg);
  }
`;

const UrlInput = styled(Input)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  
  &:focus {
    border-color: #61dafb;
    box-shadow: 0 0 0 2px rgba(97, 218, 251, 0.2);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ActionButton = styled(Button)`
  background: linear-gradient(45deg, #61dafb, #007acc);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(97, 218, 251, 0.3);
    background: linear-gradient(45deg, #61dafb, #007acc);
  }
`;

const ShareButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: #61dafb;
    color: #61dafb;
    transform: translateY(-2px);
  }
`;

const InterviewUrlDisplay = ({ interviewUrl, interviewTitle = 'Interview', onCopy, onShare, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(interviewUrl);
      setCopied(true);
      message.success('Interview URL copied to clipboard!');
      if (onCopy) onCopy(interviewUrl);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Error copying URL:', error);
      message.error('Failed to copy URL. Please copy it manually.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: interviewTitle,
          text: `Here is the link to your interview:`,
          url: interviewUrl,
        });
        message.success('Interview URL shared successfully!');
        if (onShare) onShare(interviewUrl);
      } catch (error) {
        // Don't show an error if the user cancels the share dialog
        if (error.name !== 'AbortError') {
          console.error('Error sharing URL:', error);
          message.error('Could not share the URL.');
        }
      }
    } else {
      message.info('Web Share API is not supported in your browser. You can copy the link manually.');
    }
  };

  return (
    <Container>
      <CloseButton onClick={onClose}>
        <CloseOutlined />
      </CloseButton>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LinkOutlined style={{ color: '#61dafb', fontSize: '1.5rem' }} />
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Share Link with Candidate
          </Title>
        </div>
        
        <Text style={{ color: '#b0b8c9', fontSize: '1rem' }}>
          The candidate can use this link to join the interview session.
        </Text>
        
        <Input.Group compact style={{ display: 'flex' }}>
          <UrlInput
            value={interviewUrl}
            readOnly
            placeholder="Interview URL will appear here..."
            style={{ flex: 1, fontSize: '1rem' }}
          />
          <ActionButton
            icon={<CopyOutlined />}
            onClick={handleCopy}
            style={{ width: '120px' }}
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </ActionButton>
        </Input.Group>
        
        {navigator.share && (
          <ShareButton
            icon={<ShareAltOutlined />}
            onClick={handleShare}
            style={{ width: '100%' }}
          >
            Or Share Directly...
          </ShareButton>
        )}
      </Space>
    </Container>
  );
};

export default InterviewUrlDisplay; 