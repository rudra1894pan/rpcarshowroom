const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  decideRequest,
  cancelRequest,
} = require('../controllers/insuranceRequestController');

router.use(protect);

router.post('/', createRequest);
router.get('/my', getMyRequests);
router.get('/', adminOnly, getAllRequests);
router.put('/:id/decide', adminOnly, upload.single('policyDocument'), decideRequest);
router.put('/:id/cancel', cancelRequest);

module.exports = router;
