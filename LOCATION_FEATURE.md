# Location Feature Implementation

## Overview
The location feature allows users to share their current location when requesting emergency help. This enables volunteers to find and assist users in their immediate vicinity.

## Features Implemented

### Backend
1. **Location Update Endpoint** (`PUT /api/users/location`)
   - Updates user's current location with latitude/longitude
   - Reverse geocodes coordinates to get human-readable address
   - Uses OpenStreetMap Nominatim API for geocoding

2. **Get Current Location Endpoint** (`GET /api/users/location`)
   - Returns the current stored location for a user

3. **Enhanced Emergency Creation**
   - Automatically includes user's location when creating emergency requests
   - Stores both coordinates and address information

### Frontend
1. **Location Context Integration**
   - Added `getCurrentLocation()` method to AuthContext
   - Added `updateLocation()` method to update user's location
   - Added `getLocationFromUser()` to fetch stored location

2. **Need Help Page**
   - Automatically requests location when creating emergency if not available
   - Shows refresh location button
   - Displays user's current location
   - Shows address information when available

3. **User Dashboard**
   - Displays current location coordinates
   - Shows human-readable address when available
   - Includes refresh location button

4. **Location Hook**
   - Created reusable `useLocation` hook for consistent location handling
   - Handles loading states and error management

## How It Works

1. **User Requests Help:**
   - User navigates to "Need Help" page
   - If location not available, system automatically requests it
   - User selects emergency type
   - Location is included in emergency request

2. **Location Updates:**
   - Users can manually refresh their location anytime
   - Location is automatically updated when requesting help
   - Address is reverse-geocoded from coordinates

3. **Volunteer Matching:**
   - Emergency requests include precise location data
   - System finds nearby volunteers based on location
   - Volunteers can see request location on map

## API Endpoints

### User Location
- `PUT /api/users/location` - Update user location
- `GET /api/users/location` - Get user location

### Emergency
- `POST /api/emergency` - Create emergency (includes location)
- `GET /api/emergency/user` - Get user's emergencies

## Error Handling

- Geolocation permission denied
- Location services unavailable
- Network timeout
- Geocoding failures (falls back to "Current Location")

## Dependencies Added

### Backend
- `axios` - For reverse geocoding API calls

### Frontend
- Uses built-in browser Geolocation API
- `react-hot-toast` for user notifications

## Debugging Tools

Several tools are included to help troubleshoot location issues:

1. **Debugging Guide** (`DEBUG_LOCATION.md`)
   - Detailed troubleshooting steps for common issues
   - Quick fix commands
   - Testing procedures

2. **Test Script** (`backend/test-location.js`)
   - Automated tests for location endpoints
   - Validates both location update and emergency creation
   - Run with: `node backend/test-location.js`

3. **Troubleshooting Tool** (`backend/troubleshoot.js`)
   - Comprehensive system diagnostics
   - Checks dependencies, environment, and services
   - Run with: `node backend/troubleshoot.js`

4. **Enhanced Error Logging**
   - Detailed backend error messages
   - Frontend console logging for debugging
   - Improved error messages for users

## Security Considerations

- Location data is only accessible to authenticated users
- Users can only access their own location data
- Location is required for emergency requests (privacy vs safety balance)
- Address information is derived from public geocoding services

## Future Improvements

- Background location tracking for active emergencies
- Location history for safety monitoring
- Integration with mapping services for better address resolution
- Location sharing controls and privacy settings