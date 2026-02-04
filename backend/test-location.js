// Test script to verify location functionality
const axios = require('axios');

// Test data
const TEST_USER_ID = 'test-user-id'; // Replace with actual user ID
const TEST_TOKEN = 'your-jwt-token'; // Replace with actual JWT token

const API_BASE = 'http://localhost:5000/api';

async function testLocationUpdate() {
    try {
        console.log('Testing location update...');
        
        const response = await axios.put(`${API_BASE}/users/location`, {
            latitude: 28.6139,
            longitude: 77.2090
        }, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Location update response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Location update failed:', error.response?.data || error.message);
        throw error;
    }
}

async function testEmergencyCreation() {
    try {
        console.log('Testing emergency creation...');
        
        const response = await axios.post(`${API_BASE}/emergency`, {
            type: 'Medical',
            description: 'Test emergency request',
            latitude: 28.6139,
            longitude: 77.2090,
            address: 'Test Location, New Delhi'
        }, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Emergency creation response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Emergency creation failed:', error.response?.data || error.message);
        throw error;
    }
}

async function runTests() {
    console.log('Starting location functionality tests...\n');
    
    try {
        // Test 1: Location Update
        await testLocationUpdate();
        console.log('✓ Location update test passed\n');
        
        // Test 2: Emergency Creation
        await testEmergencyCreation();
        console.log('✓ Emergency creation test passed\n');
        
        console.log('All tests passed successfully! 🎉');
    } catch (error) {
        console.error('Tests failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    testLocationUpdate,
    testEmergencyCreation
};