const mongoose = require('mongoose');

const insurancePlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Comprehensive Shield"
    provider: { type: String, required: true, trim: true }, // e.g. "ICICI Lombard"
    planType: {
      type: String,
      enum: ['comprehensive', 'third-party', 'zero-dep', 'engine-protect'],
      required: true,
    },
    description: { type: String, trim: true },
    coverageFeatures: [String], // e.g. ["Zero depreciation", "24x7 roadside assistance"]
    durationMonths: { type: Number, default: 12, enum: [12, 24, 36] },

    // Premium calculation: premium = max(minPremium, carPrice * (premiumRatePercent / 100)) + fixedFee
    premiumRatePercent: { type: Number, required: true, min: 0 }, // e.g. 3.5 means 3.5% of car price
    fixedFee: { type: Number, default: 0, min: 0 },
    minPremium: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Computes the premium for a given car price using this plan's rules.
insurancePlanSchema.methods.calculatePremium = function (carPrice) {
  const base = (carPrice * this.premiumRatePercent) / 100;
  return Math.round(Math.max(base, this.minPremium) + this.fixedFee);
};

module.exports = mongoose.model('InsurancePlan', insurancePlanSchema);
