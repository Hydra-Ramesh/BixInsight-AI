const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Avatar upload configuration
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', 'avatars');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${req.userId}-${Date.now()}${ext}`);
    }
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    }
});

// Helper: format user response
const formatUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    company: user.company,
    avatar: user.avatar,
    createdAt: user.createdAt
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, company } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const user = new User({ name, email, password, company });
        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send welcome email (non-blocking)
        emailService.sendWelcomeEmail(name, email).catch(() => {});

        res.status(201).json({ token, user: formatUser(user) });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send login notification (non-blocking)
        emailService.sendLoginNotification(user.name, user.email).catch(() => {});

        res.json({ token, user: formatUser(user) });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        res.json({ user: formatUser(req.user) });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists
            return res.json({ message: 'If an account exists, an OTP has been sent.' });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        user.resetOtp = otp;
        user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await user.save();

        await emailService.sendOTPEmail(user.name, user.email, otp);

        res.json({ message: 'If an account exists, an OTP has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

        const user = await User.findOne({ email });
        if (!user || !user.resetOtp || !user.resetOtpExpiry) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        if (user.resetOtpExpiry < new Date()) {
            user.resetOtp = null;
            user.resetOtpExpiry = null;
            await user.save();
            return res.status(400).json({ message: 'OTP has expired. Request a new one.' });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Generate a short-lived reset token
        const resetToken = jwt.sign(
            { userId: user._id, purpose: 'reset' },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        // Clear OTP
        user.resetOtp = null;
        user.resetOtpExpiry = null;
        await user.save();

        res.json({ resetToken, message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: 'Reset token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
            if (decoded.purpose !== 'reset') throw new Error();
        } catch {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const user = await User.findById(decoded.userId);
        if (!user) return res.status(400).json({ message: 'User not found' });

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successfully. Please login.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/auth/profile — Update name and company
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, company } = req.body;
        const updates = {};

        if (name !== undefined) {
            if (name.trim().length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters' });
            updates.name = name.trim();
        }
        if (company !== undefined) updates.company = company.trim();

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
        res.json({ user: formatUser(user), message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/auth/profile/avatar — Upload profile picture
router.put('/profile/avatar', auth, avatarUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

        // Delete old avatar if exists
        const user = await User.findById(req.userId);
        if (user.avatar) {
            const oldPath = path.join(__dirname, '..', user.avatar);
            if (fs.existsSync(oldPath)) {
                try { fs.unlinkSync(oldPath); } catch {}
            }
        }

        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        user.avatar = avatarPath;
        await user.save();

        res.json({ user: formatUser(user), message: 'Avatar updated successfully' });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
