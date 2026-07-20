const express = require('express');
const router = express.Router();
const CV = require('../models/CV');
const User = require('../models/User');

// =============================
// CREATE CV
// =============================

router.get('/create', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        return res.render('cv-builder', { user, error: null });
    } catch (err) {
        console.error(err);
        return res.redirect('/dashboard');
    }
});

router.post('/create', async (req, res) => {
    try {
        const {
            fullName,
            jobTitle,
            summary,
            phone,
            email,
            location,
            eduSchool,
            eduDegree,
            eduLocation,
            eduStartYear,
            eduEndYear,
            eduDetails,
            expCompany,
            expRole,
            expLocation,
            expStartYear,
            expEndYear,
            expDetails,
            skills
        } = req.body;

        if (!fullName || !jobTitle || !email) {
            const user = await User.findById(req.userId);
            return res.render('cv-builder', {
                user,
                error: 'Please fill in at least your full name, professional title, and email.'
            });
        }

        const cv = await CV.create({
            user: req.userId,
            fullName,
            jobTitle,
            summary,
            phone,
            email,
            location,
            education: {
                school: eduSchool,
                degree: eduDegree,
                location: eduLocation,
                startYear: eduStartYear,
                endYear: eduEndYear,
                details: eduDetails
            },
            experience: {
                company: expCompany,
                role: expRole,
                location: expLocation,
                startYear: expStartYear,
                endYear: expEndYear,
                details: expDetails
            },
            skills
        });

        await User.findByIdAndUpdate(req.userId, {
            $push: { cvs: cv._id }
        });

        return res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        return res.redirect('/dashboard');
    }
});

// =============================
// LIST CVs
// =============================

router.get('/my-cvs', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const cvs = await CV.find({ user: req.userId }).sort({ createdAt: -1 });

        const selectedTemplate = req.query.tpl || 'classic';

        return res.render('my-cvs', { user, cvs, selectedTemplate });
    } catch (err) {
        console.error(err);
        return res.redirect('/dashboard');
    }
});

// =============================
// EDIT CV
// =============================

router.get('/:id/edit', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const cv = await CV.findOne({ _id: req.params.id, user: req.userId });

        if (!cv) return res.redirect('/cv/my-cvs');

        return res.render('cv-edit', { user, cv, error: null });

    } catch (err) {
        console.error(err);
        return res.redirect('/cv/my-cvs');
    }
});

router.post('/:id/edit', async (req, res) => {
    try {
        await CV.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            req.body
        );

        return res.redirect('/cv/my-cvs');

    } catch (err) {
        console.error(err);
        return res.redirect('/cv/my-cvs');
    }
});

// =============================
// PREVIEW CV WITH TEMPLATE
// =============================

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const cv = await CV.findOne({ _id: req.params.id, user: req.userId });

        if (!cv) return res.redirect('/cv/my-cvs');

        // Premium expiry enforcement
        let isPremium = false;

        if (user.isPremium && user.premiumExpiry) {
            const now = new Date();
            if (new Date(user.premiumExpiry) > now) {
                isPremium = true;
            } else {
                user.isPremium = false;
                await user.save();
                isPremium = false;
            }
        }

        // Read template from query
        let selectedTemplate = 'classic';

        if (isPremium && req.query.tpl) {
            selectedTemplate = req.query.tpl;
        }

        // Render correct template
        if (selectedTemplate === 'modern') {
            return res.render('cv-preview-modern', { user, cv, isPremium });
        }

        if (selectedTemplate === 'compact') {
            return res.render('cv-preview-compact', { user, cv, isPremium });
        }

        if (selectedTemplate === 'executive') {
            return res.render('cv-preview-executive', { user, cv, isPremium });
        }

        if (selectedTemplate === 'minimal') {
            return res.render('cv-preview-minimal', { user, cv, isPremium });
        }

        return res.render('cv-preview', { user, cv, isPremium });

    } catch (err) {
        console.error(err);
        return res.redirect('/cv/my-cvs');
    }
});

module.exports = router;