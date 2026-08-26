const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    // The seller (approved seller or admin) who listed this car.
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true }, // e.g. "2019 Honda City VX"
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },
    mileageKm: { type: Number, required: true, min: 0 },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'],
      required: true,
    },
    transmission: { type: String, enum: ['manual', 'automatic'], required: true },
    ownersCount: { type: Number, default: 1, min: 1 },
    color: String,
    registrationState: String,
    description: { type: String, trim: true },
    images: [String], // array of /uploads/... paths
    city: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['available', 'reserved', 'sold'],
      default: 'available',
    },
    isActive: { type: Boolean, default: true }, // seller/admin can unpublish without deleting

    // Admin reviews each listing before it goes public, unless the lister is an admin.
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    // Insurance details for this specific car.
    insurance: {
      type: {
        type: String,
        enum: ['comprehensive', 'third-party', 'expired', 'none'],
        default: 'none',
      },
      provider: { type: String, trim: true },
      validTill: Date,
      isTransferable: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

carSchema.index({ make: 'text', model: 'text', title: 'text', city: 'text' });

module.exports = mongoose.model('Car', carSchema);
