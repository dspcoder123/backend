const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '407408718192.apps.googleusercontent.com');

// Verify Google ID token
const verifyGoogleToken = async (idToken) => {
  try {
    console.log('🔍 Verifying Google ID token...');
    console.log('📋 Using Client ID:', process.env.GOOGLE_CLIENT_ID || '407408718192.apps.googleusercontent.com');
    
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID || '407408718192.apps.googleusercontent.com'
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid token payload');
    }
    
    // Extract user information
    const googleUser = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      profilePicture: payload.picture,
      emailVerified: payload.email_verified
    };
    
    console.log('✅ Google token verified for:', googleUser.email);
    
    return {
      success: true,
      user: googleUser
    };
    
  } catch (error) {
    console.error('❌ Google token verification failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate JWT token for Google users
const generateGoogleUserToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, provider: 'google' }, 
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  verifyGoogleToken,
  generateGoogleUserToken
};
