const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import database connection
const connectDB = require('../config/database');

// Import routes
const adminRoutes = require('../routes/admin');

// Import bot
const bot = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// View engine setup (for serving HTML files)
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'html');
app.engine('html', require('fs').readFileSync);

// Routes
app.use('/api/admin', adminRoutes);

// Serve admin panel pages
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

app.get('/admin', (req, res) => {
    res.redirect('/admin/login');
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Telegram Referral Bot API',
        status: 'running',
        bot: '@Referneww_bot',
        admin: '/admin/login'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Bot: @${process.env.BOT_USERNAME}`);
    console.log(`🔗 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;

