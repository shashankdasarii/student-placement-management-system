import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import API_BASE_URL from '../config';

const RecruiterDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    min_cgpa: '7.50',
    deadline: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const cleanBaseUrl = (API_BASE_URL || '').replace(/\/+$/, '');

  // 1. Fetch posted jobs for this recruiter
  const fetchJobs = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${cleanBaseUrl}/api/jobs/recruiter`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      const jobList = Array.isArray(res.data?.data)
        ? res.data.data
        : (Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.jobs) ? res.data.jobs : []));

      setJobs(jobList);
    } catch (err) {
      console.error('Error fetching recruiter jobs:', err.response?.data || err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, cleanBaseUrl]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // 2. Post a new job
  const handlePostJob = async (e) => {
    e.preventDefault();

    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      alert('Your session expired. Please sign in again.');
      navigate('/login');
      return;
    }

    if (!formData.title || !formData.description || !formData.deadline) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        min_cgpa: parseFloat(formData.min_cgpa) || 0,
        deadline: formData.deadline
      };

      const res = await axios.post(`${cleanBaseUrl}/api/jobs`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`
        }
      });

      alert(res.data?.message || 'Job posted successfully!');
      setFormData({ title: '', description: '', min_cgpa: '7.50', deadline: '' });
      await fetchJobs();
    } catch (err) {
      console.error('Error posting job:', err.response?.data || err.message);
      const backendMessage = err.response?.data?.message || err.message;
      alert(`Error posting job: ${backendMessage}`);
    }
  };

  // 3. View applicants for a specific job
  const handleViewApplicants = async (job) => {
    const currentToken = localStorage.getItem('token');
    setSelectedJob(job);
    try {
      const res = await axios.get(`${cleanBaseUrl}/api/applications/job/${job.id}`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      const applicantList = Array.isArray(res.data?.data)
        ? res.data.data
        : (Array.isArray(res.data) ? res.data : []);

      setApplicants(applicantList);
    } catch (err) {
      console.error('Error fetching applicants:', err.response?.data || err.message);
      setApplicants([]);
    }
  };

  // 4. Update applicant status (Shortlisted, Accepted, Rejected)
  const handleUpdateStatus = async (applicationId, newStatus) => {
    const currentToken = localStorage.getItem('token');
    try {
      await axios.put(
        `${cleanBaseUrl}/api/applications/${applicationId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      if (selectedJob) {
        handleViewApplicants(selectedJob);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', color: '#fff' }}>Loading Dashboard...</div>;

  return (
    <div style={{ maxWidth: '960px', margin: '30px auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Recruiter Dashboard</h2>
          <p style={{ color: 'var(--ios-text-secondary)' }}>Posting for: {user?.company_name || user?.name || 'Organization'}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="badge badge-accent">RECRUITER</span>
          <button className="secondary" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      {/* Post New Job Card */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '8px' }}>Post New Job Opening</h3>
        <p style={{ color: 'var(--ios-text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
          Create job requirements for campus placement drive
        </p>

        <form onSubmit={handlePostJob}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label>Job Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Full Stack Developer"
              />
            </div>
            <div>
              <label>Minimum Required CGPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={formData.min_cgpa}
                onChange={(e) => setFormData({ ...formData, min_cgpa: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label>Job Description</label>
            <textarea
              rows="3"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe role responsibilities, tech stack, and location..."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Application Deadline</label>
            <input
              type="date"
              required
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <button type="submit" style={{ width: '100%' }}>Publish Job Opening</button>
        </form>
      </div>

      {/* Active Postings */}
      <h3 style={{ marginBottom: '16px' }}>Your Active Job Postings ({jobs.length})</h3>
      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--ios-text-secondary)' }}>
          No active job postings yet. Use the form above to publish your first job opening!
        </div>
      ) : (
        jobs.map((job) => (
          <div key={job.id} className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0' }}>{job.title}</h3>
                <p style={{ color: 'var(--ios-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                  {job.description}
                </p>
                <span style={{ fontSize: '13px', color: 'var(--ios-text-secondary)' }}>
                  Min CGPA: <strong>{job.min_cgpa}</strong> | Deadline: {new Date(job.deadline).toLocaleDateString()}
                </span>
              </div>
              <button className="secondary" onClick={() => handleViewApplicants(job)}>
                👥 View Applicants
              </button>
            </div>
          </div>
        ))
      )}

      {/* Applicants View Modal */}
      {selectedJob && (
        <div className="card" style={{ marginTop: '32px', borderColor: 'var(--ios-system-blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Applicants for: {selectedJob.title}</h3>
            <button className="secondary" onClick={() => setSelectedJob(null)}>Close</button>
          </div>

          {applicants.length === 0 ? (
            <p style={{ color: 'var(--ios-text-secondary)' }}>No candidates have applied to this posting yet.</p>
          ) : (
            applicants.map((app) => (
              <div
                key={app.application_id || app.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div>
                  <strong>{app.name || app.username}</strong> ({app.branch}) — CGPA: <span style={{ color: 'var(--ios-system-green)', fontWeight: 700 }}>{app.cgpa}</span>
                  <div style={{ fontSize: '13px', color: 'var(--ios-text-secondary)', marginTop: '4px' }}>
                    Status: <strong>{app.status}</strong>
                    {app.resume_url && (
                      <a
                        href={app.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ marginLeft: '12px', color: 'var(--ios-system-blue)', textDecoration: 'none', fontWeight: 600 }}
                      >
                        📄 View Resume (PDF)
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleUpdateStatus(app.application_id || app.id, 'Shortlisted')}
                    style={{ background: 'var(--ios-system-orange)', fontSize: '12px', padding: '6px 12px' }}
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(app.application_id || app.id, 'Accepted')}
                    style={{ background: 'var(--ios-system-green)', fontSize: '12px', padding: '6px 12px' }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(app.application_id || app.id, 'Rejected')}
                    style={{ background: 'var(--ios-system-red)', fontSize: '12px', padding: '6px 12px' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;