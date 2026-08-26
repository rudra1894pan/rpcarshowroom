const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getPlans,
  calculatePremium,
  getAllPlansAdmin,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controllers/insurancePlanController');

router.get('/', getPlans);
router.get('/:planId/calculate', calculatePremium);

router.get('/admin/all', protect, adminOnly, getAllPlansAdmin);
router.post('/', protect, adminOnly, createPlan);
router.put('/:id', protect, adminOnly, updatePlan);
router.delete('/:id', protect, adminOnly, deletePlan);

module.exports = router;
