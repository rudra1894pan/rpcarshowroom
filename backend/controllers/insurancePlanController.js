const InsurancePlan = require('../models/InsurancePlan');
const Car = require('../models/Car');

// Public: active plans only
exports.getPlans = async (req, res) => {
  try {
    const plans = await InsurancePlan.find({ isActive: true }).sort('planType');
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public: calculate premium for a plan against a specific car (used for live quote display)
exports.calculatePremium = async (req, res) => {
  try {
    const plan = await InsurancePlan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    const car = await Car.findById(req.query.carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const premium = plan.calculatePremium(car.price);
    res.json({ premium, carPrice: car.price, plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin
exports.getAllPlansAdmin = async (req, res) => {
  try {
    const plans = await InsurancePlan.find().sort('-createdAt');
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.coverageFeatures === 'string') {
      body.coverageFeatures = body.coverageFeatures
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const plan = await InsurancePlan.create(body);
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.coverageFeatures === 'string') {
      body.coverageFeatures = body.coverageFeatures
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const plan = await InsurancePlan.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await InsurancePlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
