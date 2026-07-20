const express = require('express');
const router = express.Router();
const CV = require('../models/CV');
const User = require('../models/User');

// GET /cv/create – show CV builder form
router.get('/create', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        return res.render('cv-builder', { user, error: null });
    } catch (err) {
        console.error(err);
        return res.redirect('/dashboard');
    }
});

// POST /cv/create – save new CV
router.post('/create', async (req, res) => {
    try {
        const {
            fullName,
            jobTitle,
            summary,
            phone,
            email,
            location,
            // education fields
            eduSchool,
            eduDegree,
            eduLocation,
            eduStartYear,
            eduEndYear,
            eduDetails,
            // experience fields
            expCompany,
            expRole,
            expLocation,
            expStartYear,
            expEndYear,
            expDetails,
            // skills
            skills
        } = req.body;

        // Basic validation
        if (!fullName || !jobTitle || !email) {
            const user = await User.findById(req.userId);
            return res.render('cv-builder', {
                user,
                error: 'Please fill in at least your full name, professional title, and email.'
            });
        }

        const education = {
            school: eduSchool,
            degree: eduDegree,
            location: eduLocation,
            startYear: eduStartYear,
            endYear: eduEndYear,
            details: eduDetails
        };

        const experience = {
            company: expCompany,
            role: expRole,
            location: expLocation,
            startYear: expStartYear,
            endYear: expEndYear,
            details: expDetails
        };

        const cv = await CV.create({
            user: req.userId,
            fullName,
            jobTitle,
            summary,
            phone,
            email,
            location,
            education,
            experience,
            skills
        });

        // Attach CV to user
        await User.findByIdAndUpdate(req.userId, {
            $push: { cvs: cv._id }
        });

        return res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        try {
            const user = await User.findById(req.userId);
            return res.render('cv-builder', {
                user,
                error: 'Could not save CV. Please try again.'
            });
        } catch (innerErr) {
            console.error(innerErr);
            return res.redirect('/dashboard');
        }
    }
});

// GET /cv/my-cvs – list all CVs for this user
router.get('/my-cvs', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const cvs = await CV.find({ user: req.userId }).sort({ createdAt: -1 });

        return res.render('my-cvs', { user, cvs });
    } catch (err) {
        console.error(err);
        return res.redirect('/dashboard');
    }
});

// GET /cv/:id/edit – show edit form
router.get('/:id/edit', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const cv = await CV.findOne({ _id: req.params.id, user: req.userId });

        if (!cv) {
            return res.redirect('/cv/my-cvs');
        }

        return res.render('cv-edit', { user, cv, error: null });
    } catch (err) {
        console.error(err);
        return res.redirect('/cv/my-cvs');
    }
});

// POST /cv/:id/edit – save changes
router.post('/:id/edit', async (req, res) => {
    try {
        const {
            fullName,
            jobTitle,
            summary,
            phone,
            email,
            location,
            // education fields
            eduSchool,
            eduDegree,
            eduLocation,
            eduStartYear,
            eduEndYear,
            eduDetails,
            // experience fields
            expCompany,
            expRole,
            expLocation,
            expStartYear,
            expEndYear,
            expDetails,
            // skills
            skills
        } = req.body;

        if (!fullName || !jobTitle || !email) {
            const user = await User.findById(req.userId);
            const cv = await CV.findOne({ _id: req.params.id, user: req.userId });
            return res.render('cv-edit', {
                user,
                cv,
                error: 'Please fill in at least your full name, professional title, and email.'
            });
        }

        const education = {
            school: eduSchool,
            degree: eduDegree,
            location: eduLocation,
            startYear: eduStartYear,
            endYear: eduEndYear,
            details: eduDetails
        };

        const experience = {
            company: expCompany,
            role: expRole,
            location: expLocation,
            startYear: expStartYear,
            endYear: expEndYear,
            details: expDetails
        };

        await CV.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            {
                fullName,
                jobTitle,
                summary,
                phone,
                email,
                location,
                education,
                experience,
                skills
            }
        );

        return res.redirect('/cv/my-cvs');
    } catch (err) {
        console.error(err);
        return res.redirect('/cv/my-cvs');
    }
});

// GET /cv/:id – preview with template selection
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const cv = await CV.findOne({ _id: req.params.id, user: req.userId });

        if (!cv) {
            return res.redirect('/cv/my-cvs');
        }

        let isPremium = false;

if (user.isPremium && user.premiumExpiry) {
    const now = new Date();

    if (new Date(user.premiumExpiry) > now) {
        isPremium = true;
    } else {
        // Premium expired — auto downgrade
        user.isPremium = false;
        await user.save();
        isPremium = false;
    }
}
        const selectedTemplate = (req.query.tpl === 'modern' && isPremium) ? 'modern' : 'classic';

        if (selectedTemplate === 'modern') {
            return res.render('cv-preview-modern', {
                user,
                cv,
                isPremium,
                selectedTemplate
            });
        } else {
            return res.render('cv-preview', {
                user,
                cv,
                isPremium,
                selectedTemplate
            });
        }
    } catch (err) {
        console.error(err);
        return res.redirect('/cv/my-cvs');
    }
});

module.exports = router;