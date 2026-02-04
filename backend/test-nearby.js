const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testNearby() {
    try {
        // 1. Login as volunteer
        console.log('Logging in as volunteer...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'volunteer@example.com', // Replace with a valid volunteer email if known, or I might need to create one
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful, token retrieved.');

        // 2. Create a dummy emergency (as a user) - actually I need a user token for this.
        // For now, let's just query and see if it 200s, even if empty.

        // 3. Get Nearby Emergencies
        console.log('Fetching nearby emergencies...');
        const nearbyRes = await axios.get(`${BASE_URL}/emergency/nearby`, {
            params: {
                latitude: 22.5726, // Kolkata coords example
                longitude: 88.3639,
                radius: 10
            },
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Nearby Emergencies Response:', JSON.stringify(nearbyRes.data, null, 2));

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

testNearby();
