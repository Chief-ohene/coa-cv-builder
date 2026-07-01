const express = require('express');
const router = express.Router();
const CoverLetter = require('../models/CoverLetter');
const CV = require('../models/CV');
const User = require('../models/User');

// helper to check if free user exceeded monthly limit
async function hasExceededFreeLimit(userId, isPremium) {
    if (isPremium) return false; // no limit for premium

    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const count = await CoverLetter.countDocuments({
        user: userId,
        createdAt: { $gte: monthAgo }
    });

    return count >= 1; // 1 free cover letter per month for free users
}

// GET /cover-letters/new/:cvId – show builder form
router.get('/new/:cvId', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const cv = await CV.findOne({ _id: req.params.cvId, user: req.userId });

        if (!cv) {
            return res.redirect('/cv/my-cvs');
        }

        const limitReached = await hasExceededFreeLimit(req.userId, user.isPremium);

        let error = null;
        if (limitReached) {
            error = 'You have used your 1 free cover letter this month. Upgrade to Premium to create unlimited cover letters.';
        }

        return res.render('cover-letter-builder', {
            user,
            cv,
            error
        });
    } catch (err) {
        console.error(err);
        return res.redirect('/cv/my-cvs');
    }
});

// POST /cover-letters/new/:cvId – save new cover letter
router.post('/new/:cvId', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const cv = await CV.findOne({ _id: req.params.cvId, user: req.userId });

        if (!cv) {
            return res.redirect('/cv/my-cvs');
        }

        const limitReached = await hasExceededFreeLimit(req.userId, user.isPremium);

        if (limitReached) {
            return res.render('cover-letter-builder', {
                user,
                cv,
                error: 'You have used your 1 free cover letter this month. Upgrade to Premium to create unlimited cover letters.'
            });
        }

        const { companyName, positionTitle, body } = req.body;

        if (!companyName || !positionTitle || !body) {
            return res.render('cover-letter-builder', {
                user,
                cv,
                error: 'Please fill in company name, position and cover letter body.'
            });
        }

        await CoverLetter.create({
            user: req.userId,
            cv: cv._id,
            companyName,
            positionTitle,
            body
        });

        return res.redirect('/cover-letters/my');
    } catch (err) {
        console.error(err);
        return res.redirect('/cv/my-cvs');
    }
});

// GET /cover-letters/my – list all cover letters for this user
router.get('/my', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const letters = await CoverLetter.find({ user: req.userId })
            .sort({ createdAt: -1 })
            .populate('cv');

        return res.render('my-cover-letters', { user, letters });
    } catch (err) {
        console.error(err);
        return res.redirect('/dashboard');
    }
});

// GET /cover-letters/:id – preview a single letter
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const letter = await CoverLetter.findOne({ _id: req.params.id, user: req.userId })
            .populate('cv');

        if (!letter) {
            return res.redirect('/cover-letters/my');
        }

        return res.render('cover-letter-preview', { user, letter });
    } catch (err) {
        console.error(err);
        return res.redirect('/cover-letters/my');
    }
});

module.exports = router;