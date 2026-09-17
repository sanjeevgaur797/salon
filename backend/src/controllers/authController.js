const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Salon = require('../models/Salon');
const { JWT_SECRET } = require('../middleware/authMiddleware');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, salonId: user.salonId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    let salon = null;
    if (user.salonId) {
      salon = await Salon.findById(user.salonId).populate('currentPlan');
    }

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        salonId: user.salonId
      },
      salon
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Login failed' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    let salon = null;
    if (user.salonId) {
      salon = await Salon.findById(user.salonId).populate('currentPlan');
    }
    return res.json({ user, salon });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch user details' });
  }
};
