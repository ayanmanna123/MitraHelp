const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5000';
const EMERGENCY_ID = 'test-emergency-id';

const volunteerSocket = io(SOCKET_URL);
const requesterSocket = io(SOCKET_URL);

let messageReceived = false;
let locationReceived = false;

console.log('Starting Socket Test...');

requesterSocket.on('connect', () => {
    console.log('Requester connected');
    requesterSocket.emit('join_emergency', EMERGENCY_ID);
});

volunteerSocket.on('connect', () => {
    console.log('Volunteer connected');
    volunteerSocket.emit('join_emergency', EMERGENCY_ID);

    // Wait a bit for joins to propagate then send data
    setTimeout(() => {
        // 1. Test Chat
        console.log('Sending test message...');
        volunteerSocket.emit('send_message', {
            emergencyId: EMERGENCY_ID,
            senderId: 'vol-123',
            senderName: 'Test Volunteer',
            text: 'Hello, this is a test message',
            timestamp: new Date().toISOString()
        });

        // 2. Test Location
        console.log('Sending location update...');
        volunteerSocket.emit('location_update', {
            emergencyId: EMERGENCY_ID,
            userId: 'vol-123',
            role: 'volunteer',
            latitude: 22.5,
            longitude: 88.3,
            heading: 0
        });

    }, 1000);
});

requesterSocket.on('receive_message', (data) => {
    console.log('✅ Requester received message:', data.text);
    messageReceived = true;
    checkDone();
});

requesterSocket.on('remote_location_update', (data) => {
    console.log('✅ Requester received location update:', data.latitude, data.longitude);
    locationReceived = true;
    checkDone();
});

function checkDone() {
    if (messageReceived && locationReceived) {
        console.log('🎉 All Socket tests passed!');
        volunteerSocket.close();
        requesterSocket.close();
        process.exit(0);
    }
}

// Timeout
setTimeout(() => {
    if (!messageReceived || !locationReceived) {
        console.error('❌ Timeout waiting for events');
        process.exit(1);
    }
}, 5000);
