const { createTransporter, getEmailTemplate } = require('../config/email');

/**
 * Send email to a single recipient
 * @param {string} to - Recipient email
 * @param {string} templateType - Type of email template
 * @param {object} data - Data for the template
 * @returns {Promise<object>} - Result of email sending
 */
const sendEmail = async (to, templateType, data) => {
  try {
    // Validate email
    if (!to || !to.includes('@')) {
      throw new Error('Invalid email address');
    }

    const transporter = createTransporter();
    const template = getEmailTemplate(templateType, data);

    const mailOptions = {
      from: `"MitraHelp" <${process.env.EMAIL_USER}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to, 'ID:', info.messageId);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending email to', to, ':', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send emails to multiple recipients
 * @param {Array} recipients - Array of {email, name} objects
 * @param {string} templateType - Type of email template
 * @param {object} data - Base data for the template
 * @returns {Promise<Array>} - Array of results for each email
 */
const sendBulkEmails = async (recipients, templateType, data) => {
  const results = [];

  for (const recipient of recipients) {
    const emailData = {
      ...data,
      volunteerName: recipient.name
    };

    const result = await sendEmail(recipient.email, templateType, emailData);
    results.push({
      email: recipient.email,
      name: recipient.name,
      ...result
    });

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
};

/**
 * Send emergency notification emails to nearby volunteers
 * @param {Array} volunteers - Array of volunteer user objects
 * @param {object} emergency - Emergency object
 * @param {object} requester - Requester user object
 * @returns {Promise<object>} - Summary of email sending results
 */
const sendEmergencyNotifications = async (volunteers, emergency, requester) => {
  try {
    // Filter volunteers with valid emails
    const volunteersWithEmail = volunteers.filter(vol =>
      vol.email && vol.email.includes('@')
    );

    if (volunteersWithEmail.length === 0) {
      console.log('No volunteers with valid email addresses found');
      return {
        success: true,
        message: 'No volunteers with valid email addresses',
        totalVolunteers: volunteers.length,
        emailsSent: 0,
        results: []
      };
    }

    console.log(`Sending emergency notifications to ${volunteersWithEmail.length} volunteers...`);

    // Prepare recipient data
    const recipients = volunteersWithEmail.map(vol => ({
      email: vol.email,
      name: vol.name || 'Volunteer'
    }));

    // Prepare email data
    const emailData = {
      emergencyType: emergency.type,
      description: emergency.description,
      address: emergency.location?.address || 'Location not specified',
      latitude: emergency.location?.coordinates[1] || 0,
      longitude: emergency.location?.coordinates[0] || 0,
      permanentAddress: requester?.permanentAddress?.address || '',
      requesterName: requester?.name || 'Anonymous User',
      distance: 0 // Will be calculated per recipient if needed
    };

    // Send emails
    const results = await sendBulkEmails(recipients, 'emergency_notification', emailData);

    // Count successful sends
    const successfulSends = results.filter(r => r.success).length;

    console.log(`Emergency notifications sent: ${successfulSends}/${volunteersWithEmail.length}`);

    return {
      success: true,
      message: `Notifications sent to ${successfulSends} out of ${volunteersWithEmail.length} volunteers`,
      totalVolunteers: volunteers.length,
      volunteersWithEmail: volunteersWithEmail.length,
      emailsSent: successfulSends,
      results
    };

  } catch (error) {
    console.error('Error sending emergency notifications:', error);
    return {
      success: false,
      error: error.message,
      totalVolunteers: volunteers.length,
      emailsSent: 0,
      results: []
    };
  }
};

/**
 * Send emergency alerts to personal contacts
 * @param {Array} contacts - User's emergency contacts
 * @param {object} emergency - Emergency details
 * @param {object} user - User details
 */
const sendEmergencyAlertToContacts = async (contacts, emergency, user) => {
  try {
    if (!contacts || contacts.length === 0) return;

    console.log(`Sending alerts to ${contacts.length} emergency contacts`);

    const emailData = {
      userName: user.name,
      emergencyType: emergency.type,
      description: emergency.description,
      address: emergency.location?.address || 'Unknown Location',
      latitude: emergency.location?.coordinates[1],
      longitude: emergency.location?.coordinates[0],
      mapLink: `https://www.google.com/maps?q=${emergency.location?.coordinates[1]},${emergency.location?.coordinates[0]}`
    };

    const recipients = contacts.map(c => ({ email: c.email, name: c.name }));

    // We can reuse a generic template or create a specific one
    // For now, let's use 'emergency_contact_alert' template type (need to support it in getEmailTemplate)
    // Or reuse existing structure. Let's assume we handle it in `getEmailTemplate` or pass raw html here if needed.
    // Actually best to stick to template structure.

    await sendBulkEmails(recipients, 'emergency_contact_alert', emailData);

  } catch (error) {
    console.error("Error sending contact alerts:", error);
  }
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  sendEmergencyNotifications,
  sendEmergencyAlertToContacts
};