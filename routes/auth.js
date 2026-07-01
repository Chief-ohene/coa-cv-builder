const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// SIGNUP
router.post('/signup', async (req, res) => {
    try {
        let { fullname, email, phone, password, confirmPassword, terms } = req.body;

        // Normalize email
        email = (email || '').toLowerCase().trim();

        // Basic required fields check
        if (!fullname || !email || !phone || !password || !confirmPassword) {
            return res.render('signup', {
                error: 'Please fill in all required fields.',
                success: null
            });
        }

        // Terms checkbox (just in case browser validation is bypassed)
        if (!terms) {
            return res.render('signup', {
                error: 'You must agree to the Terms of Service and Privacy Policy.',
                success: null
            });
        }

        // Password match
        if (password !== confirmPassword) {
            return res.render('signup', {
                error: 'Passwords do not match.',
                success: null
            });
        }

        // Password length
        if (!password || password.length < 6) {
            return res.render('signup', {
                error: 'Password must be at least 6 characters long.',
                success: null
            });
        }

        // Email already used?
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('signup', {
                error: 'Email already registered. Please login.',
                success: null
            });
        }

        // Create user
        const newUser = await User.create({
            fullname,
            email,
            phone,
            password
        });

        // Create JWT token
        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET || 'coa-tech-secret',
            { expiresIn: '7d' }
        );

        // Set auth cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.redirect('/dashboard');
    } catch (err) {
        console.error('SIGNUP ERROR:', err);

        // Duplicate email from Mongo (just in case)
        if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
            return res.render('signup', {
                error: 'Email already registered. Please login.',
                success: null
            });
        }

        return res.render('signup', {
            error: 'Something went wrong. Please check your inputs and try again.',
            success: null
        });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;

        email = (email || '').toLowerCase().trim();

        if (!email || !password) {
            return res.render('login', {
                error: 'Please enter both email and password.',
                success: null
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', {
                error: 'Email not found. Please sign up.',
                success: null
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', {
                error: 'Incorrect password. Please try again.',
                success: null
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'coa-tech-secret',
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.redirect('/dashboard');
    } catch (err) {
        console.error('LOGIN ERROR:', err);
        return res.render('login', {
            error: 'Something went wrong. Please try again.',
            success: null
        });
    }
});

// LOGOUT
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

module.exports = router;