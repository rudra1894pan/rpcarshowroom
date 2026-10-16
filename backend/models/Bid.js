const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true, index: true },
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    note: { type: String, trim: true, maxlength: 300 },
    // active = counts in the race; outbid = the bidder raised their own bid;
    // accepted = winner; rejected = declined / lost; withdrawn = bidder pulled out.
    status: {
      type: String,
      enum: ['active', 'outbid', 'accepted', 'rejected', 'withdrawn'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bid', bidSchema);
