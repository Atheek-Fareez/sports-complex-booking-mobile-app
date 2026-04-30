const express = require('express');
const router = express.Router();
const { getCourts, getCourtById, createCourt, updateCourt, deleteCourt } = require('../controllers/courtController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/').get(getCourts).post(protect, adminOnly, createCourt);
router.route('/:id').get(getCourtById).put(protect, adminOnly, updateCourt).delete(protect, adminOnly, deleteCourt);

module.exports = router;
