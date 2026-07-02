const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CV = require('../models/CV');
const CoverLetter = require('../models/CoverLetter');

// GET /admin – simple admin dashboard
router.get('/', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const premiumUsers = await User.countDocuments({ isPremium: true });
        const freeUsers = totalUsers - premiumUsers;

        const totalCVs = await CV.countDocuments();
        const totalCoverLetters = await CoverLetter.countDocuments();

        const latestUsers = await User.find({})
            .sort({ createdAt: -1 })
            .limit(10);

        return res.render('admin', {
            admin: req.currentUser,
            stats: {
                totalUsers,
                premiumUsers,
                freeUsers,
                totalCVs,
                totalCoverLetters
            },
            latestUsers
        });
    } catch (err) {
        console.error('ADMIN ERROR:', err);
        return res.status(500).send('Server error');
    }
});

module.exports = router;