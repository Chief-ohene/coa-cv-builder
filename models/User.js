const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, 'Please provide your full name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters long']
    },

    isPremium: {
        type: Boolean,
        default: false
    },
    premiumExpiry: {
        type: Date,
        default: null
    },

    // ✅ Track promo usage (for collaborations/referrals)
    promoCodeUsed: {
        type: String,
        default: null
    },

    cvs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CV'
    }],

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving (Mongoose friendly)
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);