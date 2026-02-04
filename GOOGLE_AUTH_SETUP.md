# Google Authentication Setup

## Prerequisites
1. A Google Cloud Project
2. OAuth 2.0 Client ID configured

## Setup Steps

### 1. Create Google OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application"
6. Add the following to "Authorized JavaScript origins":
   ```
   http://localhost:5173
   http://localhost:3000
   ```
7. Add the following to "Authorized redirect URIs":
   ```
   http://localhost:5173
   http://localhost:3000
   ```
8. Click "Create" and copy your Client ID

### 2. Update Environment Variables

In your frontend `.env` file, replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Google Client ID:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id-here.apps.googleusercontent.com
```

### 3. Backend Configuration

Make sure your backend `.env` file has the Google Client ID:

```env
GOOGLE_CLIENT_ID=your-actual-google-client-id-here.apps.googleusercontent.com
```

### 4. Testing

1. Start your frontend: `npm run dev`
2. Start your backend: `npm start` (in backend directory)
3. Navigate to the login page
4. Click the "Continue with Google" button
5. You should be able to sign in with your Google account

## How It Works

1. User clicks "Continue with Google"
2. Google One Tap prompt appears for user authentication
3. After successful Google authentication, we receive an ID token via callback
4. This ID token is sent to our backend `/api/auth/google` endpoint
5. Backend verifies the token with Google and creates/authenticates the user
6. User is logged in and redirected to dashboard

## Features

- ✅ One-click Google login
- ✅ Automatic user creation for new Google users
- ✅ Account linking (if user exists with same email)
- ✅ Secure token verification
- ✅ Proper logout (clears both app and Google session)

## Troubleshooting

### "Google Login Failed" Error
- Check that your Google Client ID is correct in `.env`
- Ensure the authorized origins match your frontend URL
- Verify Google+ API is enabled in Google Cloud Console

### CORS Issues
- Make sure your backend allows requests from your frontend origin
- Check that the Google Client ID matches between frontend and backend

### Token Verification Failed
- Ensure `GOOGLE_CLIENT_ID` is set correctly in backend `.env`
- Check that the Google Auth Library is properly installed in backend