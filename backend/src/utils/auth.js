const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
  } catch (error) {
    return null;
  }
};

// Generate random token for verification/reset
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }

  req.userId = decoded.userId;
  next();
};

// Generate verification token with expiration
const generateVerificationTokenWithExpiry = () => {
  const token = generateRandomToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hours from now
  
  return { token, expires };
};

// Generate password reset token with expiration
const generatePasswordResetTokenWithExpiry = () => {
  const token = generateRandomToken();
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 60); // 1 hour from now
  
  return { token, expires };
};

module.exports = {
  generateToken,
  verifyToken,
  generateRandomToken,
  authenticateToken,
  generateVerificationTokenWithExpiry,
  generatePasswordResetTokenWithExpiry
};
