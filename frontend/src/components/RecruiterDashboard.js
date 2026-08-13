import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function RecruiterDashboard() {
  const { user, logout } = useAuth();
  const profile = user?.profile;

  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minCgpa, setMinCgpa] = useState('7.50');
  const [deadline, setDeadline] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Applicant Drawer State
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchMyJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:5000/api/jobs/my-jobs');
      if (res.data.status === 'success') {
        setJobs(res.data.jobs);
      }
    } catch (err) {
      console.error('Fetch Recruiter Jobs Error:', err);
      setError(err.response?.data?.message || 'Failed to load your posted jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchApplicants = async (jobId) => {
    if (selectedJobId === jobId) {
      setSelectedJobId(null);
      return;
    }

    setSelectedJobId(jobId);
    setLoadingApplicants(true);
    setStatusMessage(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/applications/job/${jobId}`);
      if (res.data.status === 'success') {
        setApplicants(res.data.applications);
      }
    } catch (err) {
      console.error('Fetch Applicants Error:', err);
      setStatusMessage('❌ Failed to load applicants for this job.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    setStatusMessage(null);
    try {
      const res = await axios.put(`http://localhost:5000/api/applications/${applicationId}/status`, {
        status: newStatus
      });

      if (res.data.status === 'success') {
        setStatusMessage(`✅ Candidate status updated to "${newStatus}"!`);
        // Refresh local applicants list
        setApplicants((prev) =>
          prev.map((app) =>
            app.application_id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (err) {
      console.error('Update Status Error:', err);
      setStatusMessage(`❌ ${err.response?.data?.message || 'Failed to update candidate status.'}`);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await axios.post('http://localhost:5000/api/jobs', {
        title,
        description,
        min_cgpa: parseFloat(minCgpa),
        deadline
      });

      if (res.data.status === 'success') {
        setSuccess('🎉 Job opening posted successfully!');
        setTitle('');
        setDescription('');
        setMinCgpa('7.50');
        setDeadline('');
        fetchMyJobs();
      }
    } catch (err) {
      console.error('Post Job Error:', err);
      setError(err.response?.data?.message || 'Failed to post new job.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div>
          <h2 className="navbar-brand">Recruiter Dashboard</h2>
          <p className="navbar-sub">Posting for: {profile?.company_name || 'Your Company'}</p>
        </div>
        <div className="navbar-right">
          <span className="role-badge role-recruiter">RECRUITER</span>
          <button onClick={logout} className="btn-logout">
            Sign Out
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Post New Job Card */}
        <div className="card">
          <h3 className="card-title">Post New Job Opening</h3>
          <p className="card-sub">Create job requirements for campus placement drive</p>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handlePostJob} className="auth-form" style={{ marginTop: '16px' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Minimum Required CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  className="form-input"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Job Description</label>
              <textarea
                className="form-input"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe role responsibilities, tech stack, and location..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Application Deadline</label>
              <input
                type="datetime-local"
                className="form-input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Publishing Job...' : 'Publish Job Opening'}
            </button>
          </form>
        </div>

        {/* Posted Jobs List */}
        <div className="card">
          <h3 className="card-title">Your Active Job Postings ({jobs.length})</h3>

          {loading ? (
            <p style={{ color: '#94a3b8', marginTop: '16px' }}>Loading job postings...</p>
          ) : jobs.length === 0 ? (
            <p style={{ color: '#94a3b8', marginTop: '16px' }}>
              No active job postings yet. Use the form above to publish your first job opening!
            </p>
          ) : (
            <div className="recruiter-jobs-list" style={{ marginTop: '16px' }}>
              {jobs.map((job) => (
                <div key={job.id} className="recruiter-job-card">
                  <div className="r-job-header">
                    <div>
                      <h4 className="job-title">{job.title}</h4>
                      <span className="deadline-text">
                        Min CGPA: <strong>{job.min_cgpa}</strong> • Deadline: {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="btn-view-applicants"
                      onClick={() => fetchApplicants(job.id)}
                    >
                      👥 View Applicants ({job.applicant_count})
                    </button>
                  </div>

                  <p className="job-desc" style={{ marginTop: '8px' }}>
                    {job.description}
                  </p>

                  {/* Applicants Drawer */}
                  {selectedJobId === job.id && (
                    <div className="applicants-drawer">
                      <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>
                        Applicants for "{job.title}"
                      </h4>

                      {statusMessage && (
                        <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '13px' }}>
                          {statusMessage}
                        </div>
                      )}

                      {loadingApplicants ? (
                        <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading applicants...</p>
                      ) : applicants.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                          No candidates have applied for this position yet.
                        </p>
                      ) : (
                        <div className="applicant-list">
                          {applicants.map((cand) => (
                            <div key={cand.application_id} className="applicant-item">
                              <div className="cand-info">
                                <strong>{cand.student_name}</strong> ({cand.student_email})
                                <div className="cand-meta">
                                  Branch: {cand.student_branch} • CGPA: <span className="highlight-cgpa">{cand.student_cgpa}</span>
                                </div>
                                {cand.resume_url ? (
                                  <a
                                    href={cand.resume_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="auth-link"
                                    style={{ fontSize: '12px', display: 'inline-block', marginTop: '4px' }}
                                  >
                                    📄 View Candidate Resume (PDF)
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '12px', color: '#64748b' }}>No resume uploaded</span>
                                )}
                              </div>

                              <div className="cand-actions">
                                <span className={`status-badge status-${cand.status.toLowerCase()}`} style={{ fontSize: '11px', padding: '4px 8px' }}>
                                  {cand.status}
                                </span>

                                <select
                                  className="status-select"
                                  value={cand.status}
                                  onChange={(e) => handleUpdateStatus(cand.application_id, e.target.value)}
                                >
                                  <option value="Applied">Applied</option>
                                  <option value="Shortlisted">Shortlisted</option>
                                  <option value="Accepted">Accepted</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;
