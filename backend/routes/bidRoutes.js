const express = require('express');
const router = express.Router();
const { protect, sellerOrAdmin } = require('../middleware/auth');
const {
  getSummary,
  placeBid,
  getMyBids,
  getReceived,
  acceptBid,
  rejectBid,
  withdrawBid,
} = require('../controllers/bidController');

router.get('/car/:carId/summary', getSummary); // public
router.post('/car/:carId', protect, placeBid);
router.get('/my', protect, getMyBids);
router.get('/received', protect, sellerOrAdmin, getReceived);
router.put('/:id/accept', protect, sellerOrAdmin, acceptBid);
router.put('/:id/reject', protect, sellerOrAdmin, rejectBid);
router.put('/:id/withdraw', protect, withdrawBid);

module.exports = router;
