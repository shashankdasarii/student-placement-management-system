const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

// GET /api/jobs/eligible - Student fetches jobs where their CGPA >= min_cgpa
router.get('/eligible', verifyToken, authorize('student'), async (req, res) => {
  try {
    // 1. Get student CGPA using user_id
    const [studentRows] = await db.query(
      'SELECT cgpa FROM students WHERE user_id = ?',
      [req.user.id]
    );

    const studentCgpa = studentRows.length > 0 ? parseFloat(studentRows[0].cgpa) : 0;

    // 2. Fetch jobs matching CGPA criteria and active deadline
    const [jobs] = await db.query(
      `SELECT j.id, j.title, j.description, j.min_cgpa, j.deadline, r.company_name
       FROM jobs j
       JOIN recruiters r ON j.recruiter_id = r.user_id
       WHERE j.min_cgpa <= ?
       ORDER BY j.created_at DESC`,
      [studentCgpa]
    );

    res.status(200).json({ status: 'success', data: jobs });
  } catch (error) {
    console.error('Fetch eligible jobs error:', error);
    res.status(500).json({ message: 'Database error fetching eligible jobs.' });
  }
});

// GET /api/jobs/recruiter - Recruiter fetches their posted jobs
router.get('/recruiter', verifyToken, authorize('recruiter'), async (req, res) => {
  try {
    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE recruiter_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.status(200).json({ status: 'success', data: jobs });
  } catch (error) {
    console.error('Fetch recruiter jobs error:', error);
    res.status(500).json({ message: 'Database error fetching recruiter jobs.' });
  }
});

// POST /api/jobs - Recruiter creates a new job drive
router.post('/', verifyToken, authorize('recruiter'), async (req, res) => {
  const { title, description, min_cgpa, deadline } = req.body;
  const recruiter_id = req.user.id;

  if (!title || !description || min_cgpa === undefined || !deadline) {
    return res.status(400).json({ message: 'All job fields are required.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO jobs (recruiter_id, title, description, min_cgpa, deadline) VALUES (?, ?, ?, ?, ?)',
      [recruiter_id, title, description, parseFloat(min_cgpa), deadline]
    );

    res.status(201).json({
      status: 'success',
      message: 'Job posting created successfully!',
      job_id: result.insertId
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Database error creating job drive.' });
  }
});

module.exports = router;
