const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const {
  sendSellerRequestNotice,
  sendSellerStatusEmail,
  sendPasswordResetEmail,
} = require('../utils/email');
const { notify } = require('../utils/notify');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, city } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, phone, city });
    const token = signToken(user._id);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken(user._id);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

// Request a reset link. Always responds with a generic success message —
// never reveals whether the email exists, to avoid email enumeration.
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const genericResponse = {
      message: 'If an account exists for that email, a reset link has been sent.',
    };
    if (!email) return res.json(genericResponse);

    const user = await User.findOne({ email });
    if (!user) return res.json(genericResponse); // don't reveal non-existence

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const frontendOrigin = (process.env.CLIENT_ORIGIN || 'http://localhost:4200')
      .split(',')[0]
      .trim();
    const resetUrl = `${frontendOrigin}/reset-password?token=${rawToken}`;
    sendPasswordResetEmail(user, resetUrl).catch(() => {});

    res.json(genericResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    user.password = password; // pre('save') hook hashes it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// A logged-in buyer applies to become a seller
exports.applyAsSeller = async (req, res) => {
  try {
    const { dealershipName } = req.body;
    const user = req.user;
    if (user.role === 'seller' && user.sellerStatus === 'approved') {
      return res.status(400).json({ message: 'You are already an approved seller' });
    }
    user.role = 'seller';
    user.sellerStatus = 'pending';
    if (dealershipName) user.dealershipName = dealershipName;
    await user.save();

    if (process.env.ADMIN_EMAIL) {
      sendSellerRequestNotice(process.env.ADMIN_EMAIL, user).catch(() => {});
    }
    const admins = await User.find({ role: 'admin' }).select('_id');
    admins.forEach((admin) =>
      notify(
        admin._id,
        'seller_applied',
        'New seller application',
        `${user.name} applied to become a seller.`,
        '/admin/pending-sellers'
      )
    );

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: list pending seller requests
exports.getPendingSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller', sellerStatus: 'pending' }).sort('-createdAt');
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: approve or reject a seller application
exports.decideSeller = async (req, res) => {
  try {
    const { decision } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved or rejected' });
    }
    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });
    seller.sellerStatus = decision;
    await seller.save();

    sendSellerStatusEmail(seller, decision === 'approved').catch(() => {});
    notify(
      seller._id,
      decision === 'approved' ? 'seller_approved' : 'seller_rejected',
      decision === 'approved' ? 'Seller application approved' : 'Seller application declined',
      decision === 'approved'
        ? 'You can now list cars from your Seller Dashboard.'
        : 'Your seller application was not approved this time.',
      decision === 'approved' ? '/seller' : '/sell'
    );

    res.json({ user: seller });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
