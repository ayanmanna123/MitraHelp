const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS  // Your app password
    }
  });
};

// Email templates
const getEmailTemplate = (type, data) => {
  switch (type) {
    case 'emergency_notification':
      return {
        subject: `🚨 URGENT: New ${data.emergencyType} Emergency Nearby - MitraHelp`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
              .emergency-card { background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚨 EMERGENCY ALERT</h1>
                <p>Immediate Help Needed Nearby</p>
              </div>
              
              <div class="content">
                <h2>New Emergency Request</h2>
                <p>Hi ${data.volunteerName},</p>
                <p>A new emergency has been reported near your location and requires your immediate attention.</p>
                
                <div class="emergency-card">
                  <h3 style="color: #dc2626; margin-top: 0;">${data.emergencyType} Emergency</h3>
                  <p><strong>Description:</strong> ${data.description}</p>
                  <p><strong>Current Location:</strong> ${data.address}</p>
                  <p><strong>Coordinates:</strong> ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}</p>
                  ${data.permanentAddress ? `<p><strong>Requester's Permanent Address:</strong> ${data.permanentAddress}</p>` : ''}
                  ${data.notificationType ? `
                  <div style="background: #eff6ff; padding: 10px; border-left: 3px solid #3b82f6; margin: 10px 0;">
                    <strong>🔔 Notification Type:</strong> 
                    ${data.notificationType === 'nearby' ? 'Based on your current location' : ''}
                    ${data.notificationType === 'permanent_address' ? 'Based on your permanent address' : ''}
                    ${data.notificationType === 'both' ? 'Based on both your current and permanent locations' : ''}
                  </div>` : ''}
                  <p><strong>Distance from you:</strong> Approximately ${data.distance.toFixed(1)} km</p>
                  <p><strong>Reported by:</strong> ${data.requesterName}</p>
                </div>
                
                <div class="highlight">
                  <strong>⚠️ Action Required:</strong>
                  <p>Please open the MitraHelp app to view this emergency and respond if you can assist.</p>
                </div>
                
                <p><strong>Time Reported:</strong> ${new Date().toLocaleString()}</p>
                
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/volunteer/dashboard" class="btn">
                  View Emergency Details
                </a>
                
                <p style="margin-top: 30px;">
                  <strong>Need help?</strong> Contact our support team at ${process.env.SUPPORT_EMAIL || 'support@mitrahelp.com'}
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated emergency notification from MitraHelp</p>
                <p>© 2026 MitraHelp. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
🚨 EMERGENCY ALERT - New ${data.emergencyType} Emergency Nearby

Hi ${data.volunteerName},

A new emergency has been reported near your location:

Type: ${data.emergencyType}
Description: ${data.description}
Current Location: ${data.address}
Coordinates: ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}
${data.permanentAddress ? `Requester's Permanent Address: ${data.permanentAddress}\n` : ''}${data.notificationType ? `Notification Type: ${data.notificationType === 'nearby' ? 'Based on your current location' : data.notificationType === 'permanent_address' ? 'Based on your permanent address' : 'Based on both your current and permanent locations'}\n` : ''}Distance: Approximately ${data.distance.toFixed(1)} km
Reported by: ${data.requesterName}
Time: ${new Date().toLocaleString()}

Please open the MitraHelp app to view this emergency and respond if you can assist.

View Emergency: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/volunteer/dashboard

This is an automated emergency notification from MitraHelp.
        `
      };
    
    default:
      return {
        subject: 'MitraHelp Notification',
        html: '<p>Hello from MitraHelp</p>',
        text: 'Hello from MitraHelp'
      };
  }
};

module.exports = {
  createTransporter,
  getEmailTemplate
};