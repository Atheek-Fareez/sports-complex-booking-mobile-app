const Court = require('../models/Court');

// @desc    Get all courts
// @route   GET /api/courts
// @access  Public
const getCourts = async (req, res) => {
  try {
    const courts = await Court.find({});
    res.json(courts);
  } catch (error) {
    console.error('getCourts Error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get single court by ID
// @route   GET /api/courts/:id
// @access  Public
const getCourtById = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
      res.json(court);
    } else {
      res.status(404).json({ message: 'Court not found' });
    }
  } catch (error) {
    console.error('getCourtById Error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Create a court
// @route   POST /api/courts
// @access  Private/Admin
const createCourt = async (req, res) => {
  try {
    const court = await Court.create(req.body);
    res.status(201).json(court);
  } catch (error) {
    console.error('createCourt Error:', error);
    res.status(400).json({ message: 'Bad Request: ' + error.message });
  }
};

// @desc    Update a court
// @route   PUT /api/courts/:id
// @access  Private/Admin
const updateCourt = async (req, res) => {
  try {
    const court = await Court.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (court) {
      res.json(court);
    } else {
      res.status(404).json({ message: 'Court not found' });
    }
  } catch (error) {
    console.error('updateCourt Error:', error);
    res.status(400).json({ message: 'Bad Request: ' + error.message });
  }
};

// @desc    Delete a court
// @route   DELETE /api/courts/:id
// @access  Private/Admin
const deleteCourt = async (req, res) => {
  try {
    const deletedCourt = await Court.findByIdAndDelete(req.params.id);
    if (deletedCourt) {
      res.json({ message: 'Court removed' });
    } else {
      res.status(404).json({ message: 'Court not found' });
    }
  } catch (error) {
    console.error('deleteCourt Error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

module.exports = { getCourts, getCourtById, createCourt, updateCourt, deleteCourt };
