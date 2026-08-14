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

        // Pricing
        const normalAmountGHS = 40;

        // Promo handling (normalize: remove spaces, uppercase)
        const rawPromo = (req.body.promoCode || '').toString();
        const enteredPromo = rawPromo.replace(/\s+/g, '').trim().toUpperCase();

        const promoFromEnv = (process.env.PROMO_CODE || '').replace(/\s+/g, '').trim().toUpperCase();
        const promoExpiry = process.env.PROMO_EXPIRY ? new Date(process.env.PROMO_EXPIRY) : null;

        const discountAmountGHS = Number(process.env.PROMO_DISCOUNT_AMOUNT_GHS || 0);

        let amountGHS = normalAmountGHS;
        let promoCodeUsed = null;

        const now = new Date();
        const promoValid =
            promoFromEnv &&
            enteredPromo &&
            enteredPromo === promoFromEnv &&
            discountAmountGHS > 0 &&
            (!promoExpiry || now <= promoExpiry);

        if (promoValid) {
            amountGHS = discountAmountGHS;
            promoCodeUsed = enteredPromo;
        }

        const amountPesewas = amountGHS * 100;

        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: user.email,
                amount: amountPesewas,
                currency: 'GHS',
                callback_url: process.env.PAYSTACK_CALLBACK_URL,
                metadata: {
                    userId: user._id.toString(),
                    promoCodeUsed: promoCodeUsed
                }
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

        return res.redirect(data.data.authorization_url);

    } catch (err) {
        console.error('Paystack init exception:', err.response ? err.response.data : err);
        return res.redirect('/upgrade?status=failed');
    }
});

// GET /upgrade/paystack/callback – Paystack redirects user here
router.get('/paystack/callback', async (req, res) => {
    try {
        const reference = req.query.reference;

        if (!reference) {
            return res.redirect('/upgrade?status=failed');
        }

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

        // ✅ Get userId from metadata
        const userId = data.data.metadata.userId;
        const promoCodeUsed = data.data.metadata ? data.data.metadata.promoCodeUsed : null;

        if (!userId) {
            console.error('No userId found in metadata');
            return res.redirect('/upgrade?status=failed');
        }

        const user = await User.findById(userId);

        if (!user) {
            console.error('User not found');
            return res.redirect('/upgrade?status=failed');
        }

        // ✅ Set premium for 1 month
        const now = new Date();
        const expiry = new Date(now);
        expiry.setMonth(expiry.getMonth() + 1);

        user.isPremium = true;
        user.premiumExpiry = expiry;

        if (promoCodeUsed) {
    user.promoCodeUsed = promoCodeUsed;
}

        await user.save();

        return res.redirect('/upgrade?status=success');
    } catch (err) {
        console.error('Paystack callback exception:', err.response ? err.response.data : err);
        return res.redirect('/upgrade?status=failed');
    }
});

module.exports = router;