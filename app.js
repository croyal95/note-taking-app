const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
require('dotenv').config();

// Import local modules
const { connectWithRetry } = require('./db');
const noteRoutes = require('./routes/notes');
const authRoutes = require('./routes/auth');
const folderRoutes = require('./routes/folders');
const { errorHandler, notFoundHandler } = require('./utils/errorHandler');
const { logger } = require('./utils/logger');

// Initialize express
const app = express();

// For cookies
app.set('trust proxy', 1);

// CORS Configuration
const CORS_ORIGIN = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://127.0.0.1:5500', 'http://localhost:5500'];
const corsOptions = {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie']
};

// CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', { stream: logger.stream }));
}

// Session configuration
const sessionConfig = {
 secret: process.env.SESSION_SECRET,
 name: 'sessionId',
 resave: false,
 saveUninitialized: false,
 proxy: process.env.NODE_ENV === 'production',
 store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/noteApp',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60,
    autoRemove: 'native',
    touchAfter: 24 * 3600,
    crypto: {
        secret: process.env.SESSION_SECRET
    }
 }),
 cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined 
    }
};

 // Session middleware
app.use(session(sessionConfig));

// Passport Configuration
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/folders', folderRoutes);

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server initialization
const startServer = async () => {
    try {
        await connectWithRetry();
        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
        logger.info('SIGTERM received. Shutting down gracefully...');
        server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
        });
    });
} catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
    }
};
// Start server
if (require.main === module) {
    startServer();
}
module.exports = app;