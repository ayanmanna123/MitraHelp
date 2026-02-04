# MitraHelp

A community-driven emergency response platform connecting people in need with nearby volunteers.

## Features

- 🚨 **Emergency Requests**: Users can create emergency requests with location
- 👥 **Volunteer Network**: Nearby volunteers are notified immediately
- 📍 **Location-based Matching**: Uses GPS to find closest available volunteers
- 🏠 **Permanent Address**: Volunteers provide permanent address for better notification coverage
- 🗺️ **Map Selection**: Interactive map for precise location selection with automatic address conversion
- 🌍 **Dual-location Notifications**: Alerts volunteers based on both current and permanent addresses
- 💬 **Real-time Chat**: Built-in communication between users and volunteers
- 📧 **Email Notifications**: Automated email alerts to volunteers with complete address info
- 🔐 **User Authentication**: Secure login with phone verification
- 📱 **Mobile Friendly**: Responsive design for all devices

## Tech Stack

**Frontend:**
- React.js
- Vite
- Socket.io client
- Tailwind CSS
- React Router

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io
- Nodemailer
- JWT Authentication

**Services:**
- Twilio (SMS verification)
- Google Auth (Optional)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/MitraHelp.git
cd MitraHelp
```

### 2. Setup Backend

```bash
cd backend
npm install

# Create .env file
 cp .env.example .env

# Edit .env with your configuration
# Set up MongoDB, Twilio, and Email credentials
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install

# Create .env file
 cp .env.example .env

# Edit .env with your backend URL
```

### 4. Run the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mitrahelp
JWT_SECRET=your_jwt_secret

# Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Email Notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Google Auth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
```

**Frontend (.env):**
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Email Notifications

Volunteers receive email alerts when emergencies are reported nearby. See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed configuration.

## SMS Verification

User phone numbers are verified using Twilio. See [TWILIO_SMS_SETUP.md](TWILIO_SMS_SETUP.md) for setup instructions.

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/google` - Google authentication

### Emergency
- `POST /api/emergency` - Create emergency request
- `GET /api/emergency/:id` - Get emergency details
- `GET /api/emergency/user` - Get user's emergencies
- `PUT /api/emergency/:id/accept` - Volunteer accepts emergency
- `GET /api/emergency/nearby` - Get nearby emergencies

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile (including permanent address)
- `GET /api/user/emergencies` - Get user emergencies

### Auth
- `PUT /api/auth/profile` - Update user profile during volunteer signup (includes permanent address)

## Project Structure

```
MitraHelp/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   ├── email.js
│   │   └── s3.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   │   └── emailService.js
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   └── vite.config.js
```

## Testing

### Backend Tests

```bash
cd backend
node test-email.js  # Test email functionality
node quick-test.js  # Quick API tests
```

## Deployment

### Backend (Vercel)
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy dist folder
3. Set environment variables

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License

## Support

For support, email support@mitrahelp.com or create an issue.

## Acknowledgements

- Socket.io for real-time communication
- Twilio for SMS services
- MongoDB for database
- React community for amazing tools