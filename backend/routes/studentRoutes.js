const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

// Ensure destination upload folder exists
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `resume-user${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// File Filter for PDF files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files (.pdf) are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max limit
});

/**
 * @route   POST /api/students/upload-resume
 * @desc    Upload PDF resume for logged in student
 * @access  Private (Student only)
 */
router.post('/upload-resume', verifyToken, authorize('student'), (req, res) => {
  upload.single('resume')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ status: 'error', message: `File upload error: ${err.message}` });
      }
      return res.status(400).json({ status: 'error', message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Please select a PDF resume file to upload.' });
    }

    try {
      const resumeUrl = `http://localhost:5000/uploads/resumes/${req.file.filename}`;

      // Update student profile in MySQL
      const [result] = await pool.query(
        'UPDATE students SET resume_url = ? WHERE user_id = ?',
        [resumeUrl, req.user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
      }

      return res.json({
        status: 'success',
        message: 'Resume uploaded successfully!',
        resume_url: resumeUrl
      });
    } catch (error) {
      console.error('Resume Upload DB Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Server error updating database with resume URL.'
      });
    }
  });
});

module.exports = router;
