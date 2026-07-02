const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const CV = require('./models/CV');
const CoverLetter = require('./models/CoverLetter');

dotenv.config();
console.log('MONGODB_URI from env:', process.env.MONGODB_URI);

const app = express();

// Core middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());
app.set('view engine', 'ejs');

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'coa-tech-secret');
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.redirect('/login');
    }
};

// Middleware to restrict admin routes
const checkAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        const adminEmail = (process.env.ADMIN_EMAIL || 'coatechofficial@gmail.com').toLowerCase();

        if (!user || !user.email || user.email.toLowerCase() !== adminEmail) {
            return res.status(403).send('Access denied');
        }

        req.currentUser = user;
        next();
    } catch (err) {
        console.error('checkAdmin error:', err);
        return res.status(500).send('Server error');
    }
};

// Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const cvRoutes = require('./routes/cv');
app.use('/cv', checkAuth, cvRoutes);

const coverLetterRoutes = require('./routes/coverLetters');
app.use('/cover-letters', checkAuth, coverLetterRoutes);

const upgradeRoutes = require('./routes/upgrade');
app.use('/upgrade', checkAuth, upgradeRoutes);

const adminRoutes = require('./routes/admin');
app.use('/admin', checkAuth, checkAdmin, adminRoutes);

// Public pages
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/signup', (req, res) => {
    res.render('signup', { error: null, success: null });
});

app.get('/login', (req, res) => {
    res.render('login', { error: null, success: null });
});

// Forgot password pages
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { error: null, success: null });
});

app.post('/forgot-password', async (req, res) => {
    try {
        let { email } = req.body;
        email = (email || '').toLowerCase().trim();

        if (!email) {
            return res.render('forgot-password', {
                error: 'Please enter your email address.',
                success: null
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('forgot-password', {
                error: 'We could not find an account with that email. Please check and try again.',
                success: null
            });
        }

        return res.render('forgot-password', {
            error: null,
            success: 'We found your account. For now, please contact support at coatechofficial@gmail.com or WhatsApp +233 53 767 7748 to reset your password.'
        });
    } catch (err) {
        console.error('FORGOT PASSWORD ERROR:', err);
        return res.render('forgot-password', {
            error: 'Something went wrong. Please try again or contact support.',
            success: null
        });
    }
});

// Legal pages
app.get('/privacy', (req, res) => {
    res.render('privacy');
});

app.get('/terms', (req, res) => {
    res.render('terms');
});

// Protected dashboard
app.get('/dashboard', checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('cvs');
        if (!user) {
            return res.redirect('/login');
        }

        const adminEmail = (process.env.ADMIN_EMAIL || 'coatechofficial@gmail.com').toLowerCase();
        const isAdmin = (user.email || '').toLowerCase() === adminEmail;

        res.render('dashboard', { user, isAdmin });
    } catch (error) {
        console.error(error);
        return res.redirect('/login');
    }
});

// Database connection (MongoDB Atlas)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
      console.log('✅ Database connected to MongoDB Atlas');

      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
          console.log(`🚀 C.O.A. CV BUILDER running on http://localhost:${PORT}`);
      });
  })
  .catch((err) => {
      console.error('❌ Database Error:', err);
  });