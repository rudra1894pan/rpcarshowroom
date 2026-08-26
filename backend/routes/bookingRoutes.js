const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getSellerBookings,
  getAllBookings,
  decideBooking,
  updateBookingStatus,
} = require('../controllers/bookingController');

router.use(protect);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/seller', getSellerBookings);
router.get('/', adminOnly, getAllBookings);
router.put('/:id/decide', decideBooking);
router.put('/:id/status', updateBookingStatus);

module.exports = router;
