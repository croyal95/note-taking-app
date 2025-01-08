const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Note title is required'],
            trim: true,
            minlength: [1, 'Title must be at least 1 character long'],
            maxlength: [200, 'Title cannot exceed 200 characters']
        },
        body: {
            type: String,
            default: '',
            trim: true,
            maxlength: [10000, 'Note body cannot exceed 10,000 characters']
        },
        folder: {
            type: Schema.Types.ObjectId,
            ref: 'Folder',
            default: null
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Note must have an owner']
        },
    },
    {
        timestamps: true,
        versionKey: false
    }
);

noteSchema.index({ owner: 1, folder: 1 });

module.exports = mongoose.model('Note', noteSchema);