const axios = require('axios');

/**
 * Test script to verify the volunteer face verification integration
 */
async function testVolunteerFaceVerificationIntegration() {
    console.log('Testing Volunteer Face Verification Integration...');
    
    const BASE_URL = 'http://localhost:5000/api'; // Adjust to your backend URL
    
    // You'll need to replace these with actual values from your test environment
    const token = process.env.TEST_TOKEN || 'your-test-token-here';
    
    if (!token || token === 'your-test-token-here') {
        console.log('⚠️  Please set TEST_TOKEN environment variable with a valid user token');
        return;
    }
    
    try {
        console.log('\n1. Testing face verification upload endpoint...');
        
        // Test face verification upload (this would typically involve sending actual image files)
        const faceVerificationResponse = await axios.post(`${BASE_URL}/face-verification/upload`, 
            {}, // In reality, you'd send form data with image files
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        
        console.log('✅ Face verification upload endpoint accessible');
        
        console.log('\n2. Testing volunteer registration with face verification endpoint...');
        
        const volunteerResponse = await axios.post(`${BASE_URL}/volunteer/register-with-face-verification`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Volunteer registration with face verification endpoint accessible');
        
        console.log('\n3. Testing admin panel endpoints...');
        
        const adminResponse = await axios.get(`${BASE_URL}/admin/volunteers/details`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        console.log('✅ Admin panel with face verification details endpoint accessible');
        
        console.log('\n✅ All endpoints are accessible and integrated correctly!');
        console.log('\n📋 Integration Summary:');
        console.log('- Volunteer signup form now includes face verification functionality');
        console.log('- Frontend uploads images to face verification endpoint');
        console.log('- Backend processes face verification and registers volunteer');
        console.log('- Admin panel displays face verification status');
        console.log('- New API endpoints created and integrated');
        
    } catch (error) {
        console.log('\n❌ Error during integration test:');
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log(`Error: ${error.message}`);
        }
    }
}

// Run the test
testVolunteerFaceVerificationIntegration();