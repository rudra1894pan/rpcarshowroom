const crypto = require('crypto');
const getRazorpay = require('../config/razorpay');
const Booking = require('../models/Booking');
const InsuranceRequest = require('../models/InsuranceRequest');
const { notify } = require('../utils/notify');

// Fetch the record, enforce ownership + correct status, and return the amount to charge (in INR).
const resolvePayable = async (type, id, userId) => {
  if (type === 'booking') {
    const booking = await Booking.findById(id);
    if (!booking) throw { status: 404, message: 'Booking not found' };
    if (booking.buyer.toString() !== userId.toString()) {
      throw { status: 403, message: 'Not authorized' };
    }
    if (booking.status !== 'confirmed') {
      throw { status: 400, message: 'Booking must be confirmed before paying the deposit' };
    }
    if (booking.paymentStatus === 'paid') {
      throw { status: 400, message: 'Deposit already paid' };
    }
    return { record: booking, amount: booking.depositAmount, label: 'Test ride deposit' };
  }

  if (type === 'insurance') {
    const request = await InsuranceRequest.findById(id);
    if (!request) throw { status: 404, message: 'Insurance request not found' };
    if (request.buyer.toString() !== userId.toString()) {
      throw { status: 403, message: 'Not authorized' };
    }
    if (request.status !== 'issued') {
      throw { status: 400, message: 'Policy must be issued before paying the premium' };
    }
    if (request.paymentStatus === 'paid') {
      throw { status: 400, message: 'Premium already paid' };
    }
    const amount = request.finalPremium || request.calculatedPremium;
    return { record: request, amount, label: 'Insurance premium' };
  }

  throw { status: 400, message: 'Invalid payment type' };
};

exports.getConfig = (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID || '' });
};

exports.createOrder = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({ message: 'Payments are not configured on this server yet' });
    }

    const { type, id } = req.body;
    const { record, amount, label } = await resolvePayable(type, id, req.user._id);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `${type}_${id}`.slice(0, 40),
      notes: { type, id: id.toString(), label },
    });

    record.razorpayOrderId = order.id;
    await record.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      label,
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Could not create payment order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ message: 'Payments are not configured on this server yet' });
    }

    const { type, id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const Model = type === 'booking' ? Booking : InsuranceRequest;
    const record = await Model.findById(id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (record.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Order mismatch' });
    }

    record.paymentStatus = 'paid';
    record.razorpayPaymentId = razorpay_payment_id;
    await record.save();

    notify(
      req.user._id,
      'payment_success',
      'Payment successful',
      type === 'booking' ? 'Your test-ride deposit was received.' : 'Your insurance premium was received.',
      type === 'booking' ? '/my-bookings' : '/my-insurance'
    );

    res.json({ message: 'Payment verified', record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
