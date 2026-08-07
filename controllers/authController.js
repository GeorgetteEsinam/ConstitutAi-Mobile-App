// controllers/authController.js
// Handles signup, login, logout, token refresh, and password reset.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// ── Helpers ───────────────────────────────────────────────────
const signToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const signRefreshToken = (payload) =>
    jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

// ── Controllers ───────────────────────────────────────────────

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role = 'reader' } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password)
            return res.status(400).json({ error: 'Name, email and password are required' });

        // 2. Check for duplicate email
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ error: 'Email is already registered' });

        // 3. Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 4. Save new user to DB
        const newUser = await User.create({ name, email, password: hashedPassword, role });

        // 5. Issue tokens
        const token = signToken({ id: newUser.id, role: newUser.role });
        const refreshToken = signRefreshToken({ id: newUser.id });

        res.status(201).json({ token, refreshToken, user: { id: newUser.id, name, email, role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate required fields
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });

        // 2. Find user by email
        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        // 3. Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        // 4. Issue tokens
        const token        = signToken({ id: user._id, role: user.role });
        const refreshToken = signRefreshToken({ id: user._id });
        res.status(200).json({ token, refreshToken, user: { id: user._id, name: user.name, email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.logout = (req, res) => {
    // If using HTTP-only cookies, clear them here:
    // res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
};

exports.refreshToken = (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.status(400).json({ error: 'Refresh token is required' });

        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Issue a new access token
        const newAccessToken = signToken({ id: decoded.id, role: decoded.role });

        res.status(200).json({ token: newAccessToken });
    } catch (err) {
        if (err.name === 'TokenExpiredError')
            return res.status(401).json({ error: 'Refresh token expired – please log in again' });
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'No account with that email' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min
        await user.save();
        
        // TODO: Send resetToken via email (e.g. Nodemailer)
        console.log('Reset token:', resetToken); // For local testing

        res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password)
            return res.status(400).json({ error: 'Reset token and new password are required' });

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
        
        if (!user) return res.status(400).json({ error: 'Token is invalid or has expired' });
        
        user.password = await bcrypt.hash(password, 12);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCurrentUser = (req, res) => {
    res.status(200).json({ user: req.user });
};
