const Review = require('../models/Review');
const Car = require('../models/Car');
const { notify } = require('../utils/notify');

exports.createReview = async (req, res) => {
  try {
    const { car: carId, rating, comment } = req.body;
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const existing = await Review.findOne({ car: carId, buyer: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this car' });
    }

    const review = await Review.create({
      car: carId,
      seller: car.seller,
      buyer: req.user._id,
      rating,
      comment,
    });
    const populated = await review.populate('buyer', 'name');

    notify(
      car.seller,
      'review_received',
      'New review received',
      `${req.user.name} left a ${rating}-star review on ${car.title}.`,
      '/seller/reviews'
    );

    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this car' });
    }
    res.status(400).json({ message: err.message });
  }
};

// Public: all reviews for a car, plus average rating
exports.getCarReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ car: req.params.carId })
      .populate('buyer', 'name')
      .sort('-createdAt');
    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    res.json({ reviews, avgRating, count: reviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Seller: reviews across all their cars
exports.getSellerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.user._id })
      .populate('buyer', 'name')
      .populate('car', 'title')
      .sort('-createdAt');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    const isOwner = review.buyer.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
