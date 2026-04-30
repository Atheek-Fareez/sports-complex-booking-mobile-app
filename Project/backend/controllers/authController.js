const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizePhone } = require('../utils/phoneUtils');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user (Direct Registration)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // 1. Validate Required Fields
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields including Email are required.' });
    }

    const normalizedPhone = normalizePhone(phone);

    // 2. Double Check for Duplicate Email/Phone
    const phoneExists = await User.findOne({ phone: normalizedPhone });
    if (phoneExists) {
      return res.status(400).json({ message: 'This phone number is already registered.' });
    }

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'This email is already registered.' });
      }
    }

    // 3. Create User
    const user = await User.create({
      fullName,
      email,
      password,
      phone: normalizedPhone,
    });

    if (user) {
      res.status(201).json({
        message: 'User registered successfully.',
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data.' });
    }
  } catch (error) {
    console.error('REGISTRATION ERROR:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `This ${field} is already registered.` });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body; 
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (isMatch) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Incorrect email or password.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
