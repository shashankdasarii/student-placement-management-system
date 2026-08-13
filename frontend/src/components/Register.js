import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Student specific state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [cgpa, setCgpa] = useState('8.00');
  const [resumeUrl, setResumeUrl] = useState('');

  // Recruiter specific state
  const [companyName, setCompanyName] = useState('');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const payload = {
      username,
      password,
      role,
      ...(role === 'student'
        ? { name, email, branch, cgpa: parseFloat(cgpa) || 0, resume_url: resumeUrl }
        : { company_name: companyName })
    };

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', payload);
      if (res.data.status === 'success') {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 'Failed to register. Please check your inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join the Student Placement Portal</p>

        {/* Role Selector Tabs */}
        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            🎓 Student
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'recruiter' ? 'active' : ''}`}
            onClick={() => setRole('recruiter')}
          >
            💼 Recruiter
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set password"
                required
              />
            </div>
          </div>

          {role === 'student' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Branch / Specialization</label>
                  <select
                    className="form-input"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">CGPA (0.0 - 10.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    className="form-input"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resume URL (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/your-resume.pdf"
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="TechCorp Solutions"
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : `Register as ${role === 'student' ? 'Student' : 'Recruiter'}`}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login" className="auth-link">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
