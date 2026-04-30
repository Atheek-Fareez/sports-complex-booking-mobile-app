const express = require('express');
const router = express.Router();
const { getPools, getPoolById, createPool, updatePool, deletePool } = require('../controllers/poolController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/').get(getPools).post(protect, adminOnly, createPool);
router.route('/:id').get(getPoolById).put(protect, adminOnly, updatePool).delete(protect, adminOnly, deletePool);

module.exports = router;
