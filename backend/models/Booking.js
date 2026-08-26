const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    preferredDate: { type: Date, required: true },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    adminNote: { type: String, trim: true },

    // Buyer can ask for help with insurance transfer/purchase alongside the test ride.
    wantsInsuranceHelp: { type: Boolean, default: false },
    insuranceNotes: { type: String, trim: true },

    // Refundable deposit paid via Razorpay to secure a confirmed test-ride slot.
    depositAmount: { type: Number, default: 500 }, // in INR
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
