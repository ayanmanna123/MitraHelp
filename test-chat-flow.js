// Test script to verify emergency chat flow
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testChatFlow() {
    console.log('=== Testing Emergency Chat Flow ===\n');
    
    try {
        // 1. Create a test user (requester)
        console.log('1. Creating test requester user...');
        const requesterRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test Requester',
            email: 'requester@test.com',
            password: 'password123',
            phone: '+1234567890',
            role: 'user'
        });
        const requesterToken = requesterRes.data.token;
        console.log('✅ Requester created\n');
        
        // 2. Create a test volunteer
        console.log('2. Creating test volunteer user...');
        const volunteerRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test Volunteer',
            email: 'volunteer@test.com',
            password: 'password123',
            phone: '+1987654321',
            role: 'volunteer'
        });
        const volunteerToken = volunteerRes.data.token;
        console.log('✅ Volunteer created\n');
        
        // 3. Requester creates emergency
        console.log('3. Requester creating emergency...');
        const emergencyRes = await axios.post(`${BASE_URL}/emergency`, {
            type: 'Medical',
            description: 'Test emergency for chat',
            latitude: 22.5726,
            longitude: 88.3639,
            address: 'Test Location'
        }, {
            headers: { Authorization: `Bearer ${requesterToken}` }
        });
        const emergencyId = emergencyRes.data.data._id;
        console.log(`✅ Emergency created: ${emergencyId}\n`);
        
        // 4. Volunteer accepts emergency
        console.log('4. Volunteer accepting emergency...');
        await axios.put(`${BASE_URL}/emergency/${emergencyId}/accept`, {}, {
            headers: { Authorization: `Bearer ${volunteerToken}` }
        });
        console.log('✅ Emergency accepted\n');
        
        // 5. Verify emergency status updated
        console.log('5. Verifying emergency status...');
        const updatedEmergency = await axios.get(`${BASE_URL}/emergency/${emergencyId}`, {
            headers: { Authorization: `Bearer ${requesterToken}` }
        });
        console.log(`Status: ${updatedEmergency.data.data.status}`);
        console.log(`Assigned Volunteer: ${updatedEmergency.data.data.assignedVolunteer?.name}\n`);
        
        console.log('🎉 Chat flow test completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Open http://localhost:5174 in two browser windows');
        console.log('2. Login as requester (requester@test.com / password123)');
        console.log('3. Login as volunteer (volunteer@test.com / password123)');
        console.log('4. Requester creates emergency');
        console.log('5. Volunteer accepts emergency from Nearby Alerts');
        console.log('6. Both should be redirected to Emergency Tracking page with working chat');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testChatFlow();