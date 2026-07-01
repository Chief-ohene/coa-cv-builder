const mongoose = require('mongoose');

const coverLetterSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cv: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CV',
        required: true
    },
    companyName: String,
    positionTitle: String,
    body: String, // main letter text
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const CoverLetter = mongoose.model('CoverLetter', coverLetterSchema);

module.exports = CoverLetter;