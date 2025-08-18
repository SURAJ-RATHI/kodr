import { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { FaUserCircle, FaUserTie, FaUserGraduate, FaChevronDown, FaChevronUp, FaSearch, FaLink } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 4vw, 2rem);
  background: linear-gradient(135deg, #232526 0%, #1a1a1a 100%);
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    padding: clamp(0.75rem, 3vw, 1.5rem);
  }
  
  @media (max-width: 480px) {
    padding: clamp(0.5rem, 2vw, 1rem);
  }
`;

const Card = styled.div`
  background: rgba(34, 40, 49, 0.85);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.25);
  border-radius: clamp(16px, 4vw, 22px);
  border: 2px solid transparent;
  background-clip: padding-box;
  padding: clamp(2rem, 5vw, 2.5rem) clamp(2rem, 5vw, 2.5rem) clamp(1.5rem, 4vw, 2rem) clamp(2rem, 5vw, 2.5rem);
  min-width: clamp(280px, 80vw, 340px);
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1rem, 2.5vw, 1.2rem);
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    inset: -2px;
    z-index: -1;
    border-radius: clamp(18px, 4.5vw, 24px);
    background: linear-gradient(120deg, #61dafb, #007acc, #232526 80%);
    opacity: 0.7;
  }
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    padding: clamp(1.75rem, 4vw, 2.25rem);
    min-width: clamp(260px, 85vw, 320px);
    gap: 1rem;
  }
  
  @media (max-width: 480px) {
    padding: clamp(1.5rem, 3.5vw, 2rem);
    min-width: clamp(240px, 90vw, 300px);
    gap: 0.875rem;
  }
`;

const Heading = styled.h2`
  color: #61dafb;
  font-size: clamp(1.5rem, 4.5vw, 2.1rem);
  font-weight: 900;
  margin-bottom: clamp(0.4rem, 1.5vw, 0.5rem);
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 0.7rem);
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    font-size: clamp(1.75rem, 4vw, 2rem);
    margin-bottom: 0.4rem;
    gap: 0.6rem;
  }
  
  @media (max-width: 480px) {
    font-size: clamp(1.5rem, 3.5vw, 1.75rem);
    margin-bottom: 0.3rem;
    gap: 0.5rem;
  }
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: clamp(1.1rem, 2.8vw, 1.3rem);
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    gap: 1.1rem;
  }
  
  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

const Field = styled.div`
  position: relative;
  margin-bottom: clamp(0.1rem, 0.5vw, 0.2rem);
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    margin-bottom: 0.1rem;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 0.1rem;
  }
`;

const FloatingLabel = styled.label`
  position: absolute;
  left: clamp(1.25rem, 3vw, 1.5rem);
  top: clamp(1rem, 2.5vw, 1.1rem);
  color: #61dafb;
  font-size: clamp(0.95rem, 2.5vw, 1.05rem);
  font-weight: 600;
  pointer-events: none;
  background: transparent;
  transition: 0.2s;
  opacity: 0.85;
  z-index: 2;
  transform: translateY(0);
  
  ${props => props.active && `
    top: clamp(-0.6rem, -1.5vw, -0.7rem);
    left: clamp(0.6rem, 1.5vw, 0.8rem);
    font-size: clamp(0.85rem, 2.2vw, 0.92rem);
    background: #222831;
    padding: 0 clamp(0.2rem, 0.5vw, 0.3rem);
    opacity: 1;
  `}
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    left: 1.25rem;
    top: 1rem;
    font-size: 1rem;
    
    ${props => props.active && `
      top: -0.6rem;
      left: 0.6rem;
      font-size: 0.9rem;
      padding: 0 0.25rem;
    `}
  }
  
  @media (max-width: 480px) {
    left: 1.125rem;
    top: 0.875rem;
    font-size: 0.9rem;
    
    ${props => props.active && `
      top: -0.5rem;
      left: 0.5rem;
      font-size: 0.8rem;
      padding: 0 0.2rem;
    `}
  }
`;

const Input = styled.input`
  width: 100%;
  padding: clamp(1rem, 2.5vw, 1.1rem) clamp(1rem, 2.5vw, 1.1rem) clamp(0.6rem, 1.8vw, 0.7rem) clamp(1rem, 2.5vw, 1.1rem);
  border-radius: clamp(8px, 2vw, 10px);
  border: 1.5px solid ${props => props.valid === true ? '#4caf50' : props.valid === false ? '#ff4d4f' : '#333'};
  background: #2a2f37;
  color: #fff;
  font-size: clamp(0.95rem, 2.5vw, 1.08rem);
  outline: none;
  transition: border 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px rgba(97,218,251,0.04);

  &:focus {
    border: 1.5px solid #61dafb;
    box-shadow: 0 0 0 2px #61dafb33;
    background: #2a2f37;
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #2a2f37 inset !important;
    -webkit-text-fill-color: #fff !important;
  }
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    padding: 1rem 1rem 0.6rem 1rem;
    font-size: 1rem;
    border-radius: 8px;
  }
  
  @media (max-width: 480px) {
    padding: 0.875rem 0.875rem 0.5rem 0.875rem;
    font-size: 0.9rem;
    border-radius: 6px;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: clamp(1rem, 2.5vw, 1.1rem) clamp(1rem, 2.5vw, 1.1rem) clamp(0.6rem, 1.8vw, 0.7rem) clamp(1rem, 2.5vw, 1.1rem);
  border-radius: clamp(8px, 2vw, 10px);
  border: 1.5px solid ${props => props.valid === true ? '#4caf50' : props.valid === false ? '#ff4d4f' : '#333'};
  background: #2a2f37;
  color: #fff;
  font-size: clamp(0.95rem, 2.5vw, 1.08rem);
  outline: none;
  transition: border 0.2s, box-shadow 0.2s;
  
  &:focus {
    border: 1.5px solid #61dafb;
    box-shadow: 0 0 0 2px #61dafb33;
    background: #2a2f37;
  }
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    padding: 1rem 1rem 0.6rem 1rem;
    font-size: 1rem;
    border-radius: 8px;
  }
  
  @media (max-width: 480px) {
    padding: 0.875rem 0.875rem 0.5rem 0.875rem;
    font-size: 0.9rem;
    border-radius: 6px;
  }
`;

const Button = styled.button`
  padding: clamp(0.875rem, 2.5vw, 1rem) clamp(1.75rem, 4vw, 2rem);
  border-radius: clamp(10px, 2.5vw, 12px);
  border: none;
  background: linear-gradient(90deg, #61dafb, #007acc);
  color: #fff;
  font-size: clamp(1rem, 2.8vw, 1.18rem);
  font-weight: 800;
  cursor: pointer;
  margin-top: clamp(0.4rem, 1.5vw, 0.5rem);
  transition: background 0.2s, transform 0.2s;
  box-shadow: 0 2px 12px rgba(97,218,251,0.08);
  letter-spacing: 0.03em;
  
  &:hover {
    background: linear-gradient(90deg, #007acc, #61dafb);
    transform: translateY(-2px) scale(1.04);
  }
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    padding: 0.875rem 1.75rem;
    font-size: 1.1rem;
    margin-top: 0.4rem;
    border-radius: 10px;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    margin-top: 0.3rem;
    border-radius: 8px;
  }
`;

const Error = styled.div`
  color: #ff4d4f;
  font-size: clamp(0.9rem, 2.3vw, 1.01rem);
  margin-top: clamp(-0.6rem, -1.5vw, -0.7rem);
  margin-bottom: clamp(0.1rem, 0.5vw, 0.2rem);
  text-align: left;
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    font-size: 0.95rem;
    margin-top: -0.6rem;
    margin-bottom: 0.1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.85rem;
    margin-top: -0.5rem;
    margin-bottom: 0.1rem;
  }
`;

const techJobs = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'HR',
  'Data Scientist',
  'DevOps Engineer',
  'Machine Learning Engineer',
  'QA Engineer',
  'UI/UX Designer',
  'Mobile Developer',
  'Cloud Engineer',
  'Security Engineer',
  'Product Manager',
  'Scrum Master',
  'System Architect',
  'Database Administrator',
  'Site Reliability Engineer',
  'AI Engineer',
  'Blockchain Developer',
  'Game Developer',
  'Technical Writer',
  
];

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

const DropdownHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.1rem 0.7rem 0.5rem;
  border-radius: 10px;
  border: 1.5px solid ${props => props.valid === true ? '#4caf50' : props.valid === false ? '#ff4d4f' : '#333'};
  background: rgba(255,255,255,0.07);
  color: #fff;
  font-size: 1.08rem;
  cursor: pointer;
  transition: border 0.2s;
  &:focus {
    border: 1.5px solid #61dafb;
    box-shadow: 0 0 0 2px #61dafb33;
    background: rgba(97,218,251,0.07);
  }
`;

const DropdownList = styled.ul`
  position: absolute;
  top: 110%;
  left: 0;
  width: 100%;
  background: #232831;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(97,218,251,0.12);
  z-index: 10;
  max-height: 220px;
  overflow-y: auto;
  margin: 0;
  padding: 0.3rem 0;
  list-style: none;
`;

const DropdownItem = styled.li`
  padding: 0.9rem 1.1rem;
  color: #fff;
  font-size: 1.07rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  cursor: pointer;
  background: ${props => props.selected ? 'rgba(97,218,251,0.08)' : 'transparent'};
  &:hover {
    background: linear-gradient(90deg, #61dafb22, #007acc22);
    color: #61dafb;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  padding: 0.5rem 1.1rem 0.5rem 1.1rem;
  border-bottom: 1.5px solid #333;
  margin-bottom: 0.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.6rem 1.1rem 0.6rem 2.5rem;
  border: none;
  background: #232831;
  color: #fff;
  font-size: 1.05rem;
  outline: none;
  border-radius: 5px;
  &:focus {
    box-shadow: 0 0 0 2px #61dafb33;
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 1.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #61dafb;
  font-size: 1.1rem;
`;

const UserInfoPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    job: '',
    experience: '',
    interviewLink: ''
  });

  const [errors, setErrors] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredJobs = techJobs.filter(job =>
    job.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value) error = 'Name is required';
        else if (value.length < 2) error = 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Invalid email format';
        break;
      case 'job':
        if (!value) error = 'Please select a job role';
        break;
      case 'experience':
        if (value === '') error = 'Experience is required';
        else if (isNaN(value) || parseInt(value, 10) < 0) error = 'Invalid experience value';
        break;
      case 'interviewLink':
        if (!value) error = 'Interview link is required';
        else if (!/^https?:\/\/\S+$/.test(value)) error = 'Please enter a valid URL';
        break;
      default:
        break;
    }
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    return !error;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isValid = validate();

    if (isValid) {
      console.log('Form submitted:', formData);
      try {
        new URL(formData.interviewLink);
        window.location.href = formData.interviewLink;
      } catch (error) {
        setErrors(prev => ({ ...prev, interviewLink: 'Invalid interview link format.' }));
        console.error('Invalid URL format:', error);
      }
    } else {
      console.log('Form has errors', errors);
    }
  };

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    const fieldsToValidate = ['name', 'email', 'job', 'experience', 'interviewLink'];

    fieldsToValidate.forEach(key => {
      if (!validateField(key, formData[key])) {
        isValid = false;
      } else {
        newErrors[key] = '';
      }
    });

    if (!selectedJob && !newErrors.job) {
      newErrors.job = 'Please select a job role';
      isValid = false;
    } else if (selectedJob && newErrors.job === 'Please select a job role') {
      newErrors.job = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setFormData(prev => ({ ...prev, job }));
    setIsDropdownOpen(false);
    setSearchTerm('');
    validateField('job', job);
  };

  return (
    <Container>
      <Card>
        <Heading>
          <FaUserCircle />
          User Information
        </Heading>
        <Form onSubmit={handleSubmit}>
          <Field>
            <FloatingLabel active={formData.name !== '' || errors.name}>
              Full Name
            </FloatingLabel>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onBlur={handleBlur}
              valid={errors.name ? false : formData.name ? true : null}
            />
            {errors.name && <Error>{errors.name}</Error>}
          </Field>

          <Field>
            <FloatingLabel active={formData.email !== '' || errors.email}>
              Email
            </FloatingLabel>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              valid={errors.email ? false : formData.email ? true : null}
            />
            {errors.email && <Error>{errors.email}</Error>}
          </Field>

          <Field>
            <FloatingLabel active={selectedJob !== '' || errors.job}>
              Job Role
            </FloatingLabel>
            <DropdownContainer ref={dropdownRef}>
              <DropdownHeader
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                valid={errors.job ? false : selectedJob ? true : null}
              >
                {selectedJob}
                {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
              </DropdownHeader>
              {isDropdownOpen && (
                <DropdownList>
                  <SearchContainer>
                    <SearchIcon />
                    <SearchInput
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onBlur={handleBlur}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </SearchContainer>
                  {filteredJobs.length === 0 ? (
                     <DropdownItem key="no-results">No results found</DropdownItem>
                  ) : (
                    filteredJobs.map((job) => (
                      <DropdownItem
                        key={job}
                        onClick={() => handleJobSelect(job)}
                      >
                        {job}
                      </DropdownItem>
                    ))
                  )}
                </DropdownList>
              )}
            </DropdownContainer>
            {errors.job && <Error>{errors.job}</Error>}
          </Field>

          <Field>
            <FloatingLabel active={formData.experience !== '' || errors.experience}>
              Years of Experience
            </FloatingLabel>
            <Input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              onBlur={handleBlur}
              valid={errors.experience ? false : formData.experience ? true : null}
            />
            {errors.experience && <Error>{errors.experience}</Error>}
          </Field>

          <Field>
            <FloatingLabel active={formData.interviewLink !== '' || errors.interviewLink}>
              Interview Link
              <FaLink style={{marginLeft: '0.5rem', fontSize: '0.9em'}}/>
            </FloatingLabel>
            <Input
              type="url"
              name="interviewLink"
              value={formData.interviewLink}
              onChange={handleInputChange}
              onBlur={handleBlur}
              valid={errors.interviewLink ? false : formData.interviewLink ? true : null}
            />
            {errors.interviewLink && <Error>{errors.interviewLink}</Error>}
          </Field>

          <Button type="submit">Join Interview</Button>
        </Form>
      </Card>
    </Container>
  );
};

export default UserInfoPage; 