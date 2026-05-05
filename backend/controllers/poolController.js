const Pool = require('../models/Pool');

// @desc    Get all pools
// @route   GET /api/pools
// @access  Public
const getPools = async (req, res) => {
  try {
    const pools = await Pool.find({});
    res.json(pools);
  } catch (error) {
    console.error('getPools Error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get single pool by ID
// @route   GET /api/pools/:id
// @access  Public
const getPoolById = async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    if (pool) {
      res.json(pool);
    } else {
      res.status(404).json({ message: 'Pool not found' });
    }
  } catch (error) {
    console.error('getPoolById Error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Create a pool
// @route   POST /api/pools
// @access  Private/Admin
const createPool = async (req, res) => {
  try {
    const pool = await Pool.create(req.body);
    res.status(201).json(pool);
  } catch (error) {
    console.error('createPool Error:', error);
    res.status(400).json({ message: 'Bad Request: ' + error.message });
  }
};

// @desc    Update a pool
// @route   PUT /api/pools/:id
// @access  Private/Admin
const updatePool = async (req, res) => {
  try {
    const pool = await Pool.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (pool) {
      res.json(pool);
    } else {
      res.status(404).json({ message: 'Pool not found' });
    }
  } catch (error) {
    console.error('updatePool Error:', error);
    res.status(400).json({ message: 'Bad Request: ' + error.message });
  }
};

// @desc    Delete a pool
// @route   DELETE /api/pools/:id
// @access  Private/Admin
const deletePool = async (req, res) => {
  try {
    const deletedPool = await Pool.findByIdAndDelete(req.params.id);
    if (deletedPool) {
      res.json({ message: 'Pool removed' });
    } else {
      res.status(404).json({ message: 'Pool not found' });
    }
  } catch (error) {
    console.error('deletePool Error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

module.exports = { getPools, getPoolById, createPool, updatePool, deletePool };
