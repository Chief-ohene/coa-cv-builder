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

// GET /admin/reset-password – show reset form
router.get('/reset-password', (req, res) => {
    return res.render('admin-reset-password', {
        admin: req.currentUser,
        error: null,
        success: null
    });
});

// POST /admin/reset-password – perform reset
router.post('/reset-password', async (req, res) => {
    try {
        let { email, newPassword, confirmPassword } = req.body;
        email = (email || '').toLowerCase().trim();

        if (!email || !newPassword || !confirmPassword) {
            return res.render('admin-reset-password', {
                admin: req.currentUser,
                error: 'Please fill in all fields.',
                success: null
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render('admin-reset-password', {
                admin: req.currentUser,
                error: 'Passwords do not match.',
                success: null
            });
        }

        if (newPassword.length < 6) {
            return res.render('admin-reset-password', {
                admin: req.currentUser,
                error: 'Password must be at least 6 characters long.',
                success: null
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('admin-reset-password', {
                admin: req.currentUser,
                error: 'No user found with that email address.',
                success: null
            });
        }

        // Set new password; pre-save hook in User.js will hash it
        user.password = newPassword;
        await user.save();

        return res.render('admin-reset-password', {
            admin: req.currentUser,
            error: null,
            success: `Password for ${email} has been reset. Share the new password with the user securely.`
        });
    } catch (err) {
        console.error('ADMIN RESET PASSWORD ERROR:', err);
        return res.render('admin-reset-password', {
            admin: req.currentUser,
            error: 'Something went wrong. Please try again.',
            success: null
        });
    }
});

module.exports = router;