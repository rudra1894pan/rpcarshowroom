const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createReview,
  getCarReviews,
  getSellerReviews,
  deleteReview,
} = require('../controllers/reviewController');

router.get('/car/:carId', getCarReviews); // public
router.get('/seller/mine', protect, getSellerReviews);
router.post('/', protect, createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
