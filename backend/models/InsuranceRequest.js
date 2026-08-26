const mongoose = require('mongoose');

const insuranceRequestSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'InsurancePlan', required: true },

    // Snapshot values at time of request, so later plan/car edits don't retroactively change quotes.
    carPriceAtRequest: { type: Number, required: true },
    calculatedPremium: { type: Number, required: true },

    notes: { type: String, trim: true }, // buyer's notes/questions
    status: {
      type: String,
      enum: ['pending', 'quoted', 'issued', 'rejected', 'cancelled'],
      default: 'pending',
    },
    adminNote: { type: String, trim: true },

    // Filled in by admin once a policy is actually issued.
    policyNumber: { type: String, trim: true },
    policyDocument: String, // /uploads/... path
    policyValidTill: Date,
    finalPremium: Number, // in case admin adjusts the quoted premium before issuing

    // Premium payment via Razorpay, collected once the policy is issued.
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

module.exports = mongoose.model('InsuranceRequest', insuranceRequestSchema);
