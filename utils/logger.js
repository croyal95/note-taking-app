const winston = require('winston');
const path = require('path');

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Define transports
const transports = [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/all.log')
    }),
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error'
    })
];

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format,
    transports,
    exitOnError: false
});

// Stream for Morgan
logger.stream = {
    write: (message) => logger.http(message.trim())
};

module.exports = { logger };