const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/jobs
 * @desc    Create a new job posting (Recruiter or Admin only)
 * @access  Private
 */
router.post('/', verifyToken, authorize('recruiter', 'admin'), async (req, res) => {
  const { title, description, min_cgpa, deadline } = req.body;

  if (!title || !description || min_cgpa === undefined || !deadline) {
    return res.status(400).json({
      status: 'error',
      message: 'Title, description, min_cgpa, and deadline are required.'
    });
  }

  try {
    // Fetch recruiter company_id linked to req.user.id
    const [recruiters] = await pool.query(
      'SELECT id FROM recruiters WHERE user_id = ?',
      [req.user.id]
    );

    if (recruiters.length === 0 && req.user.role !== 'admin') {
      return res.status(404).json({
        status: 'error',
        message: 'Recruiter profile not found.'
      });
    }

    const companyId = recruiters.length > 0 ? recruiters[0].id : 1;

    // Format deadline if passed as ISO string or YYYY-MM-DD
    const formattedDeadline = new Date(deadline).toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await pool.query(
      'INSERT INTO jobs (company_id, title, description, min_cgpa, deadline) VALUES (?, ?, ?, ?, ?)',
      [companyId, title, description, parseFloat(min_cgpa) || 0.00, formattedDeadline]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Job posted successfully.',
      jobId: result.insertId
    });
  } catch (error) {
    console.error('Create Job Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error while creating job posting.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/jobs
 * @desc    Get all job postings with recruiter company name
 * @access  Private
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const [jobs] = await pool.query(`
      SELECT j.id, j.company_id, j.title, j.description, j.min_cgpa, j.deadline, j.created_at, r.company_name
      FROM jobs j
      JOIN recruiters r ON j.company_id = r.id
      ORDER BY j.created_at DESC
    `);

    return res.json({
      status: 'success',
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Fetch Jobs Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error fetching job postings.'
    });
  }
});

/**
 * @route   GET /api/jobs/eligible
 * @desc    Get jobs where logged-in student meets CGPA requirement & deadline has not passed
 * @access  Private (Student only)
 */
router.get('/eligible', verifyToken, authorize('student'), async (req, res) => {
  try {
    // 1. Fetch student's profile to get CGPA and student.id
    const [students] = await pool.query(
      'SELECT id, cgpa, branch FROM students WHERE user_id = ?',
      [req.user.id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found.'
      });
    }

    const student = students[0];
    const studentCgpa = parseFloat(student.cgpa);

    // 2. Query jobs where min_cgpa <= studentCgpa and deadline >= NOW()
    // Also include a subquery `has_applied` checking if student applied
    const [jobs] = await pool.query(`
      SELECT 
        j.id, 
        j.company_id, 
        j.title, 
        j.description, 
        j.min_cgpa, 
        j.deadline, 
        j.created_at, 
        r.company_name,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.student_id = ?) > 0 AS has_applied
      FROM jobs j
      JOIN recruiters r ON j.company_id = r.id
      WHERE j.min_cgpa <= ? AND j.deadline >= NOW()
      ORDER BY j.created_at DESC
    `, [student.id, studentCgpa]);

    return res.json({
      status: 'success',
      studentCgpa,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Fetch Eligible Jobs Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error fetching eligible jobs.'
    });
  }
});

/**
 * @route   GET /api/jobs/my-jobs
 * @desc    Get jobs posted by the logged-in recruiter
 * @access  Private (Recruiter only)
 */
router.get('/my-jobs', verifyToken, authorize('recruiter'), async (req, res) => {
  try {
    const [recruiters] = await pool.query(
      'SELECT id, company_name FROM recruiters WHERE user_id = ?',
      [req.user.id]
    );

    if (recruiters.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Recruiter profile not found.'
      });
    }

    const recruiter = recruiters[0];

    const [jobs] = await pool.query(`
      SELECT 
        j.id, 
        j.title, 
        j.description, 
        j.min_cgpa, 
        j.deadline, 
        j.created_at, 
        r.company_name,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count
      FROM jobs j
      JOIN recruiters r ON j.company_id = r.id
      WHERE j.company_id = ?
      ORDER BY j.created_at DESC
    `, [recruiter.id]);

    return res.json({
      status: 'success',
      company_name: recruiter.company_name,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Fetch Recruiter Jobs Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error fetching posted jobs.'
    });
  }
});

module.exports = router;
