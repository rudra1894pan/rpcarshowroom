const express = require('express');
const router = express.Router();
const {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
  applyAsSeller,
  getPendingSellers,
  decideSeller,
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/apply-seller', protect, applyAsSeller);

// Admin: manage seller applications
router.get('/sellers/pending', protect, adminOnly, getPendingSellers);
router.put('/sellers/:id/decide', protect, adminOnly, decideSeller);

module.exports = router;
