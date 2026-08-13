import React from 'react';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import RecruiterDashboard from './RecruiterDashboard';

function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  if (user?.role === 'recruiter') {
    return <RecruiterDashboard />;
  }

  // Fallback for admin role
  return (
    <div className="app-container">
      <header className="navbar">
        <div>
          <h2 className="navbar-brand">Placement System Admin Dashboard</h2>
          <p className="navbar-sub">System Administrator Account</p>
        </div>
        <div className="navbar-right">
          <span className="role-badge role-admin">ADMIN</span>
        </div>
      </header>
      <div className="card">
        <h3>System Administrator</h3>
        <p style={{ color: '#94a3b8', marginTop: '12px' }}>
          Logged in as <strong>{user?.username}</strong>. Full system access enabled.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
