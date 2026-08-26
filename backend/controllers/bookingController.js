const Booking = require('../models/Booking');
const Car = require('../models/Car');
const { sendBookingRequestNotice, sendBookingStatusEmail } = require('../utils/email');
const { notify } = require('../utils/notify');

exports.createBooking = async (req, res) => {
  try {
    const { car: carId, preferredDate, message, wantsInsuranceHelp, insuranceNotes } = req.body;
    const car = await Car.findById(carId).populate('seller', 'name email');
    if (!car || !car.isActive) {
      return res.status(404).json({ message: 'Car not available for booking' });
    }
    if (car.status !== 'available') {
      return res.status(400).json({ message: 'This car is no longer available' });
    }

    const booking = await Booking.create({
      car: car._id,
      buyer: req.user._id,
      seller: car.seller._id,
      preferredDate,
      message,
      wantsInsuranceHelp: !!wantsInsuranceHelp,
      insuranceNotes,
    });

    // Primary notice goes to the seller, who now confirms/rejects directly.
    if (car.seller?.email) {
      sendBookingRequestNotice(car.seller.email, booking, car, req.user).catch(() => {});
    }
    // Admin also gets a copy for oversight.
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL !== car.seller?.email) {
      sendBookingRequestNotice(process.env.ADMIN_EMAIL, booking, car, req.user).catch(() => {});
    }
    notify(
      car.seller._id,
      'booking_new',
      'New test ride request',
      `${req.user.name} requested a test ride for ${car.title}.`,
      '/seller/bookings'
    );

    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ buyer: req.user._id })
      .populate('car')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('car')
      .populate('buyer', 'name email phone')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Seller: bookings for cars they're selling
exports.getSellerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ seller: req.user._id })
      .populate('car')
      .populate('buyer', 'name email phone')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Seller (owner of the car) or admin confirms/rejects — this is the step
// that emails the buyer either way.
exports.decideBooking = async (req, res) => {
  try {
    const { decision, adminNote } = req.body; // 'confirmed' | 'rejected'
    if (!['confirmed', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be confirmed or rejected' });
    }
    const booking = await Booking.findById(req.params.id).populate('car').populate('buyer');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwningSeller = booking.seller.toString() === req.user._id.toString();
    if (!isOwningSeller && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to decide this booking' });
    }

    booking.status = decision;
    if (adminNote) booking.adminNote = adminNote;
    await booking.save();

    sendBookingStatusEmail(booking.buyer, booking.car, booking).catch(() => {});
    notify(
      booking.buyer._id,
      decision === 'confirmed' ? 'booking_confirmed' : 'booking_rejected',
      decision === 'confirmed' ? 'Test ride confirmed' : 'Test ride declined',
      `Your test ride for ${booking.car.title} was ${decision}.`,
      '/my-bookings'
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('car').populate('buyer');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isBuyer = booking.buyer._id.toString() === req.user._id.toString();
    if (!isBuyer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
