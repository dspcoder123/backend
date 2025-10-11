// Comprehensive validation middleware
const User = require('../models/User');

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Mobile validation (10 digits, Indian format)
const validateMobile = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

// Password strength validation
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Name validation
const validateName = (name) => {
  const errors = [];
  
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (name && name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }
  
  if (name && !/^[a-zA-Z\s]+$/.test(name)) {
    errors.push('Name can only contain letters and spaces');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Check for duplicate email
const checkDuplicateEmail = async (email, excludeUserId = null) => {
  try {
    const query = { email: email.toLowerCase() };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }
    
    const existingUser = await User.findOne(query);
    return {
      exists: !!existingUser,
      user: existingUser
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
};

// Check for duplicate mobile
const checkDuplicateMobile = async (mobile, excludeUserId = null) => {
  try {
    const query = { mobile: mobile };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }
    
    const existingUser = await User.findOne(query);
    return {
      exists: !!existingUser,
      user: existingUser
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
};

// Comprehensive registration validation
const validateRegistration = async (req, res, next) => {
  try {
    const { name, email, mobile, password } = req.body;
    const errors = [];
    
    // Check required fields
    if (!name) errors.push('Name is required');
    if (!email) errors.push('Email is required');
    if (!mobile) errors.push('Mobile number is required');
    if (!password) errors.push('Password is required');
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      errors.push(...nameValidation.errors);
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      errors.push('Please enter a valid email address');
    }
    
    // Validate mobile format
    if (!validateMobile(mobile)) {
      errors.push('Please enter a valid 10-digit mobile number starting with 6-9');
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
    
    // Check for duplicates
    const emailCheck = await checkDuplicateEmail(email);
    if (emailCheck.exists) {
      errors.push('Email address is already registered');
    }
    
    const mobileCheck = await checkDuplicateMobile(mobile);
    if (mobileCheck.exists) {
      errors.push('Mobile number is already registered');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    // All validations passed
    next();
    
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
  }
};

// Login validation
const validateLogin = (req, res, next) => {
  try {
    const { email, password } = req.body;
    const errors = [];
    
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    
    if (email && !validateEmail(email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Login validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
  }
};

module.exports = {
  validateEmail,
  validateMobile,
  validatePassword,
  validateName,
  checkDuplicateEmail,
  checkDuplicateMobile,
  validateRegistration,
  validateLogin
};
