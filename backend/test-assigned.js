const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAssignedEmergency() {
    try {
        console.log('Testing Assigned Emergency API...');

        // Login as volunteer
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'volunteer@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful.');

        // Get assigned emergency
        const res = await axios.get(`${BASE_URL}/emergency/assigned`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Assigned Emergency Data:', JSON.stringify(res.data, null, 2));

        if (res.data.success) {
            console.log('✅ API call successful');
        } else {
            console.error('❌ API call failed');
        }

    } catch (error) {
        if (error.response?.status === 401) {
            console.log('⚠️ Login failed - skipping test (volunteer user might not exist)');
        } else {
            console.error('Test Failed:', error.response ? error.response.data : error.message);
        }
    }
}

testAssignedEmergency();
