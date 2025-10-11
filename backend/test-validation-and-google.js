// Test comprehensive validation and Google OAuth
const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/auth';

// Test cases for validation
const testCases = {
  // Valid registration
  validUser: {
    name: "John Doe",
    email: "john.doe@example.com",
    mobile: "9876543210",
    password: "SecurePass123!"
  },
  
  // Invalid test cases
  invalidEmail: {
    name: "Test User",
    email: "invalid-email",
    mobile: "9876543210",
    password: "SecurePass123!"
  },
  
  invalidMobile: {
    name: "Test User",
    email: "test@example.com",
    mobile: "123456789", // Invalid mobile
    password: "SecurePass123!"
  },
  
  weakPassword: {
    name: "Test User",
    email: "test2@example.com",
    mobile: "9876543211",
    password: "123" // Too weak
  },
  
  duplicateEmail: {
    name: "Test User",
    email: "john.doe@example.com", // Same as valid user
    mobile: "9876543212",
    password: "SecurePass123!"
  }
};

// Test Google OAuth
const testGoogleAuth = async (idToken) => {
  try {
    console.log('🧪 Testing Google OAuth...');
    
    const response = await axios.post(`${BASE_URL}/test-google-token`, {
      idToken: idToken
    });
    
    console.log('✅ Google token test result:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Google token test failed:', error.response?.data || error.message);
    return null;
  }
};

// Test registration validation
const testRegistration = async (testCase, description) => {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log('Data:', testCase);
    
    const response = await axios.post(`${BASE_URL}/register`, testCase);
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Expected validation error:', error.response?.data);
    return error.response?.data;
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting comprehensive validation tests...\n');
  
  // Test valid registration
  await testRegistration(testCases.validUser, 'Valid user registration');
  
  // Test invalid cases
  await testRegistration(testCases.invalidEmail, 'Invalid email format');
  await testRegistration(testCases.invalidMobile, 'Invalid mobile number');
  await testRegistration(testCases.weakPassword, 'Weak password');
  await testRegistration(testCases.duplicateEmail, 'Duplicate email');
  
  console.log('\n📋 Test Summary:');
  console.log('- Valid registration should succeed');
  console.log('- Invalid email should fail with validation error');
  console.log('- Invalid mobile should fail with validation error');
  console.log('- Weak password should fail with validation error');
  console.log('- Duplicate email should fail with conflict error');
  
  console.log('\n🔧 To test Google OAuth:');
  console.log('1. Get a Google ID token from your frontend');
  console.log('2. Test with: POST /api/auth/test-google-token');
  console.log('3. Register/login with: POST /api/auth/google-auth');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testRegistration,
  testGoogleAuth,
  runTests
};
