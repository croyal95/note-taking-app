// auth.js
const express = require('express');
const passport = require('passport');
const User = require('../models/user');
const { logger } = require('../utils/logger');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user
    const user = new User({ email, password });
    await user.save();

    logger.info('User registered', { email });

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        redirectTo:'http://127.0.0.1:5500/public/index.html'
    });
} catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({ message: 'Registration failed' });
    }
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            logger.error('Login error:', err);
            return res.status(500).json({
                success: false,
                message: 'Authentication error'
            });
        }

        if (!user) {
            logger.warn('Authentication failed:', info);
            return res.status(401).json({
                success: false,
                message: info.message || 'Invalid email or password'
            });
        }

        req.logIn(user, async (loginErr) => {
            if (loginErr) {
                logger.error('Login error:', loginErr);
                return res.status(500).json({
                    success: false,
                    message: 'Login failed'
                });
            }

            try {
                await User.findByIdAndUpdate(user._id, {
                    lastLogin: new Date()
                });

                // Set session data
                req.session.user = {
                    id: user._id,
                    email: user.email
                };
                
                // Save session
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });

                logger.info('User logged in successfully', { 
                    email: user.email,
                    sessionID: req.sessionID
                });

                // Send absolute URL for redirect
                const redirectUrl ='http://127.0.0.1:5500/public/notes.html';
                
                res.json({
                    success: true,
                    redirectUrl,
                    user: {
                        email: user.email,
                        id: user._id
                    },
                    message: 'Login successful'
                });
            } catch (error) {
                logger.error('Error in login process:', error);
                res.status(500).json({
                    success: false,
                    message: 'Login process failed'
                });
            }
        });
    })(req, res, next);
});

// Verify session

router.get('/verify-session', (req, res) => {
    console.log('Session verification request:', {
        sessionID: req.session,
        isAuthenticated: req.isAuthenticated(),
        session: req.sessionID,
        user: req.user
    });

    if (req.isAuthenticated()) {
        console.log('User is authenticated, sending success response');
        res.json({ 
            success: true, 
            user: {
                id: req.user._id,
                email: req.user.email
            }
        });
    } else {
        console.log('User is not authenticated');
        res.status(401).json({ 
            success: false, 
            message: 'No active session' 
        });
    }
});


router.post('/change-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        // Input validation
        if (!email || !currentPassword || !newPassword) {
            logger.warn('Missing required fields in password change request');
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
                code: 'VALIDATION_ERROR'
            });
        }

        // Find user and explicitly include password field
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            logger.warn('User not found during password change attempt', { email });
            return res.status(400).json({
                success: false,
                message: 'User not found',
                code: 'EMAIL_ERROR'
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            logger.warn('Invalid current password during change attempt', { email });
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
                code: 'CURRENT_PASSWORD_ERROR'
            });
        }

        // Validate new password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            logger.warn('New password does not meet requirements');
            return res.status(400).json({
                success: false,
                message: 'New password does not meet requirements',
                code: 'NEW_PASSWORD_ERROR'
            });
        }

        // Update password directly
        user.password = newPassword;
        await user.save();

        logger.info('Password changed successfully', { email });

        res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        logger.error('Password change error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Server error occurred while changing password',
            code: 'SERVER_ERROR'
        });
    }
});

router.post('/logout', (req, res) => {
    req.logout((err) => {
    if (err) {
        logger.error('Logout error', { error: err.message });
        return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ 
        success: true,
        message: 'Logged out successfully',
    redirectTo: 'http://127.0.0.1:5500/public/index.html' });
    });
});
module.exports = router;