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
    const userId = req.user.id;
    let recruiterId = userId;

    // Try finding recruiter profile id if table exists
    try {
      const [recruiterRows] = await db.query('SELECT id FROM recruiters WHERE user_id = ? LIMIT 1', [userId]);
      if (recruiterRows.length > 0) {
        recruiterId = recruiterRows[0].id;
      }
    } catch (e) {
      // Ignore if recruiters table is optional
    }

    // Inspect columns of jobs table to match exact column name
    const [cols] = await db.query('SHOW COLUMNS FROM jobs');
    const colNames = cols.map(c => c.Field);

    let insertQuery = '';
    let insertValues = [];

    if (colNames.includes('posted_by')) {
      insertQuery = 'INSERT INTO jobs (title, description, min_cgpa, deadline, posted_by) VALUES (?, ?, ?, ?, ?)';
      insertValues = [title.trim(), description.trim(), parseFloat(min_cgpa) || 0, deadline, userId];
    } else if (colNames.includes('user_id')) {
      insertQuery = 'INSERT INTO jobs (title, description, min_cgpa, deadline, user_id) VALUES (?, ?, ?, ?, ?)';
      insertValues = [title.trim(), description.trim(), parseFloat(min_cgpa) || 0, deadline, userId];
    } else if (colNames.includes('recruiter_id')) {
      insertQuery = 'INSERT INTO jobs (title, description, min_cgpa, deadline, recruiter_id) VALUES (?, ?, ?, ?, ?)';
      insertValues = [title.trim(), description.trim(), parseFloat(min_cgpa) || 0, deadline, recruiterId];
    } else {
      insertQuery = 'INSERT INTO jobs (title, description, min_cgpa, deadline) VALUES (?, ?, ?, ?)';
      insertValues = [title.trim(), description.trim(), parseFloat(min_cgpa) || 0, deadline];
    }

    const [result] = await db.query(insertQuery, insertValues);

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
    const userId = req.user.id;

    // Inspect columns of jobs table
    const [cols] = await db.query('SHOW COLUMNS FROM jobs');
    const colNames = cols.map(c => c.Field);

    let selectQuery = 'SELECT * FROM jobs ORDER BY id DESC';
    let params = [];

    if (colNames.includes('posted_by')) {
      selectQuery = 'SELECT * FROM jobs WHERE posted_by = ? ORDER BY id DESC';
      params = [userId];
    } else if (colNames.includes('user_id')) {
      selectQuery = 'SELECT * FROM jobs WHERE user_id = ? ORDER BY id DESC';
      params = [userId];
    } else if (colNames.includes('recruiter_id')) {
      let recruiterId = userId;
      try {
        const [recRows] = await db.query('SELECT id FROM recruiters WHERE user_id = ? LIMIT 1', [userId]);
        if (recRows.length > 0) recruiterId = recRows[0].id;
      } catch (e) {}
      selectQuery = 'SELECT * FROM jobs WHERE recruiter_id = ? ORDER BY id DESC';
      params = [recruiterId];
    }

    const [jobs] = await db.query(selectQuery, params);

    res.status(200).json({
      status: 'success',
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching recruiter jobs:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching jobs.' });
  }
});

// GET /api/jobs - Public/Student listing of all jobs
router.get('/', async (req, res) => {
  try {
    const [jobs] = await db.query('SELECT * FROM jobs ORDER BY id DESC');
    res.status(200).json({ status: 'success', data: jobs });
  } catch (error) {
    console.error('Error fetching all jobs:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching jobs.' });
  }
});

module.exports = router;