const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

// POST /api/applications/apply - Student applies for a job
router.post('/apply', verifyToken, authorize('student'), async (req, res) => {
  const { job_id } = req.body;
  const student_id = req.user.id;

  try {
    // Check if already applied
    const [existing] = await db.query(
      'SELECT id FROM applications WHERE student_id = ? AND job_id = ?',
      [student_id, job_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already applied for this job.' });
    }

    // Insert new application
    await db.query(
      'INSERT INTO applications (student_id, job_id, status) VALUES (?, ?, "Applied")',
      [student_id, job_id]
    );

    res.status(201).json({ status: 'success', message: 'Application submitted successfully!' });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ message: 'Database error while submitting application.' });
  }
});

// GET /api/applications/my - Student fetches their applications with real-time status
router.get('/my', verifyToken, authorize('student'), async (req, res) => {
  const student_id = req.user.id;
  try {
    const [applications] = await db.query(
      `SELECT a.id, a.status, a.applied_at, j.title, j.description, j.min_cgpa, j.deadline, r.company_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN recruiters r ON j.recruiter_id = r.user_id
       WHERE a.student_id = ?
       ORDER BY a.applied_at DESC`,
      [student_id]
    );
    res.status(200).json({ status: 'success', data: applications });
  } catch (error) {
    console.error('Fetch student applications error:', error);
    res.status(500).json({ message: 'Database error fetching applications.' });
  }
});

// GET /api/applications/job/:jobId - Recruiter views applicants for a job
router.get('/job/:jobId', verifyToken, authorize('recruiter'), async (req, res) => {
  const { jobId } = req.params;
  try {
    const [applicants] = await db.query(
      `SELECT a.id AS application_id, a.status, a.applied_at, s.name, s.email, s.branch, s.cgpa, s.resume_url
       FROM applications a
       JOIN students s ON a.student_id = s.user_id
       WHERE a.job_id = ?
       ORDER BY a.applied_at DESC`,
      [jobId]
    );
    res.status(200).json({ status: 'success', data: applicants });
  } catch (error) {
    console.error('Fetch job applicants error:', error);
    res.status(500).json({ message: 'Database error fetching applicants.' });
  }
});

// PUT /api/applications/:id/status - Recruiter updates application status
router.put('/:id/status', verifyToken, authorize('recruiter'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Applied', 'Shortlisted', 'Accepted', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE applications SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    res.status(200).json({ status: 'success', message: `Application status updated to ${status}!` });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Database error updating status.' });
  }
});

module.exports = router;
