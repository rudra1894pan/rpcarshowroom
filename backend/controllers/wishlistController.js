const Wishlist = require('../models/Wishlist');

exports.getMine = async (req, res) => {
  try {
    const items = await Wishlist.find({ user: req.user._id })
      .populate('car')
      .sort('-createdAt');
    // Filter out any entries whose car was since deleted.
    res.json(items.filter((i) => i.car));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { carId } = req.body;
    if (!carId) return res.status(400).json({ message: 'carId is required' });

    // Idempotent: adding an already-wishlisted car just returns the existing entry.
    const existing = await Wishlist.findOne({ user: req.user._id, car: carId });
    if (existing) return res.json(existing);

    const item = await Wishlist.create({ user: req.user._id, car: carId });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Wishlist.findOne({ user: req.user._id, car: req.body.carId });
      return res.json(existing);
    }
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.user._id, car: req.params.carId });
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
