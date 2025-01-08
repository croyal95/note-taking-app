const mongoose = require('mongoose');
const { logger } = require('./utils/logger');

// Database configuration
const dbConfig = {
    connectionOptions: {
        maxPoolSize: 10,
        retryWrites: true,
        autoIndex: process.env.NODE_ENV !== 'production'
    },
    retryAttempts: 3,
    retryDelay: 5000
};

// Database connection monitoring
const monitorConnection = (connection) => {
    connection.on('connected', () => {
        logger.info('MongoDB connected successfully');
    });

    connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
    });

    connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
    });
};

// Connect to database with retry mechanism
const connectWithRetry = async (retryCount = 0) => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/noteApp';

    try {
        logger.info(`Attempting to connect to MongoDB (Attempt ${retryCount + 1}/${dbConfig.retryAttempts})`);
        
        await mongoose.connect(mongoURI, dbConfig.connectionOptions);
        monitorConnection(mongoose.connection);

        return mongoose.connection;
    } catch (error) {
        logger.error('Failed to connect to MongoDB:', {
            error: error.message,
            attempt: retryCount + 1
        });

        if (retryCount < dbConfig.retryAttempts - 1) {
            logger.info(`Retrying connection in ${dbConfig.retryDelay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, dbConfig.retryDelay));
            return connectWithRetry(retryCount + 1);
        } else {
            logger.error('Max retry attempts reached. Unable to connect to MongoDB');
            throw new Error('Failed to connect to database after maximum retry attempts');
        }
    }
};

// Graceful shutdown handler
const gracefulShutdown = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close(false);
            logger.info('MongoDB connection closed successfully');
        }
    } catch (error) {
        logger.error('Error during MongoDB shutdown:', error);
        throw error;
    }
};

// Process event handlers
process.on('SIGINT', async () => {
    try {
        await gracefulShutdown();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    try {
        await gracefulShutdown();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
});

module.exports = {
    connectWithRetry,
    gracefulShutdown
};