const express = require('express');
const router = express.Router();
const { getPools, getPoolById, createPool, updatePool, deletePool } = require('../controllers/poolController');

// Standard CRUD routes without authentication middleware
router.route('/')
    .get(getPools)
    .post(createPool);

router.route('/:id')
    .get(getPoolById)
    .put(updatePool)
    .delete(deletePool);

module.exports = router;
