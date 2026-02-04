// Test email functionality
require('dotenv').config();
const { sendEmail } = require('./utils/emailService');

async function testEmail() {
  try {
    console.log('Testing email functionality...');
    
    // Check if email config exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email configuration not found in .env file');
      console.log('Please set EMAIL_USER and EMAIL_PASS variables');
      return;
    }

    // Test email (replace with your test email)
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    
    if (testEmail === 'test@example.com') {
      console.log('⚠️  Please set TEST_EMAIL in your .env file to test');
      console.log('Example: TEST_EMAIL=your_email@gmail.com');
      return;
    }

    const result = await sendEmail(
      testEmail,
      'emergency_notification',
      {
        emergencyType: 'Medical',
        description: 'Test emergency notification',
        address: 'Test Location, City',
        latitude: 12.9716,
        longitude: 77.5946,
        requesterName: 'Test User',
        volunteerName: 'Test Volunteer',
        distance: 2.5
      }
    );

    if (result.success) {
      console.log('✅ Email test successful!');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('❌ Email test failed:', result.error);
    }

  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

// Run the test
testEmail();