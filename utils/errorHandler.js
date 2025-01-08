// utils/errorHandler.js
const { logger } = require('./logger');

const errorHandler = (err, req, res, next) => {
    // Log all errors
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        status: err.status || 500,
        path: req.path
    });

    // Handle specific error types
    switch (true) {
        case err.name === 'ValidationError':
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: Object.values(err.errors).map(error => error.message)
            });

        case err.name === 'CastError':
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });

        case err.code === 11000:
            return res.status(400).json({
                success: false,
                message: 'Duplicate field value entered'
            });

        case err.name === 'UnauthorizedError':
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });

        default:
            return res.status(err.status || 500).json({
                success: false,
                message: process.env.NODE_ENV === 'development' 
                    ? err.message 
                    : 'Internal server error'
            });
    }
};

const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Resource not found - ${req.originalUrl}`
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};