// Quick test to verify location fixes
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-jwt-token-here'; // Replace with actual token

async function testLocationUpdate() {
    try {
        console.log('Testing location update with valid coordinates...');
        
        const response = await axios.put(`${API_BASE}/users/location`, {
            latitude: 22.61164418099907,
            longitude: 88.42039128770577
        }, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Location update successful');
        console.log('Response:', response.data);
        
        // Test getting the location back
        const getResponse = await axios.get(`${API_BASE}/users/location`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        });
        
        console.log('✅ Location retrieval successful');
        console.log('Retrieved location:', getResponse.data);
        
        return true;
    } catch (error) {
        console.error('❌ Location update failed:', error.response?.data || error.message);
        return false;
    }
}

async function testEmergencyCreation() {
    try {
        console.log('Testing emergency creation with valid location...');
        
        const response = await axios.post(`${API_BASE}/emergency`, {
            type: 'Medical',
            description: 'Test emergency request',
            latitude: 22.61164418099907,
            longitude: 88.42039128770577,
            address: 'Test Location, Kolkata'
        }, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Emergency creation successful');
        console.log('Response:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Emergency creation failed:', error.response?.data || error.message);
        return false;
    }
}

async function runQuickTest() {
    console.log('🚀 Running quick location fix verification...\n');
    
    const locationSuccess = await testLocationUpdate();
    console.log('');
    
    const emergencySuccess = await testEmergencyCreation();
    console.log('');
    
    console.log('='.repeat(50));
    if (locationSuccess && emergencySuccess) {
        console.log('🎉 All tests passed! Location feature is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.');
        if (!locationSuccess) {
            console.log('   - Location update needs attention');
        }
        if (!emergencySuccess) {
            console.log('   - Emergency creation needs attention');
        }
    }
}

// Run if called directly
if (require.main === module) {
    runQuickTest().catch(console.error);
}

module.exports = { testLocationUpdate, testEmergencyCreation };