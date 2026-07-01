const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Top-level info
    fullName: String,
    jobTitle: String,
    summary: String,
    phone: String,
    email: String,
    location: String,

    // Structured education (single entry for now)
    education: {
        school: String,
        degree: String,
        location: String,
        startYear: String,
        endYear: String,
        details: String
    },

    // Structured experience (single entry for now)
    experience: {
        company: String,
        role: String,
        location: String,
        startYear: String,
        endYear: String,
        details: String
    },

    // Skills can stay as free text for now
    skills: String,

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const CV = mongoose.model('CV', cvSchema);

module.exports = CV;