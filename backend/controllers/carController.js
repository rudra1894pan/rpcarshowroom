const Car = require('../models/Car');
const User = require('../models/User');
const { notify } = require('../utils/notify');

exports.createCar = async (req, res) => {
  try {
    const images = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const insurance = {
      type: req.body.insuranceType || 'none',
      provider: req.body.insuranceProvider || '',
      validTill: req.body.insuranceValidTill || undefined,
      isTransferable: req.body.insuranceTransferable !== 'false',
    };
    const car = await Car.create({
      ...req.body,
      seller: req.user._id,
      images,
      insurance,
      // Admins publish instantly; sellers go into a pending queue for review.
      approvalStatus: req.user.role === 'admin' ? 'approved' : 'pending',
    });

    if (req.user.role !== 'admin') {
      const admins = await User.find({ role: 'admin' }).select('_id');
      admins.forEach((admin) =>
        notify(
          admin._id,
          'listing_new',
          'New car listing pending review',
          `${req.user.name} listed "${car.title}" for approval.`,
          '/admin/pending-cars'
        )
      );
    }

    res.status(201).json(car);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Public browse — only approved, active listings, with filters
exports.getCars = async (req, res) => {
  try {
    const { make, city, minPrice, maxPrice, fuelType, transmission, q, status } = req.query;
    const filter = { approvalStatus: 'approved', isActive: true };

    if (make) filter.make = new RegExp(make, 'i');
    if (city) filter.city = new RegExp(city, 'i');
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (q) {
      filter.$text = { $search: q };
    }

    const cars = await Car.find(filter).populate('seller', 'name dealershipName city').sort('-createdAt');
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate('seller', 'name dealershipName city phone');
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Seller's own listings (any approval status)
exports.getMyCars = async (req, res) => {
  try {
    const cars = await Car.find({ seller: req.user._id }).sort('-createdAt');
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const isOwner = car.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this listing' });
    }

    const newImages = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const { insuranceType, insuranceProvider, insuranceValidTill, insuranceTransferable, ...rest } =
      req.body;

    Object.assign(car, rest);
    if (insuranceType || insuranceProvider || insuranceValidTill || insuranceTransferable) {
      car.insurance = {
        type: insuranceType || car.insurance?.type || 'none',
        provider: insuranceProvider ?? car.insurance?.provider,
        validTill: insuranceValidTill || car.insurance?.validTill,
        isTransferable:
          insuranceTransferable !== undefined
            ? insuranceTransferable !== 'false'
            : car.insurance?.isTransferable,
      };
    }
    if (newImages.length) {
      car.images = [...car.images, ...newImages];
    }
    // Editing a listing sends it back for re-review, unless an admin is editing it.
    if (isOwner && req.user.role !== 'admin') {
      car.approvalStatus = 'pending';
    }
    await car.save();
    res.json(car);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    const isOwner = car.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }
    await car.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeImage = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    const isOwner = car.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    car.images = car.images.filter((img) => img !== req.body.imageUrl);
    await car.save();
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Admin moderation ---

exports.getPendingCars = async (req, res) => {
  try {
    const cars = await Car.find({ approvalStatus: 'pending' })
      .populate('seller', 'name email dealershipName')
      .sort('-createdAt');
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllCarsAdmin = async (req, res) => {
  try {
    const cars = await Car.find().populate('seller', 'name email dealershipName').sort('-createdAt');
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.decideCar = async (req, res) => {
  try {
    const { decision } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved or rejected' });
    }
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: decision },
      { new: true }
    );
    if (!car) return res.status(404).json({ message: 'Car not found' });

    notify(
      car.seller,
      decision === 'approved' ? 'listing_approved' : 'listing_rejected',
      decision === 'approved' ? 'Listing approved' : 'Listing declined',
      `Your listing "${car.title}" was ${decision}.`,
      '/seller/listings'
    );

    res.json(car);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
