// Test email configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('🔍 Testing email configuration...\n');
  
  // Check required environment variables
  const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log('❌ Missing environment variables:', missing);
    console.log('Please add these to your .env file:');
    missing.forEach(key => console.log(`  ${key}=your_value`));
    return;
  }
  
  console.log('✅ All required environment variables present');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER.replace(/(.{2}).*(.{2})@.*/, '$1***$2@***')); // Mask email for privacy
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  // Verify connection
  try {
    await transporter.verify();
    console.log('✅ Email configuration is valid!');
    console.log('✓ SMTP connection successful');
    console.log('✓ Authentication successful');
    
    // Test sending (optional - uncomment to actually send test email)
    /*
    const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_USER;
    console.log(`\n📧 Sending test email to: ${testEmail}`);
    
    const info = await transporter.sendMail({
      from: `"MitraHelp Test" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'MitraHelp Email Configuration Test',
      text: 'This is a test email to verify your email configuration is working correctly.',
      html: '<p>This is a <strong>test email</strong> to verify your email configuration is working correctly.</p>'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    */
    
  } catch (error) {
    console.log('❌ Email configuration test failed:');
    console.log('Error:', error.message);
    
    // Provide specific troubleshooting guidance
    if (error.message.includes('queryA EBADNAME')) {
      console.log('\n🔧 Troubleshooting DNS Issue:');
      console.log('1. Check if EMAIL_HOST is correct (e.g., smtp.gmail.com)');
      console.log('2. Verify your internet connection');
      console.log('3. Try using IP address instead of hostname');
      console.log('4. Check if your ISP blocks SMTP ports');
    } else if (error.message.includes('Authentication')) {
      console.log('\n🔧 Troubleshooting Authentication Issue:');
      console.log('1. For Gmail, use App Passwords, not regular password');
      console.log('2. Enable 2-Factor Authentication first');
      console.log('3. Generate App Password from Google Account settings');
    } else if (error.message.includes('connect')) {
      console.log('\n🔧 Troubleshooting Connection Issue:');
      console.log('1. Check EMAIL_PORT (587 for TLS, 465 for SSL)');
      console.log('2. Verify EMAIL_HOST is reachable');
      console.log('3. Check firewall settings');
    }
  }
}

// Run the test
testEmailConfig();