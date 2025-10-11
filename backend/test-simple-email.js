// Test simple email service
const { sendVerificationEmail } = require('./src/utils/simpleEmailService');

const testEmail = async () => {
  try {
    console.log('🧪 Testing simple email service...');
    
    const result = await sendVerificationEmail(
      'dspcoder123@gmail.com', 
      'Test User', 
      'test-token-123'
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Check your inbox: dspcoder123@gmail.com');
    } else {
      console.log('❌ Email failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testEmail();
