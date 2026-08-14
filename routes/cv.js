const express = require('express');
const router = express.Router();
const CV = require('../models/CV');
const User = require('../models/User');

/* =============================
   CREATE CV
============================= */

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
            expCompany,
            expRole,
            expLocation,
            expStartYear,
            expEndYear,
            expDetails,
            skills,
            languages,
            certifications
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
            education: req.body.education || [],
            experience: {
                company: expCompany,
                role: expRole,
                location: expLocation,
                startYear: expStartYear,
                endYear: expEndYear,
                details: expDetails
            },
            skills,
            languages,
            certifications
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

/* =============================
   LIST CVs
============================= */

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

/* =============================
   EDIT CV
============================= */

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
        const cv = await CV.findOne({ _id: req.params.id, user: req.userId });

        if (!cv) return res.redirect('/cv/my-cvs');

        cv.fullName = req.body.fullName;
        cv.jobTitle = req.body.jobTitle;
        cv.summary = req.body.summary;
        cv.phone = req.body.phone;
        cv.email = req.body.email;
        cv.location = req.body.location;

        cv.education = req.body.education || [];

        cv.experience = {
            company: req.body.expCompany,
            role: req.body.expRole,
            location: req.body.expLocation,
            startYear: req.body.expStartYear,
            endYear: req.body.expEndYear,
            details: req.body.expDetails
        };

        cv.skills = req.body.skills;
        cv.languages = req.body.languages;
        cv.certifications = req.body.certifications;

        await cv.save();

        return res.redirect('/cv/my-cvs');

    } catch (err) {
        console.error(err);
        return res.redirect('/cv/my-cvs');
    }
});

/* =============================
   PREVIEW CV
============================= */

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const cv = await CV.findOne({ _id: req.params.id, user: req.userId });

        if (!cv) return res.redirect('/cv/my-cvs');

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

        let selectedTemplate = 'classic';

        if (isPremium && req.query.tpl) {
            selectedTemplate = req.query.tpl;
        }

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