const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'booking_new',
        'booking_confirmed',
        'booking_rejected',
        'insurance_new',
        'insurance_issued',
        'insurance_rejected',
        'seller_applied',
        'seller_approved',
        'seller_rejected',
        'listing_new',
        'listing_approved',
        'listing_rejected',
        'payment_success',
        'review_received',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    link: String, // frontend route to navigate to on click, e.g. "/my-bookings"
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
