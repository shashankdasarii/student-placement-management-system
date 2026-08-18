const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, role, name, email, branch, cgpa, resume_url, company_name } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password, and role are required.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );

    const userId = userResult.insertId;

    if (role === 'student') {
      await db.query(
        'INSERT INTO students (user_id, name, email, branch, cgpa, resume_url) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, name || username, email || '', branch || 'General', cgpa || 0, resume_url || '']
      );
    } else if (role === 'recruiter') {
      await db.query(
        'INSERT INTO recruiters (user_id, company_name, email) VALUES (?, ?, ?)',
        [userId, company_name || 'Organization', email || '']
      );
    }

    res.status(201).json({ status: 'success', message: 'User registered successfully! Please sign in.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Database error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    let extraData = {};
    if (user.role === 'student') {
      const [studentRows] = await db.query('SELECT * FROM students WHERE user_id = ?', [user.id]);
      if (studentRows.length > 0) {
        extraData = studentRows[0];
      }
    } else if (user.role === 'recruiter') {
      const [recruiterRows] = await db.query('SELECT * FROM recruiters WHERE user_id = ?', [user.id]);
      if (recruiterRows.length > 0) {
        extraData = recruiterRows[0];
      }
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      ...extraData
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        ...extraData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Database error during login.' });
  }
});

module.exports = router;
