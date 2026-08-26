const InsuranceRequest = require('../models/InsuranceRequest');
const InsurancePlan = require('../models/InsurancePlan');
const Car = require('../models/Car');
const User = require('../models/User');
const {
  sendInsuranceRequestNotice,
  sendInsuranceStatusEmail,
} = require('../utils/email');
const { notify } = require('../utils/notify');

exports.createRequest = async (req, res) => {
  try {
    const { car: carId, plan: planId, notes } = req.body;
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    const plan = await InsurancePlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Insurance plan not available' });
    }

    const calculatedPremium = plan.calculatePremium(car.price);

    const request = await InsuranceRequest.create({
      buyer: req.user._id,
      car: car._id,
      plan: plan._id,
      carPriceAtRequest: car.price,
      calculatedPremium,
      notes,
    });

    const populated = await request.populate(['car', 'plan']);

    if (process.env.ADMIN_EMAIL) {
      sendInsuranceRequestNotice(process.env.ADMIN_EMAIL, populated, req.user).catch(() => {});
    }
    const admins = await User.find({ role: 'admin' }).select('_id');
    admins.forEach((admin) =>
      notify(
        admin._id,
        'insurance_new',
        'New insurance quote request',
        `${req.user.name} requested a quote for ${populated.car.title}.`,
        '/admin/insurance-requests'
      )
    );

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await InsuranceRequest.find({ buyer: req.user._id })
      .populate('car')
      .populate('plan')
      .sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await InsuranceRequest.find()
      .populate('car')
      .populate('plan')
      .populate('buyer', 'name email phone')
      .sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin issues a policy (approves + records policy number/document/validity)
// or rejects the request. Buyer is emailed either way.
exports.decideRequest = async (req, res) => {
  try {
    const { decision, adminNote, policyNumber, policyValidTill, finalPremium } = req.body;
    if (!['issued', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be issued or rejected' });
    }

    const request = await InsuranceRequest.findById(req.params.id)
      .populate('car')
      .populate('plan')
      .populate('buyer');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = decision;
    if (adminNote) request.adminNote = adminNote;

    if (decision === 'issued') {
      request.policyNumber = policyNumber || `RPCS-${Date.now().toString().slice(-8)}`;
      if (policyValidTill) request.policyValidTill = policyValidTill;
      if (finalPremium) request.finalPremium = finalPremium;
      if (req.file) request.policyDocument = `/uploads/${req.file.filename}`;
    }

    await request.save();
    sendInsuranceStatusEmail(request.buyer, request).catch(() => {});
    notify(
      request.buyer._id,
      decision === 'issued' ? 'insurance_issued' : 'insurance_rejected',
      decision === 'issued' ? 'Insurance policy issued' : 'Insurance request declined',
      decision === 'issued'
        ? `Your policy for ${request.car.title} is ready. Policy #${request.policyNumber}.`
        : `Your insurance request for ${request.car.title} was not approved.`,
      '/my-insurance'
    );

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelRequest = async (req, res) => {
  try {
    const request = await InsuranceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    const isOwner = request.buyer.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    request.status = 'cancelled';
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
