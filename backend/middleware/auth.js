const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access forbidden. Insufficient permissions.'
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorize
};