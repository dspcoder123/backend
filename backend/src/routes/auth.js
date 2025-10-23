const express = require('express');
const User = require('../models/User');
const { generateToken, authenticateToken, generateVerificationTokenWithExpiry, generatePasswordResetTokenWithExpiry } = require('../utils/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/simpleEmailService');
const { verifyGoogleToken, generateGoogleUserToken } = require('../utils/googleAuth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();


// Helper regex patterns for validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^\+?[1-9]\d{9,14}$/; // International E.164 format, min 10 digits max 15 digits
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
// at least 8 chars, 1 lowercase, 1 uppercase, 1 digit, 1 special char

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        toastMessage: 'Please fill all the required fields'
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        toastMessage: 'Please enter a valid email address'
      });
    }

    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format',
        toastMessage: 'Please enter a valid mobile number'
      });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
        toastMessage: 'Password is too weak'
      });
    }

    // Check if user already exists by email or mobile (case insensitive email)
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { mobile }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email.toLowerCase() === email.toLowerCase() ? 'Email already registered' : 'Mobile number already registered',
        toastMessage: existingUser.email.toLowerCase() === email.toLowerCase() ? 'Email is already registered' : 'Mobile number is already registered'
      });
    }

    // Generate verification token
    const { token, expires } = generateVerificationTokenWithExpiry();

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      mobile,
      password,
      verificationToken: token,
      verificationExpires: expires
    });

    await user.save();

    // Respond immediately so the client isn't blocked by email delivery
    res.status(201).json({
      success: true,
      message: 'User registered successfully. A verification email will be sent shortly.',
      toastMessage: 'Registration successful! Check your email to verify.',
      userId: user._id
    });

    // Send verification email asynchronously (fire-and-forget). Log failures separately.
    (async () => {
      try {
        const emailResult = await sendVerificationEmail(email, name, token);
        if (!emailResult.success) {
          console.error('Failed to send verification email (async):', { userId: user._id, email, error: emailResult.error });
        } else {
          console.log('Verification email sent (async) for user:', user._id);
        }
      } catch (err) {
        console.error('Error sending verification email (async):', { userId: user._id, email, err: err && err.message ? err.message : err });
      }
    })();

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      toastMessage: 'Something went wrong. Please try again later.'
    });
  }
});


// Verify email endpoint
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
        toastMessage: 'Verification token missing'
      });
    }

    // Find user with this token
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
        toastMessage: 'Invalid or expired token'
      });
    }

    // Update user as verified
    user.verified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
      toastMessage: 'Email verified successfully!'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification',
      toastMessage: 'Internal error occurred'
    });
  }
});


// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        toastMessage: 'Please enter email and password'
      });
    }

    // Find user by email (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        toastMessage: 'Invalid credentials'
      });
    }

    // Check if user is verified
    if (!user.verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in',
        needsVerification: true,
        toastMessage: 'Please verify your email'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        toastMessage: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      toastMessage: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        verified: user.verified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      toastMessage: 'Internal server error'
    });
  }
});


// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        toastMessage: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        toastMessage: 'User not found'
      });
    }

    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
        toastMessage: 'Email already verified'
      });
    }

    // Generate new verification token
    const { token, expires } = generateVerificationTokenWithExpiry();

    user.verificationToken = token;
    user.verificationExpires = expires;
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, user.name, token);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
        toastMessage: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      toastMessage: 'Verification email sent'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      toastMessage: 'Internal error occurred'
    });
  }
});


// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        toastMessage: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        toastMessage: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate password reset token
    const { token, expires } = generatePasswordResetTokenWithExpiry();

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(email, user.name, token);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
      toastMessage: 'If the email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      toastMessage: 'Internal error occurred'
    });
  }
});


// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required',
        toastMessage: 'Token and password are required'
      });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
        toastMessage: 'Password is too weak'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        toastMessage: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
      toastMessage: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      toastMessage: 'Internal error occurred'
    });
  }
});


// Get current user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        toastMessage: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        verified: user.verified,
        createdAt: user.createdAt
      },
      toastMessage: 'Profile loaded successfully'
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      toastMessage: 'Internal error occurred'
    });
  }
});

// Google OAuth registration/login endpoint
router.post('/google-auth', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    // Decode the JWT without verification (DEV mode approach)
    console.log('🔐 Processing Google OAuth request (DEV mode - no verification)...');

    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');

      const payload = JSON.parse(jsonPayload);
      console.log('📋 Decoded payload:', { email: payload.email, name: payload.name });

      const { sub: googleId, email, name, picture: profilePicture, email_verified: emailVerified } = payload;

      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId });

      if (user) {
        // User exists, generate token and login
        const token = generateGoogleUserToken(user._id);

        return res.json({
          success: true,
          message: 'Google login successful',
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            verified: true,
            authProvider: 'google',
            profilePicture: user.profilePicture
          }
        });
      }

      // Check if user exists with same email but different auth provider
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        if (existingUser.authProvider === 'local') {
          return res.status(409).json({
            success: false,
            message: 'An account with this email already exists. Please login with your password or use forgot password.',
            conflict: 'email_exists_local'
          });
        }
      }

      // Create new Google user
      user = new User({
        name,
        email,
        googleId,
        googleEmail: email,
        profilePicture,
        authProvider: 'google',
        verified: emailVerified || true // Google emails are pre-verified
      });

      await user.save();

      // Generate token
      const token = generateGoogleUserToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Google registration successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          verified: true,
          authProvider: 'google',
          profilePicture: user.profilePicture
        }
      });

    } catch (decodeError) {
      console.error('❌ Token decode error:', decodeError);
      return res.status(400).json({
        success: false,
        message: 'Invalid token format',
        error: decodeError.message
      });
    }

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during Google authentication'
    });
  }
});

// Google Login endpoint (for existing users)
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    console.log('🔐 Processing Google Login request...');

    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');

      const payload = JSON.parse(jsonPayload);
      console.log('📋 Decoded payload for login:', { email: payload.email, name: payload.name });

      const { sub: googleId, email, name, picture: profilePicture } = payload;

      // Check if user exists with this Google ID
      let user = await User.findOne({ googleId });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please register first.',
          action: 'register_required'
        });
      }

      // User exists, generate token and login
      const token = generateGoogleUserToken(user._id);

      return res.json({
        success: true,
        message: 'Google login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          verified: true,
          authProvider: 'google',
          profilePicture: user.profilePicture || profilePicture
        }
      });

    } catch (decodeError) {
      console.error('❌ Token decode error:', decodeError);
      return res.status(400).json({
        success: false,
        message: 'Invalid token format',
        error: decodeError.message
      });
    }

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during Google login'
    });
  }
});

// Test Google token endpoint (for testing purposes)
router.post('/test-google-token', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    const result = await verifyGoogleToken(idToken);

    res.json({
      success: result.success,
      message: result.success ? 'Google token is valid' : 'Google token is invalid',
      data: result.success ? result.user : null,
      error: result.error || null
    });

  } catch (error) {
    console.error('Test Google token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Test endpoint that bypasses token expiry (for development only)
router.post('/test-google-token-dev', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    console.log('🧪 Testing Google token (DEV mode - no expiry check)...');

    // Decode the JWT without verification (for testing only)
    const base64Url = idToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');

    const payload = JSON.parse(jsonPayload);

    res.json({
      success: true,
      message: 'Google token decoded (DEV mode)',
      data: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        verified: payload.email_verified,
        exp: payload.exp,
        iat: payload.iat,
        currentTime: Math.floor(Date.now() / 1000),
        isExpired: payload.exp < Math.floor(Date.now() / 1000)
      }
    });
  } catch (error) {
    console.error('❌ Google token decode failed:', error.message);
    res.status(400).json({
      success: false,
      message: 'Failed to decode token',
      error: error.message
    });
  }
});

module.exports = router;
