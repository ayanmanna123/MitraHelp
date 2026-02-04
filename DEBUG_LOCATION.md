# Location Feature Debugging Guide

## Common Issues and Solutions

### 1. 500 Internal Server Error on Location Update

**Symptoms:**
- `PUT http://localhost:5000/api/users/location 500 (Internal Server Error)`
- Error in browser console: "Error updating location: AxiosError: Request failed with status code 500"

**Possible Causes:**
1. User authentication token invalid/expired
2. User document not found in database
3. Geocoding service timeout or rate limiting
4. Database connection issues

**Debugging Steps:**

1. **Check Backend Logs:**
   ```bash
   # In backend directory
   npm run dev
   # Look for error messages when making location requests
   ```

2. **Verify Authentication:**
   - Check if user is properly logged in
   - Verify JWT token is valid and not expired
   - Check if `req.user.id` is properly set

3. **Test with curl:**
   ```bash
   curl -X PUT http://localhost:5000/api/users/location \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"latitude": 28.6139, "longitude": 77.2090}'
   ```

4. **Check Database:**
   ```javascript
   // In MongoDB shell or Compass
   db.users.findOne({_id: ObjectId("USER_ID")})
   ```

### 2. 400 Bad Request on Emergency Creation

**Symptoms:**
- `POST http://localhost:5000/api/emergency 400 (Bad Request)`
- Error: "Location is required" or "Invalid latitude/longitude"

**Possible Causes:**
1. Location data not properly set in user profile
2. Invalid coordinate values
3. Missing required fields
4. Emergency type validation failed

**Debugging Steps:**

1. **Check Request Payload:**
   ```javascript
   // Add this to frontend before making request
   console.log('Emergency request data:', {
     type,
     latitude: user.location.coordinates[1],
     longitude: user.location.coordinates[0],
     address: user.location.address
   });
   ```

2. **Verify User Location:**
   ```bash
   curl -X GET http://localhost:5000/api/users/location \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Test Emergency Creation Directly:**
   ```bash
   curl -X POST http://localhost:5000/api/emergency \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "Medical",
       "description": "Test emergency",
       "latitude": 28.6139,
       "longitude": 77.2090,
       "address": "Test Location"
     }'
   ```

### 3. Geolocation Permission Issues

**Symptoms:**
- Browser shows permission denied
- Location not updating
- "Location access denied" toast message

**Solutions:**
1. Check browser location permissions
2. Ensure HTTPS in production (required for geolocation)
3. Test in different browsers
4. Clear browser cache and cookies

## Testing Checklist

### Backend Tests
- [ ] User authentication working
- [ ] Location update endpoint functional
- [ ] Emergency creation endpoint functional
- [ ] Database connection stable
- [ ] Geocoding service accessible

### Frontend Tests
- [ ] Location permission granted
- [ ] Auth token properly attached to requests
- [ ] Error messages displayed correctly
- [ ] Loading states work properly
- [ ] Location refresh button functional

### Integration Tests
- [ ] Full emergency request flow
- [ ] Location update → Emergency creation
- [ ] Error handling scenarios
- [ ] Network timeout handling

## Quick Fix Commands

```bash
# Restart backend server
cd backend && npm run dev

# Check if required dependencies are installed
cd backend && npm list axios mongoose

# Test database connection
# In MongoDB shell:
show dbs
use mitrahelp
db.users.count()

# Clear frontend cache
cd frontend && rm -rf node_modules/.vite
npm run dev
```

## Emergency Debug Mode

If you need to bypass location requirements temporarily:

1. **In backend controller**, temporarily comment location validation:
```javascript
// Temporarily bypass location validation for testing
// if (!latitude || !longitude) {
//     return res.status(400).json({ success: false, message: 'Location is required' });
// }
```

2. **Use dummy coordinates:**
```javascript
const dummyLocation = {
    latitude: 28.6139,
    longitude: 77.2090,
    address: "New Delhi, India"
};
```

## Support Information

If issues persist:
1. Check browser console for detailed error messages
2. Check backend terminal for server logs
3. Verify all environment variables are set
4. Ensure MongoDB is running
5. Test with Postman/curl to isolate frontend issues