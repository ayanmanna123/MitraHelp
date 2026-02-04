#!/usr/bin/env node

// Quick troubleshooting script for location feature issues
const axios = require('axios');
const fs = require('fs');

const CONFIG = {
    API_BASE: process.env.API_URL || 'http://localhost:5000/api',
    TEST_COORDS: { lat: 28.6139, lon: 77.2090 }, // New Delhi coordinates
    TIMEOUT: 5000
};

async function checkBackendHealth() {
    try {
        console.log('🔍 Checking backend health...');
        const response = await axios.get(`${CONFIG.API_BASE}/auth/me`, {
            timeout: CONFIG.TIMEOUT
        });
        console.log('✅ Backend is running and responding');
        return true;
    } catch (error) {
        console.log('❌ Backend health check failed:', error.message);
        return false;
    }
}

async function checkDependencies() {
    console.log('\n📦 Checking required dependencies...');
    
    const requiredDeps = ['axios', 'express', 'mongoose'];
    let allGood = true;
    
    for (const dep of requiredDeps) {
        try {
            require.resolve(dep);
            console.log(`✅ ${dep} is installed`);
        } catch (error) {
            console.log(`❌ ${dep} is missing`);
            allGood = false;
        }
    }
    
    return allGood;
}

async function checkEnvironment() {
    console.log('\n⚙️  Checking environment configuration...');
    
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
    let allGood = true;
    
    for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
            console.log(`✅ ${envVar} is set`);
        } else {
            console.log(`❌ ${envVar} is not set`);
            allGood = false;
        }
    }
    
    return allGood;
}

async function testLocationEndpoint() {
    console.log('\n📍 Testing location endpoint...');
    
    try {
        // This will fail without auth, but we can check if endpoint exists
        await axios.put(`${CONFIG.API_BASE}/users/location`, {
            latitude: CONFIG.TEST_COORDS.lat,
            longitude: CONFIG.TEST_COORDS.lon
        }, {
            timeout: CONFIG.TIMEOUT
        });
        console.log('✅ Location endpoint is accessible');
        return true;
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Location endpoint exists (requires authentication)');
            return true;
        } else {
            console.log('❌ Location endpoint error:', error.message);
            return false;
        }
    }
}

async function testGeocodingService() {
    console.log('\n🌍 Testing geocoding service...');
    
    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
                lat: CONFIG.TEST_COORDS.lat,
                lon: CONFIG.TEST_COORDS.lon,
                format: 'json'
            },
            timeout: CONFIG.TIMEOUT,
            headers: {
                'User-Agent': 'MitraHelp-Troubleshooter'
            }
        });
        
        if (response.data?.display_name) {
            console.log('✅ Geocoding service is working');
            console.log('   Sample address:', response.data.display_name.substring(0, 50) + '...');
            return true;
        } else {
            console.log('⚠️  Geocoding service returned unexpected data');
            return false;
        }
    } catch (error) {
        console.log('❌ Geocoding service error:', error.message);
        return false;
    }
}

async function runDiagnostics() {
    console.log('🔧 MitraHelp Location Feature Diagnostics\n');
    console.log(`API Endpoint: ${CONFIG.API_BASE}`);
    console.log(`Test Coordinates: ${CONFIG.TEST_COORDS.lat}, ${CONFIG.TEST_COORDS.lon}\n`);
    
    const results = {
        backend: await checkBackendHealth(),
        dependencies: await checkDependencies(),
        environment: await checkEnvironment(),
        locationEndpoint: await testLocationEndpoint(),
        geocoding: await testGeocodingService()
    };
    
    console.log('\n📋 DIAGNOSTICS SUMMARY:');
    console.log('=====================');
    
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    
    console.log('\n' + '='.repeat(50));
    if (allPassed) {
        console.log('🎉 All systems operational! Location feature should work correctly.');
    } else {
        console.log('⚠️  Some issues detected. Please check the failed components above.');
        console.log('\n🔧 Quick Fixes:');
        if (!results.backend) {
            console.log('   - Start backend server: cd backend && npm run dev');
        }
        if (!results.dependencies) {
            console.log('   - Install dependencies: npm install');
        }
        if (!results.environment) {
            console.log('   - Check .env file and required environment variables');
        }
        if (!results.geocoding) {
            console.log('   - Geocoding service may be temporarily unavailable (using fallback)');
        }
    }
    
    return allPassed;
}

// Run if called directly
if (require.main === module) {
    runDiagnostics().catch(error => {
        console.error('Diagnostics failed:', error);
        process.exit(1);
    });
}

module.exports = { runDiagnostics };