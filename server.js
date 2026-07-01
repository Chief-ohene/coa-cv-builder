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

// Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const cvRoutes = require('./routes/cv');
// All /cv/* routes require login
app.use('/cv', checkAuth, cvRoutes);
const coverLetterRoutes = require('./routes/coverLetters');
app.use('/cover-letters', checkAuth, coverLetterRoutes);
const upgradeRoutes = require('./routes/upgrade');
app.use('/upgrade', checkAuth, upgradeRoutes);

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

// Protected dashboard
app.get('/dashboard', checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('cvs');
        if (!user) {
            return res.redirect('/login');
        }
        res.render('dashboard', { user });
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