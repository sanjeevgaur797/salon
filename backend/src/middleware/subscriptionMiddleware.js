const Salon = require('../models/Salon');
const { memoryStore, isMemoryMode } = require('../config/memoryStore');

const checkSubscription = async (req, res, next) => {
  try {
    // SUPER_ADMIN is exempt from subscription gating
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!req.user || !req.user.salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not associated with any salon' });
    }

    if (isMemoryMode()) {
      const salon = memoryStore.getSalonById(req.user.salonId);
      if (!salon) {
        return res.status(404).json({ error: 'SALON_NOT_FOUND', message: 'Salon record not found' });
      }

      const now = new Date();
      const isExpired = 
        salon.subscriptionStatus === 'EXPIRED' ||
        !salon.subscriptionEndDate ||
        new Date(salon.subscriptionEndDate) < now;

      if (isExpired) {
        salon.subscriptionStatus = 'EXPIRED';
        return res.status(403).json({
          error: 'SUBSCRIPTION_EXPIRED',
          message: 'Your subscription has expired. Please contact the administrator to renew your plan.'
        });
      }

      req.salon = salon;
      return next();
    }

    const salon = await Salon.findById(req.user.salonId);
    if (!salon) {
      return res.status(404).json({ error: 'SALON_NOT_FOUND', message: 'Salon record not found' });
    }

    const now = new Date();
    const isExpired = 
      salon.subscriptionStatus === 'EXPIRED' ||
      !salon.subscriptionEndDate ||
      new Date(salon.subscriptionEndDate) < now;

    if (isExpired) {
      // Sync status to EXPIRED in database if needed
      if (salon.subscriptionStatus !== 'EXPIRED') {
        salon.subscriptionStatus = 'EXPIRED';
        await salon.save();
      }

      return res.status(403).json({
        error: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired. Please contact the administrator to renew your plan.'
      });
    }

    // Attach salon object to request for downstream controllers if needed
    req.salon = salon;
    next();
  } catch (err) {
    console.error('Subscription middleware error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to verify subscription status' });
  }
};

module.exports = { checkSubscription };
