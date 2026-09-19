const SubscriptionHistory = require('../models/SubscriptionHistory');
const { memoryStore, isMemoryMode } = require('../config/memoryStore');

exports.getAllHistory = async (req, res) => {
  try {
    if (isMemoryMode()) {
      return memoryStore.getAllHistory(req, res);
    }
    const { salonId } = req.query;
    const filter = {};
    if (salonId) {
      filter.salonId = salonId;
    }

    const history = await SubscriptionHistory.find(filter)
      .populate('salonId', 'name address')
      .populate('planId', 'name price durationInDays maxStaff maxAppointments')
      .sort({ createdAt: -1 });

    return res.json({ history });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch subscription history' });
  }
};
