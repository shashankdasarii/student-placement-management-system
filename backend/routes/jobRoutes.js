const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

// POST /api/jobs - Recruiter posts a new job
router.post('/', verifyToken, authorize('recruiter'), async (req, res) => {
  const { title, description, min_cgpa, deadline } = req.body;

  if (!title || !description || !deadline) {
    return res.status(400).json({ status: 'error', message: 'Title, description, and deadline are required.' });
  }

  try {
    // 1. Resolve the recruiter ID from user ID
    let recruiterId = req.user.recruiter_id || req.user.id;

    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiters WHERE user_id = ? OR id = ? LIMIT 1',
      [req.user.id, req.user.id]
    );

    if (recruiterRows.length > 0) {
      recruiterId = recruiterRows[0].id;
    } else {
      // Auto-create recruiter record if missing
      const [insertRec] = await db.query(
        'INSERT INTO recruiters (user_id, company_name, email) VALUES (?, ?, ?)',
        [req.user.id, req.user.company_name || 'Organization', req.user.email || '']
      );
      recruiterId = insertRec.insertId;
    }

    // 2. Insert into jobs table
    const [result] = await db.query(
      'INSERT INTO jobs (recruiter_id, title, description, min_cgpa, deadline) VALUES (?, ?, ?, ?, ?)',
      [recruiterId, title, description, parseFloat(min_cgpa) || 0, deadline]
    );

    res.status(201).json({
      status: 'success',
      message: 'Job posted successfully!',
      jobId: result.insertId
    });
  } catch (error) {
    console.error('Database error creating job:', error);
    res.status(500).json({
      status: 'error',
      message: `Database error creating job drive: ${error.sqlMessage || error.message}`
    });
  }
});

// GET /api/jobs/recruiter - Get jobs for logged-in recruiter
router.get('/recruiter', verifyToken, authorize('recruiter'), async (req, res) => {
  try {
    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiters WHERE user_id = ? OR id = ? LIMIT 1',
      [req.user.id, req.user.id]
    );

    const recruiterId = recruiterRows.length > 0 ? recruiterRows[0].id : req.user.id;

    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE recruiter_id = ? ORDER BY created_at DESC',
      [recruiterId]
    );

    res.status(200).json({
      status: 'success',
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching recruiter jobs:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching jobs.' });
  }
});

module.exports = router;