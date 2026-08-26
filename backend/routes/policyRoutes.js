const express = require('express');
const router = express.Router();
const { getAllPolicies, getPolicy } = require('../controllers/policyController');

router.get('/', getAllPolicies);
router.get('/:key', getPolicy);

module.exports = router;
