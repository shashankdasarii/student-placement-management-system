import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import API_BASE_URL from '../config';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [profile, setProfile] = useState(storedUser);
  const [eligibleJobs, setEligibleJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs');
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // 1. Fetch eligible jobs
      const jobsRes = await axios.get(`${API_BASE_URL}/api/jobs/eligible`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEligibleJobs(jobsRes.data?.data || jobsRes.data || []);

      // 2. Fetch my applications
      const appsRes = await axios.get(`${API_BASE_URL}/api/applications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyApplications(appsRes.data?.data || appsRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard jobs/apps:', err);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'applications') {
      fetchDashboardData();
    }
  };

  const handleApply = async (jobId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/applications/apply`,
        { job_id: jobId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Application submitted successfully!');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error applying for job');
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;

    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/students/upload-resume`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadMsg('Resume uploaded successfully!');
      const updatedProfile = { ...profile, resume_url: res.data?.resume_url };
      setProfile(updatedProfile);
      localStorage.setItem('user', JSON.stringify(updatedProfile));
    } catch (err) {
      setUploadMsg(err.response?.data?.message || 'Upload failed');
    }
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return '#34c759';
      case 'Shortlisted': return '#ff9500';
      case 'Rejected': return '#ff3b30';
      default: return 'var(--ios-system-blue)';
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Portal...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Student Placement Portal</h2>
          <p style={{ color: 'var(--ios-text-secondary)' }}>Welcome back, {profile?.name || profile?.username || 'Student'}!</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="badge badge-accent">STUDENT</span>
          <button className="secondary" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      {/* Profile Cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="card">
          <label style={{ fontSize: '11px' }}>FULL NAME</label>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{profile?.name || profile?.username || 'Student'}</div>
        </div>
        <div className="card">
          <label style={{ fontSize: '11px' }}>BRANCH</label>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{profile?.branch || 'Information Technology'}</div>
        </div>
        <div className="card">
          <label style={{ fontSize: '11px' }}>ACADEMIC CGPA</label>
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ios-system-green)' }}>
            {profile?.cgpa !== null && profile?.cgpa !== undefined ? profile.cgpa : '7.34'}
          </div>
        </div>
      </div>

      {/* Resume Upload */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '8px' }}>📄 PDF Resume Upload</h3>
        <p style={{ color: 'var(--ios-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
          Upload your official resume for recruiters to view
        </p>
        <form onSubmit={handleResumeUpload} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setResumeFile(e.target.files[0])}
            required
            style={{ flex: 1 }}
          />
          <button type="submit">Upload PDF</button>
        </form>
        {uploadMsg && <p style={{ color: 'var(--ios-system-green)', fontSize: '14px', marginTop: '8px' }}>{uploadMsg}</p>}
        {profile?.resume_url && (
          <div style={{ marginTop: '12px' }}>
            <a
              href={profile.resume_url}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--ios-system-blue)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}
            >
              📄 View Uploaded Resume (PDF)
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="segmented-control" style={{ marginBottom: '24px' }}>
        <button
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => handleTabChange('jobs')}
        >
          📋 Eligible Jobs ({eligibleJobs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => handleTabChange('applications')}
        >
          📥 My Applications ({myApplications.length})
        </button>
      </div>

      {/* Eligible Jobs */}
      {activeTab === 'jobs' && (
        <div>
          {eligibleJobs.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', padding: '40px 0' }}>
              No eligible job postings available at this time for your CGPA criteria.
            </p>
          ) : (
            eligibleJobs.map((job) => {
              const applied = myApplications.some((a) => a.title === job.title);
              return (
                <div key={job.id} className="card" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ios-system-blue)', textTransform: 'uppercase' }}>
                        {job.company_name}
                      </span>
                      <h3 style={{ margin: '4px 0 8px 0' }}>{job.title}</h3>
                    </div>
                    <span className="badge badge-accent">Min CGPA: {job.min_cgpa}</span>
                  </div>
                  <p style={{ color: 'var(--ios-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                    {job.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--ios-text-secondary)' }}>
                      ⏰ Deadline: {new Date(job.deadline).toLocaleDateString()}
                    </span>
                    <button
                      disabled={applied}
                      onClick={() => handleApply(job.id)}
                      style={{ background: applied ? 'rgba(255,255,255,0.1)' : 'var(--ios-system-green)' }}
                    >
                      {applied ? '✓ Applied' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* My Applications */}
      {activeTab === 'applications' && (
        <div>
          {myApplications.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', padding: '40px 0' }}>
              You haven't submitted any applications yet.
            </p>
          ) : (
            myApplications.map((app) => (
              <div key={app.id} className="card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ios-system-blue)', textTransform: 'uppercase' }}>
                      {app.company_name}
                    </span>
                    <h3 style={{ margin: '4px 0' }}>{app.title}</h3>
                    <span style={{ fontSize: '13px', color: 'var(--ios-text-secondary)' }}>
                      Applied on: {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span style={{
                    backgroundColor: `${getStatusColor(app.status)}20`,
                    color: getStatusColor(app.status),
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '13px',
                    border: `1px solid ${getStatusColor(app.status)}40`
                  }}>
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
};

export default StudentDashboard;