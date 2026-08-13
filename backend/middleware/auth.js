const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT authentication token
 */
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_123');
    req.user = decoded; // { id, username, role, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token.'
    });
  }
};

/**
 * Middleware to restrict access by user role
 * @param  {...string} roles - Allowed roles ('student', 'recruiter', 'admin')
 */
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
