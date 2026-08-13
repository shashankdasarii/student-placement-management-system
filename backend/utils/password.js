const bcrypt = require('bcryptjs');

/**
 * Hash a plain text password using bcryptjs
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password input
 * @param {string} hash - Hashed password stored in database
 * @returns {Promise<boolean>} True if match, false otherwise
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword
};
