const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Folder name is required'],
            trim: true,
            lowercase: true,
            minlength: [2, 'Folder name must be at least 2 characters long'],
            maxlength: [50, 'Folder name cannot exceed 50 characters'],
            validate: {
                validator: function (v) {
                    return /^[a-zA-Z0-9\s]+$/.test(v);
                },
                message: 'Folder name can only contain letters, numbers, and spaces.'
            }
        },

        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder',
            default: null,
            validate: {
                validator: async function(value) {
                    if (value === null) return true;
                    const parentFolder = await this.model('Folder').findById(value);
                    return parentFolder !== null;
                },
                message: 'Parent folder does not exist'
            }
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Folder must have an owner']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, 'Description cannot exceed 200 characters']
        }
    },
    {
        timestamps: { 
            createdAt: 'created_at', 
            updatedAt: 'updated_at' 
        },
        versionKey: false
    }
);

folderSchema.index({ name: 1, owner: 1 }, { unique: true });

// Pre-save hook to ensure unique folder names per user
folderSchema.pre('save', async function(next) {
    const existingFolder = await this.model('Folder').findOne({
        name: this.name,
        owner: this.owner,
        _id: { $ne :this._id }
    });

    if (existingFolder) {
        next(new Error('A folder with this name already exists'));
    } else {
        next();
    }
});

module.exports = mongoose.model('Folder', folderSchema);