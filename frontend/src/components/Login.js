import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://127.0.0.1:5001/api/auth/login', formData);
      const { token, user } = res.data;

      // Clear any prior session and store fresh authentication
      localStorage.clear();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Direct redirection strictly based on role
      if (user.role === 'student') {
        navigate('/student-dashboard', { replace: true });
      } else if (user.role === 'recruiter') {
        navigate('/recruiter-dashboard', { replace: true });
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '440px', margin: '80px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Welcome Back</h2>
      <p style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', marginBottom: '24px' }}>
        Log in to Student Placement Management System
      </p>

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

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label>Username</label>
          <input
            type="text"
            name="username"
            required
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
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

        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--ios-text-secondary)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--ios-system-blue)', textDecoration: 'none', fontWeight: 600 }}>Register here</Link>
      </p>
    </div>
  );
};

export default Login;
