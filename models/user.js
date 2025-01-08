const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema(
    {
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
        },

    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
        },

    lastLogin: {
        type: Date,
        default: null
        }
    },

    {
    timestamps: true,
    },
);

// Pre-save hook for password hashing
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
        try {
            const salt = await bcrypt.genSalt(12);
            this.password = await bcrypt.hash(this.password, salt);
            next();
    } catch (error) {
    next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Static method to find by email and check account status
userSchema.statics.findByEmail = function(email) {
    return this.findOne({
        email: email.toLowerCase(),
        accountStatus: 'active'
    });
};

module.exports = mongoose.model('User', userSchema);