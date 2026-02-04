const { verifyFacesWithPythonBase64 } = require('./utils/pythonFaceVerification');
const fs = require('fs');
const path = require('path');

/**
 * Test the Python face verification system
 */
async function testFaceVerification() {
    try {
        console.log('🔍 Testing Python face verification system...\n');
        
        // Create dummy image buffers (solid color images for testing)
        const createDummyImageBuffer = (width, height, color) => {
            // Create a simple PPM image (easier than JPEG for testing)
            const header = `P6\n${width} ${height}\n255\n`;
            const headerBuffer = Buffer.from(header, 'ascii');
            const pixelData = Buffer.alloc(width * height * 3, color);
            return Buffer.concat([headerBuffer, pixelData]);
        };
        
        // Create two similar dummy images (same face)
        const govIdBuffer = createDummyImageBuffer(299, 299, 128); // Gray image
        const selfieBuffer = createDummyImageBuffer(299, 299, 130); // Slightly different gray
        
        console.log('🔄 Calling Python verification script...');
        const result = await verifyFacesWithPythonBase64(govIdBuffer, selfieBuffer);
        
        console.log('\n✅ Python verification result:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log(`\n📊 Match Score: ${(parseFloat(result.match_score) * 100).toFixed(2)}%`);
            console.log(`✅ Verified: ${result.is_verified ? 'YES' : 'NO'}`);
            console.log(`🎯 Threshold: ${(parseFloat(result.threshold) * 100).toFixed(0)}%`);
        } else {
            console.log(`\n❌ Error: ${result.error}`);
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
if (require.main === module) {
    testFaceVerification();
}

module.exports = { testFaceVerification };
