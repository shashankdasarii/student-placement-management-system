const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

// GET /api/students/profile
router.get('/profile', verifyToken, authorize('student'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.user_id, s.name, s.email, s.branch, s.cgpa, s.resume_url, u.username
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Database error fetching profile' });
  }
});

// Configure disk storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/resumes'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-user${req.user.id}-${uniqueSuffix}.pdf`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// POST /api/students/upload-resume
router.post('/upload-resume', verifyToken, authorize('student'), upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No PDF file uploaded.' });
  }

  const port = process.env.PORT || 5001;
  const resumeUrl = `http://127.0.0.1:${port}/uploads/resumes/${req.file.filename}`;

  try {
    await db.query(
      'UPDATE students SET resume_url = ? WHERE user_id = ?',
      [resumeUrl, req.user.id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Resume uploaded successfully!',
      resume_url: resumeUrl
    });
  } catch (error) {
    console.error('Error updating resume URL:', error);
    res.status(500).json({ message: 'Database error saving resume.' });
  }
});

module.exports = router;
