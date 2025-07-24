// Utility functions for interview management

/**
 * Generate a shareable interview URL
 * @param {string} interviewId - The interview ID
 * @param {string} baseUrl - The base URL of the application
 * @returns {string} The complete interview URL
 */
export const generateInterviewUrl = (interviewId, baseUrl = window.location.origin) => {
  return `${baseUrl}/interview/${interviewId}`;
};

/**
 * Copy interview URL to clipboard
 * @param {string} interviewUrl - The interview URL to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyInterviewUrl = async (interviewUrl) => {
  try {
    await navigator.clipboard.writeText(interviewUrl);
    return true;
  } catch (error) {
    console.error('Failed to copy URL:', error);
    return false;
  }
};

/**
 * Share interview URL via native sharing API or fallback to clipboard
 * @param {string} interviewUrl - The interview URL to share
 * @param {string} title - The interview title
 * @returns {Promise<boolean>} Success status
 */
export const shareInterviewUrl = async (interviewUrl, title = 'Interview Link') => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: `Join me for an interview: ${title}`,
        url: interviewUrl,
      });
      return true;
    } catch (error) {
      console.error('Failed to share:', error);
      // Fallback to clipboard
      return await copyInterviewUrl(interviewUrl);
    }
  } else {
    // Fallback to clipboard
    return await copyInterviewUrl(interviewUrl);
  }
};

/**
 * Format interview duration from minutes to human readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatInterviewDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
};

/**
 * Check if interview can be started
 * @param {Object} interview - Interview object
 * @param {string} userId - Current user ID
 * @returns {boolean} Whether interview can be started
 */
export const canStartInterview = (interview, userId) => {
  return (
    interview.interviewer._id === userId &&
    interview.status === 'scheduled' &&
    new Date(interview.scheduledTime) <= new Date()
  );
};

/**
 * Get interview status color
 * @param {string} status - Interview status
 * @returns {string} Color for the status
 */
export const getInterviewStatusColor = (status) => {
  switch (status) {
    case 'scheduled':
      return 'blue';
    case 'in-progress':
      return 'orange';
    case 'completed':
      return 'green';
    case 'cancelled':
      return 'red';
    default:
      return 'default';
  }
};

/**
 * Format interview date and time
 * @param {string} dateString - ISO date string
 * @returns {Object} Formatted date and time
 */
export const formatInterviewDateTime = (dateString) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullDate: date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
}; 