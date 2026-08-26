const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, adminOnly, sellerOrAdmin } = require('../middleware/auth');
const {
  createCar,
  getCars,
  getCar,
  getMyCars,
  updateCar,
  deleteCar,
  removeImage,
  getPendingCars,
  getAllCarsAdmin,
  decideCar,
} = require('../controllers/carController');

// Public
router.get('/', getCars);

// Seller/admin — specific routes before the /:id catch-all
router.get('/mine', protect, sellerOrAdmin, getMyCars);
router.post('/', protect, sellerOrAdmin, upload.array('images', 8), createCar);

// Admin moderation
router.get('/admin/pending', protect, adminOnly, getPendingCars);
router.get('/admin/all', protect, adminOnly, getAllCarsAdmin);
router.put('/admin/:id/decide', protect, adminOnly, decideCar);

router.get('/:id', getCar);
router.put('/:id', protect, sellerOrAdmin, upload.array('images', 8), updateCar);
router.delete('/:id', protect, sellerOrAdmin, deleteCar);
router.put('/:id/remove-image', protect, sellerOrAdmin, removeImage);

module.exports = router;
