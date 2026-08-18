import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    branch: 'Computer Science',
    cgpa: '',
    resume_url: '',
    company_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        role: role,
        name: formData.name,
        email: formData.email,
        branch: formData.branch,
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
        resume_url: formData.resume_url,
        company_name: formData.company_name
      };

      await axios.post('http://127.0.0.1:5001/api/auth/register', payload);
      
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '520px', margin: '40px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Create Account</h2>
      <p style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', marginBottom: '24px' }}>
        Join the Student Placement Portal
      </p>

      {/* Role Switcher */}
      <div className="segmented-control">
        <button
          type="button"
          className={`tab-btn ${role === 'student' ? 'active' : ''}`}
          onClick={() => setRole('student')}
        >
          🎓 Student
        </button>
        <button
          type="button"
          className={`tab-btn ${role === 'recruiter' ? 'active' : ''}`}
          onClick={() => setRole('recruiter')}
        >
          💼 Recruiter
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(255, 59, 48, 0.15)',
          color: '#ff6b60',
          border: '1px solid rgba(255, 59, 48, 0.3)',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(52, 199, 89, 0.15)',
          color: '#4cd964',
          border: '1px solid rgba(52, 199, 89, 0.3)',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label>Username</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. sasi123"
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>
        </div>

        {role === 'student' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Shashank"
                />
              </div>
              <div>
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label>Branch</label>
                <select name="branch" value={formData.branch} onChange={handleChange}>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Comm.">Electronics & Comm.</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>
              <div>
                <label>CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  name="cgpa"
                  required
                  value={formData.cgpa}
                  onChange={handleChange}
                  placeholder="8.50"
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label>Company Name</label>
            <input
              type="text"
              name="company_name"
              required
              value={formData.company_name}
              onChange={handleChange}
              placeholder="Google, Microsoft, TCS..."
            />
          </div>
        )}

        <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '12px' }}>
          {loading ? 'Registering...' : `Register as ${role === 'student' ? 'Student' : 'Recruiter'}`}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--ios-text-secondary)' }}>
        Already registered? <Link to="/login" style={{ color: 'var(--ios-system-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign in here</Link>
      </p>
    </div>
  );
};

export default Register;
