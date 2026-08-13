import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const profile = user?.profile;

  const [activeTab, setActiveTab] = useState('eligible');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Resume Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(profile?.resume_url || '');

  // Fetch eligible jobs
  const fetchEligibleJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:5000/api/jobs/eligible');
      if (res.data.status === 'success') {
        setJobs(res.data.jobs);
      }
    } catch (err) {
      console.error('Error fetching eligible jobs:', err);
      setError(err.response?.data?.message || 'Failed to load eligible jobs.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student's applications
  const fetchMyApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:5000/api/applications/my-applications');
      if (res.data.status === 'success') {
        setApplications(res.data.applications);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.response?.data?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'eligible') {
      fetchEligibleJobs();
    } else {
      fetchMyApplications();
    }
  }, [activeTab]);

  const handleApply = async (jobId) => {
    setActionMessage(null);
    try {
      const res = await axios.post('http://localhost:5000/api/applications/apply', {
        job_id: jobId
      });
      if (res.data.status === 'success') {
        setActionMessage('✅ Application submitted successfully!');
        fetchEligibleJobs();
      }
    } catch (err) {
      console.error('Apply error:', err);
      setActionMessage(`❌ ${err.response?.data?.message || 'Failed to submit application.'}`);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setActionMessage('❌ Please select a PDF file first.');
      return;
    }

    setUploadingResume(true);
    setActionMessage(null);

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      const res = await axios.post('http://localhost:5000/api/students/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.status === 'success') {
        setResumeUrl(res.data.resume_url);
        setActionMessage('✅ PDF Resume uploaded successfully!');
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setActionMessage(`❌ ${err.response?.data?.message || 'Failed to upload PDF resume.'}`);
    } finally {
      setUploadingResume(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div>
          <h2 className="navbar-brand">Student Placement Portal</h2>
          <p className="navbar-sub">Welcome back, {profile?.name || user?.username}!</p>
        </div>
        <div className="navbar-right">
          <span className="role-badge role-student">STUDENT</span>
          <button onClick={logout} className="btn-logout">
            Sign Out
          </button>
        </div>
      </header>

      {/* Metrics Banner */}
      <div className="metrics-banner">
        <div className="metric-box">
          <span className="metric-title">Full Name</span>
          <span className="metric-value">{profile?.name || 'N/A'}</span>
        </div>
        <div className="metric-box">
          <span className="metric-title">Branch</span>
          <span className="metric-value">{profile?.branch || 'N/A'}</span>
        </div>
        <div className="metric-box">
          <span className="metric-title">Academic CGPA</span>
          <span className="metric-value highlight-green">{profile?.cgpa || '0.00'}</span>
        </div>
      </div>

      {/* Resume Upload Box */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title">📄 PDF Resume Upload</h3>
        <p className="card-sub">Upload your official resume for recruiters to view</p>

        <form onSubmit={handleResumeUpload} className="resume-upload-form">
          <input
            type="file"
            accept="application/pdf"
            className="file-input"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
          <button type="submit" className="btn-primary" disabled={uploadingResume}>
            {uploadingResume ? 'Uploading...' : 'Upload PDF'}
          </button>
        </form>

        {resumeUrl && (
          <div className="resume-link-box">
            <span>Current Resume:</span>
            <a href={resumeUrl} target="_blank" rel="noreferrer" className="auth-link">
              📄 View Uploaded Resume (PDF)
            </a>
          </div>
        )}
      </div>

      {actionMessage && <div className="alert alert-success">{actionMessage}</div>}

      {/* View Switcher Tabs */}
      <div className="view-tabs">
        <button
          className={`view-tab ${activeTab === 'eligible' ? 'active' : ''}`}
          onClick={() => setActiveTab('eligible')}
        >
          📋 Eligible Jobs ({jobs.length})
        </button>
        <button
          className={`view-tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📤 My Applications ({applications.length})
        </button>
      </div>

      {loading && <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading details...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Eligible Jobs View */}
      {!loading && activeTab === 'eligible' && (
        <div className="jobs-grid">
          {jobs.length === 0 ? (
            <div className="card text-center" style={{ color: '#94a3b8' }}>
              No eligible job postings available at this time for your CGPA criteria.
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-card-header">
                  <div>
                    <span className="company-tag">{job.company_name}</span>
                    <h3 className="job-title">{job.title}</h3>
                  </div>
                  <span className="cgpa-pill">Min CGPA: {job.min_cgpa}</span>
                </div>

                <p className="job-desc">{job.description}</p>

                <div className="job-card-footer">
                  <span className="deadline-text">
                    ⏰ Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </span>
                  {job.has_applied ? (
                    <button className="btn-applied" disabled>
                      ✓ Applied
                    </button>
                  ) : (
                    <button
                      className="btn-apply"
                      onClick={() => handleApply(job.id)}
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* My Applications View */}
      {!loading && activeTab === 'applications' && (
        <div className="applications-list">
          {applications.length === 0 ? (
            <div className="card text-center" style={{ color: '#94a3b8' }}>
              You haven't applied to any jobs yet. Check out "Eligible Jobs" above!
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.application_id} className="app-card">
                <div className="app-card-left">
                  <span className="company-tag">{app.company_name}</span>
                  <h3 className="job-title">{app.title}</h3>
                  <span className="applied-date">
                    Applied on: {new Date(app.applied_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="app-card-right">
                  <span className={`status-badge status-${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
