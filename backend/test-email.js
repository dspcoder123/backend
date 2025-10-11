// Test email sending
const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"Test App" <${process.env.SMTP_USER}>`,
      to: 'dspcoder123@gmail.com', // Change this to your email
      subject: 'Test Email',
      text: 'This is a test email from your backend!'
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
};

testEmail();
