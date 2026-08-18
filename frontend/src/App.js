import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import RecruiterDashboard from './components/RecruiterDashboard';
import './App.css';

// Guard component that enforces role access
const RoleRoute = ({ allowedRole, children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user.role) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'student' ? '/student-dashboard' : '/recruiter-dashboard'} replace />;
  }

  return children;
};

// Root redirect handler
const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user.role) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'student' ? '/student-dashboard' : '/recruiter-dashboard'} replace />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Student Protected Route */}
          <Route
            path="/student-dashboard"
            element={
              <RoleRoute allowedRole="student">
                <StudentDashboard />
              </RoleRoute>
            }
          />

          {/* Recruiter Protected Route */}
          <Route
            path="/recruiter-dashboard"
            element={
              <RoleRoute allowedRole="recruiter">
                <RecruiterDashboard />
              </RoleRoute>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
