# Email Notifications Setup

This guide explains how to configure email notifications for emergency alerts in MitraHelp.

## Setup Instructions

### 1. Gmail Setup (Recommended)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

#### Step 2: Generate App Password
1. In Google Account settings, go to Security
2. Click on "App passwords" (under 2-Step Verification)
3. Select "Mail" and your device
4. Copy the generated 16-character password

#### Step 3: Configure Environment Variables
Add these to your `.env` file:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password
FRONTEND_URL=http://localhost:5173
SUPPORT_EMAIL=support@mitrahelp.com
```

### 2. Other Email Providers

For other providers, update these variables:

#### Outlook/Hotmail:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

#### Yahoo:
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
```

#### Custom SMTP:
```env
EMAIL_HOST=your.smtp.server.com
EMAIL_PORT=your_port
```

## How It Works

When an emergency is created:
1. The system finds nearby volunteers (within 5km by default)
2. For each volunteer with a valid email address:
   - An email notification is sent with emergency details
   - Socket notification is sent to connected volunteers
3. Volunteers receive:
   - Emergency type and description
   - Location details
   - Distance from their location
   - Link to volunteer dashboard

## Email Template

The emails use a professional template with:
- Emergency alert header
- Detailed emergency information
- Clear call-to-action button
- Responsive design for all devices

## Testing

To test email functionality:
1. Make sure all environment variables are set
2. Create a test emergency request
3. Check the backend console for email logs
4. Verify emails arrive in volunteer inboxes

## Troubleshooting

### Common Issues:

1. **"Invalid login" error**
   - Make sure you're using an app password, not your regular password
   - Verify 2FA is enabled

2. **Emails not sending**
   - Check environment variables are correctly set
   - Verify the email address is valid
   - Check spam/junk folder

3. **Connection timeout**
   - Verify internet connection
   - Check if your ISP blocks SMTP ports

### Logs:
Check the backend console for detailed email sending logs:
```
Email sent successfully to: volunteer@example.com ID: <message_id>
Emergency notifications sent: 3/5
```

## Security Notes

- Never commit `.env` files to version control
- Use app-specific passwords, not your main account password
- Rotate app passwords periodically
- Monitor email sending logs for unusual activity

## Customization

You can customize:
- Email templates in `backend/config/email.js`
- Notification radius in the emergency controller
- Email content and styling
- Send timing and frequency

The system is designed to be extensible for additional notification methods.