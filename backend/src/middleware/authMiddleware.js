const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { memoryStore, isMemoryMode } = require('../config/memoryStore');

const JWT_SECRET = process.env.JWT_SECRET || 'salon_secret_key_12345';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isMemoryMode()) {
      const user = memoryStore.getUserById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User account not found' });
      }

      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        salonId: user.salonId ? user.salonId.toString() : null
      };
      return next();
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User account not found' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      salonId: user.salonId ? user.salonId.toString() : null
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired authentication token' });
  }
};

module.exports = { authenticate, JWT_SECRET };
