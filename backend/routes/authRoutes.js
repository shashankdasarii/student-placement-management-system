const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student or recruiter user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  const { username, password, role, name, email, branch, cgpa, resume_url, company_name } = req.body;

  // 1. Basic Validation
  if (!username || !password || !role) {
    return res.status(400).json({
      status: 'error',
      message: 'Username, password, and role are required.'
    });
  }

  if (!['student', 'recruiter'].includes(role)) {
    return res.status(400).json({
      status: 'error',
      message: 'Role must be either "student" or "recruiter".'
    });
  }

  if (role === 'student' && (!name || !email || !branch)) {
    return res.status(400).json({
      status: 'error',
      message: 'Student name, email, and branch are required.'
    });
  }

  if (role === 'recruiter' && !company_name) {
    return res.status(400).json({
      status: 'error',
      message: 'Company name is required for recruiter registration.'
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 2. Check if username already exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Username is already taken.'
      });
    }

    // If student, check if email exists
    if (role === 'student') {
      const [existingEmails] = await connection.query(
        'SELECT id FROM students WHERE email = ?',
        [email]
      );
      if (existingEmails.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Email address is already registered.'
        });
      }
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(password);

    // 4. Insert into users table
    const [userResult] = await connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );

    const userId = userResult.insertId;

    // 5. Insert into corresponding profile table
    if (role === 'student') {
      await connection.query(
        'INSERT INTO students (user_id, name, email, cgpa, branch, resume_url) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, name, email, cgpa || 0.00, branch, resume_url || null]
      );
    } else if (role === 'recruiter') {
      await connection.query(
        'INSERT INTO recruiters (user_id, company_name) VALUES (?, ?)',
        [userId, company_name]
      );
    }

    // 6. Commit transaction
    await connection.commit();

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      userId,
      role
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Registration Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error during registration.',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get JWT token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide both username and password.'
    });
  }

  try {
    // 1. Fetch user from database
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.'
      });
    }

    const user = users[0];

    // 2. Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.'
      });
    }

    // 3. Fetch linked profile data
    let profile = null;
    if (user.role === 'student') {
      const [students] = await pool.query(
        'SELECT * FROM students WHERE user_id = ?',
        [user.id]
      );
      if (students.length > 0) profile = students[0];
    } else if (user.role === 'recruiter') {
      const [recruiters] = await pool.query(
        'SELECT * FROM recruiters WHERE user_id = ?',
        [user.id]
      );
      if (recruiters.length > 0) profile = recruiters[0];
    }

    // 4. Generate JWT Token
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super_secret_jwt_key_123',
      { expiresIn: '24h' }
    );

    return res.json({
      status: 'success',
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        profile
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error during login.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private (Protected by verifyToken)
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found.'
      });
    }

    const user = users[0];

    // Fetch linked profile
    let profile = null;
    if (user.role === 'student') {
      const [students] = await pool.query(
        'SELECT * FROM students WHERE user_id = ?',
        [user.id]
      );
      if (students.length > 0) profile = students[0];
    } else if (user.role === 'recruiter') {
      const [recruiters] = await pool.query(
        'SELECT * FROM recruiters WHERE user_id = ?',
        [user.id]
      );
      if (recruiters.length > 0) profile = recruiters[0];
    }

    return res.json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at,
        profile
      }
    });
  } catch (error) {
    console.error('Fetch Me Profile Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error fetching user profile.'
    });
  }
});

module.exports = router;
