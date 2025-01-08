// notes.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Note = require('../models/notes');
const { logger } = require('../utils/logger');
const router = express.Router();

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Not authenticated' });
};

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const notes = await Note.find({ 
            owner: req.user._id, 
        }).populate('folder', 'name');
        res.json(notes);
    } catch (error) {
        logger.error('Error fetching notes', { error: error.message });
        res.status(500).json({ message: 'Error fetching notes' });
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { title, body, folder } = req.body;
        const note = new Note({
            title,
            body,
            folder: folder || null,
            owner: req.user._id
        });
        await note.save();
        await note.populate('folder', 'name');
        logger.info('Note created', { 
            noteId: note._id,
            folder: folder || 'no folder'
        });
        res.status(201).json(note);
    } catch (error) {
        logger.error('Error creating note', { error: error.message });
        res.status(500).json({ message: 'Error creating note' });
    }
});

router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        const { title, body, folder } = req.body;
        note.title = title;
        note.body = body;
        note.folder = folder || null;
        await note.save();
        await note.populate('folder', 'name');

        res.json(note);
    } catch (error) {
        logger.error('Error updating note', { error: error.message });
        res.status(500).json({ message: 'Error updating note' });
    }
});

// Delete
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        // Convert string ID to MongoDB ObjectId
        const noteId = new mongoose.Types.ObjectId(req.params.id);
        const userId = new mongoose.Types.ObjectId(req.user._id);

        // First verify the note exists
        const noteExists = await Note.findOne({
            _id: noteId,
            owner: userId
        });

        if (!noteExists) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        const result = await Note.deleteOne({
            _id: noteId,
            owner: userId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Note not deleted'
            });
        }

        res.json({ 
            success: true,
            message: 'Note deleted successfully'
        });

    } catch (error) {
        console.error('Error in delete operation:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting note',
            error: error.message
        });
    }
});

module.exports = router;