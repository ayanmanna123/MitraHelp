const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true
}));

// Cross-Origin-Opener-Policy for Google Auth popup
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
});

app.use(helmet());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/emergency', require('./routes/emergency.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/volunteer', require('./routes/volunteer.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/face-verification', require('./routes/faceVerification.routes'));

app.get('/', (req, res) => {
    res.send('MitraHelp Backend API is running...');
});

// Socket.io setup
const io = new Server(server, {
    cors: { 
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Make io accessible in controllers
app.set('socketio', io);

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join room with user ID for personal notifications
    socket.on('join', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`User ${userId} joined personal room`);
        }
    });

    // Join specific emergency room for chat & tracking
    socket.on('join_emergency', (emergencyId) => {
        if (emergencyId) {
            socket.join(emergencyId);
            console.log(`Socket ${socket.id} joined emergency room: ${emergencyId}`);
        }
    });

    // Handle Chat Messages
    socket.on('send_message', (data) => {
        // data: { emergencyId, senderId, senderName, text, timestamp }
        io.to(data.emergencyId).emit('receive_message', data);
    });

    // Handle Live Location Updates
    socket.on('location_update', (data) => {
        // data: { emergencyId, userId, role, latitude, longitude, heading, speed, accuracy }
        // Broadcast to everyone in the room EXCEPT the sender
        socket.to(data.emergencyId).emit('remote_location_update', data);
        
        // Also emit to requester specifically for volunteer location updates
        if (data.role === 'volunteer') {
            socket.to(data.emergencyId).emit('volunteer_location_update', {
                emergencyId: data.emergencyId,
                volunteerId: data.userId,
                latitude: data.latitude,
                longitude: data.longitude,
                heading: data.heading,
                speed: data.speed,
                accuracy: data.accuracy,
                timestamp: new Date()
            });
        }
    });

    // Handle tracking status updates
    socket.on('tracking_status_update', (data) => {
        // data: { emergencyId, status, userId, userName }
        socket.to(data.emergencyId).emit('tracking_status_update', data);
    });

    // Handle emergency chat room joining
    socket.on('join_emergency_chat', (data) => {
        // data: { emergencyId, userId, userName, role }
        socket.join(data.emergencyId);
        console.log(`User ${data.userName} (${data.role}) joined chat for emergency ${data.emergencyId}`);
        
        // Notify others in the room
        socket.to(data.emergencyId).emit('user_joined_chat', {
            userId: data.userId,
            userName: data.userName,
            role: data.role,
            emergencyId: data.emergencyId
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
