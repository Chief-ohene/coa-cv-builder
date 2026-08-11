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

    // Education (multiple entries: University, SHS, etc.)
    education: [{
        school: String,
        degree: String,
        location: String,
        startYear: String,
        endYear: String,
        details: String
    }],

    // Experience (single entry for now)
    experience: {
        company: String,
        role: String,
        location: String,
        startYear: String,
        endYear: String,
        details: String
    },

    // Other sections
    skills: String,
    languages: String,
    certifications: String,

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CV', cvSchema);