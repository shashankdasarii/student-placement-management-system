const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/applications/apply
 * @desc    Submit a job application (Student only)
 * @access  Private
 */
router.post('/apply', verifyToken, authorize('student'), async (req, res) => {
  const { job_id } = req.body;

  if (!job_id) {
    return res.status(400).json({
      status: 'error',
      message: 'Job ID is required.'
    });
  }

  try {
    // 1. Get logged-in student profile
    const [students] = await pool.query(
      'SELECT id, name, cgpa FROM students WHERE user_id = ?',
      [req.user.id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found.'
      });
    }

    const student = students[0];

    // 2. Fetch target job
    const [jobs] = await pool.query(
      'SELECT id, title, min_cgpa, deadline FROM jobs WHERE id = ?',
      [job_id]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Job posting not found.'
      });
    }

    const job = jobs[0];

    // 3. Verify CGPA Eligibility
    if (parseFloat(student.cgpa) < parseFloat(job.min_cgpa)) {
      return res.status(400).json({
        status: 'error',
        message: `Ineligible: Your CGPA (${student.cgpa}) is lower than the minimum required (${job.min_cgpa}).`
      });
    }

    // 4. Verify Deadline
    if (new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Application failed: The deadline for this job posting has passed.'
      });
    }

    // 5. Check if already applied
    const [existingApps] = await pool.query(
      'SELECT id FROM applications WHERE student_id = ? AND job_id = ?',
      [student.id, job.id]
    );

    if (existingApps.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already applied for this job.'
      });
    }

    // 6. Insert application into MySQL database
    const [result] = await pool.query(
      'INSERT INTO applications (student_id, job_id, status) VALUES (?, ?, ?)',
      [student.id, job.id, 'Applied']
    );

    return res.status(201).json({
      status: 'success',
      message: 'Application submitted successfully!',
      applicationId: result.insertId
    });
  } catch (error) {
    console.error('Submit Application Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error while submitting application.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/applications/my-applications
 * @desc    Get all applications submitted by the logged-in student
 * @access  Private (Student only)
 */
router.get('/my-applications', verifyToken, authorize('student'), async (req, res) => {
  try {
    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [req.user.id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found.'
      });
    }

    const student = students[0];

    const [applications] = await pool.query(`
      SELECT 
        a.id AS application_id, 
        a.status, 
        a.applied_at, 
        j.id AS job_id, 
        j.title, 
        j.description, 
        j.min_cgpa, 
        j.deadline, 
        r.company_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN recruiters r ON j.company_id = r.id
      WHERE a.student_id = ?
      ORDER BY a.applied_at DESC
    `, [student.id]);

    return res.json({
      status: 'success',
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Fetch My Applications Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error fetching your applications.'
    });
  }
});

/**
 * @route   GET /api/applications/job/:jobId
 * @desc    Get all candidate applications submitted for a specific job posting
 * @access  Private (Recruiter & Admin only)
 */
router.get('/job/:jobId', verifyToken, authorize('recruiter', 'admin'), async (req, res) => {
  const { jobId } = req.params;

  try {
    const [applications] = await pool.query(`
      SELECT 
        a.id AS application_id, 
        a.status, 
        a.applied_at, 
        s.id AS student_id, 
        s.name AS student_name, 
        s.email AS student_email, 
        s.cgpa AS student_cgpa, 
        s.branch AS student_branch, 
        s.resume_url
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN jobs j ON a.job_id = j.id
      WHERE a.job_id = ?
      ORDER BY a.applied_at DESC
    `, [jobId]);

    return res.json({
      status: 'success',
      jobId: parseInt(jobId),
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Fetch Job Applicants Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error fetching applicants for this job.'
    });
  }
});

/**
 * @route   PUT /api/applications/:applicationId/status
 * @desc    Update status of a candidate application (Shortlisted, Accepted, Rejected)
 * @access  Private (Recruiter & Admin only)
 */
router.put('/:applicationId/status', verifyToken, authorize('recruiter', 'admin'), async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  const validStatuses = ['Applied', 'Shortlisted', 'Interviewing', 'Accepted', 'Rejected'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    const [result] = await pool.query(
      'UPDATE applications SET status = ? WHERE id = ?',
      [status, applicationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found.'
      });
    }

    return res.json({
      status: 'success',
      message: `Application status updated to "${status}" successfully.`,
      applicationId: parseInt(applicationId),
      status
    });
  } catch (error) {
    console.error('Update Application Status Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error updating application status.'
    });
  }
});

module.exports = router;
