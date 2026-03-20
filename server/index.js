require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: ['https://bix-insight-ai.vercel.app'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Store user socket mappings
const userSockets = new Map();
app.set('io', io);
app.set('userSockets', userSockets);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('authenticate', (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`👤 User ${userId} mapped to socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
        // Remove user socket mapping
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
        console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
});

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/analysis', require('./routes/analysis'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
        }
        return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    server.listen(PORT, () => {
        console.log(`\n🚀 BixInsight AI Server running on port ${PORT}`);
        console.log(`   REST API: http://localhost:${PORT}/api`);
        console.log(`   WebSocket: ws://localhost:${PORT}`);
        console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
    });
};

startServer();
