const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMine, add, remove } = require('../controllers/wishlistController');

router.use(protect);

router.get('/', getMine);
router.post('/', add);
router.delete('/:carId', remove);

module.exports = router;
