// folders.js
const express = require('express');
const mongoose = require('mongoose');
const Folder = require('../models/folder');
const Note = require('../models/notes');
const { logger } = require('../utils/logger');
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Not authenticated' });
};

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const folders = await Folder.find({ owner: req.user._id, });
        res.json(folders);
    } catch (error) {
        logger.error('Error fetching folders', { error: error.message });
        res.status(500).json({ message: 'Error fetching folders' });
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Folder name is required' });
        }

        const folder = new Folder({ 
            name: name.toLowerCase(),
            owner: req.user._id 
        });
        await folder.save();
        
        logger.info('Folder created', { name, userId: req.user._id });
        res.status(201).json(folder);
    } catch (error) {
        logger.error('Error creating folder', { error: error.message });
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'A folder with this name already exists' 
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: error.message 
            });
        }
        
        res.status(500).json({ message: 'Error creating folder' });
    }
});

router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const folder = await Folder.findOne({
            _id: req.params.id,
            deleted: false
        });

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        folder.name = req.body.name.toLowerCase();
        await folder.save();

        res.json(folder);
    } catch (error) {
        logger.error('Error updating folder', { error: error.message });
        res.status(500).json({ message: 'Error updating folder' });
    }
});

router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const folder = await Folder.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!folder) {
            logger.warn('Delete attempt on non-existent folder or unauthorized access', {
                folderId: req.params.id,
                userId: req.user._id
            });
            return res.status(404).json({ 
                success: false,
                message: 'Folder not found' 
            });
        }

        const notesResult = await Note.deleteMany({
            folder: folder._id,
            owner: req.user._id
        });

        const folderResult = await Folder.findByIdAndDelete(req.params.id);

        logger.info('Folder and notes deleted:', {
            folderId: folder._id,
            notesDeleted: notesResult.deletedCount,
            folderDeleted: !!folderResult
        });

        res.json({ 
            success: true,
            message: 'Folder and all associated notes permanently deleted',
            notesDeleted: notesResult.deletedCount
        });

    } catch (error) {
        logger.error('Error deleting folder:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error deleting folder',
            error: error.message
        });
    }
});

module.exports = router;