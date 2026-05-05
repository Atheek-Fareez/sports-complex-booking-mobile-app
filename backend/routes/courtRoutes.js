const express = require('express');
const router = express.Router();
const { getCourts, getCourtById, createCourt, updateCourt, deleteCourt } = require('../controllers/courtController');

// Standard CRUD routes without authentication middleware
router.route('/')
    .get(getCourts)
    .post(createCourt);

router.route('/:id')
    .get(getCourtById)
    .put(updateCourt)
    .delete(deleteCourt);

module.exports = router;
