const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// SIGNUP
router.post('/signup', async (req, res) => {
    try {
        const { fullname, email, phone, password, confirmPassword } = req.body;

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.render('signup', { 
                error: 'Passwords do not match.',
                success: null
            });
        }

        // Check password length
        if (!password || password.length < 6) {
            return res.render('signup', {
                error: 'Password must be at least 6 characters long.',
                success: null
            });
        }

        // Disallow spaces in password
        if (/\s/.test(password)) {
            return res.render('signup', {
                error: 'Password cannot contain spaces.',
                success: null
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('signup', { 
                error: 'Email already registered. Please login.',
                success: null
            });
        }

        // Create new user
        const newUser = await User.create({
            fullname,
            email,
            phone,
            password
        });

        // Create token
        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET || 'coa-tech-secret',
            { expiresIn: '7d' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Redirect to dashboard
        res.redirect('/dashboard');

    } catch (error) {
        console.error(error);
        return res.render('signup', { 
            error: 'Something went wrong. Please try again.',
            success: null
        });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { 
                error: 'Email not found. Please sign up.',
                success: null
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { 
                error: 'Incorrect password. Please try again.',
                success: null
            });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'coa-tech-secret',
            { expiresIn: '7d' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Redirect to dashboard
        res.redirect('/dashboard');

    } catch (error) {
        console.error(error);
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