const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/User');

// GET /upgrade – show upgrade page
router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        const status = req.query.status || null;
        let message = null;

        if (status === 'success') {
            message = 'Your account has been upgraded to Premium.';
        } else if (status === 'failed') {
            message = 'Payment was not successful. Please try again.';
        }

        return res.render('upgrade', {
            user,
            message
        });
    } catch (err) {
        console.error(err);
        return res.redirect('/dashboard');
    }
});

// POST /upgrade/paystack/initiate – start Paystack payment
router.post('/paystack/initiate', async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        const amountGHS = 40; // monthly price
        const amountPesewas = amountGHS * 100; // Paystack amount in kobo/pesewas

        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: user.email,
                amount: amountPesewas,
                currency: 'GHS',
                callback_url: process.env.PAYSTACK_CALLBACK_URL
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = response.data;

        if (!data.status) {
            console.error('Paystack init error:', data);
            return res.redirect('/upgrade?status=failed');
        }

        // Redirect user to Paystack checkout page
        return res.redirect(data.data.authorization_url);
    } catch (err) {
        console.error('Paystack init exception:', err.response ? err.response.data : err);
        return res.redirect('/upgrade?status=failed');
    }
});

// GET /upgrade/paystack/callback – Paystack redirects user here after payment
router.get('/paystack/callback', async (req, res) => {
    try {
        const reference = req.query.reference;
        if (!reference) {
            return res.redirect('/upgrade?status=failed');
        }

        // Verify transaction
        const verifyResponse = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            }
        );

        const data = verifyResponse.data;

        if (!data.status || data.data.status !== 'success') {
            console.error('Paystack verify failed:', data);
            return res.redirect('/upgrade?status=failed');
        }

        // Payment successful – upgrade user
        // For now: 1 month premium
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.redirect('/login');
        }

        const now = new Date();
        const expiry = new Date(now);
        expiry.setMonth(expiry.getMonth() + 1);

        user.isPremium = true;
        user.premiumExpiry = expiry;
        await user.save();

        return res.redirect('/upgrade?status=success');
    } catch (err) {
        console.error('Paystack callback exception:', err.response ? err.response.data : err);
        return res.redirect('/upgrade?status=failed');
    }
});

module.exports = router;