const Salon = require('../models/Salon');
const Plan = require('../models/Plan');
const User = require('../models/User');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const bcrypt = require('bcryptjs');
const { memoryStore, isMemoryMode } = require('../config/memoryStore');

exports.getSalons = async (req, res) => {
  try {
    if (isMemoryMode()) {
      return memoryStore.getSalons(req, res);
    }
    const salons = await Salon.find().populate('currentPlan').sort({ createdAt: -1 });
    return res.json({ salons });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch salons' });
  }
};

exports.createSalon = async (req, res) => {
  try {
    if (isMemoryMode()) {
      return memoryStore.createSalon(req, res);
    }
    const { name, address, latitude, longitude, allowedRadius, ownerName, ownerEmail, ownerPassword } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Name, latitude, and longitude are required' });
    }

    const salon = new Salon({
      name,
      address: address || '',
      latitude: Number(latitude),
      longitude: Number(longitude),
      allowedRadius: Number(allowedRadius || 100),
      subscriptionStatus: 'NONE'
    });

    await salon.save();

    let owner = null;
    if (ownerEmail && ownerPassword && ownerName) {
      const existingUser = await User.findOne({ email: ownerEmail.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'USER_EXISTS', message: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(ownerPassword, 10);
      owner = new User({
        name: ownerName,
        email: ownerEmail.toLowerCase(),
        password: hashedPassword,
        role: 'SALON_OWNER',
        salonId: salon._id
      });
      await owner.save();
    }

    return res.status(201).json({ message: 'Salon created successfully', salon, owner: owner ? { id: owner._id, email: owner.email } : null });
  } catch (err) {
    console.error('Create salon error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create salon' });
  }
};

exports.assignOrRenewPlan = async (req, res) => {
  try {
    if (isMemoryMode()) {
      return memoryStore.assignOrRenewPlan(req, res);
    }
    const { salonId } = req.params;
    const { planId, action } = req.body; // action: ASSIGN | RENEW | UPGRADE

    if (!planId || !action || !['ASSIGN', 'RENEW', 'UPGRADE'].includes(action)) {
      return res.status(400).json({ 
        error: 'INVALID_INPUT', 
        message: 'planId and valid action (ASSIGN, RENEW, UPGRADE) are required' 
      });
    }

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Salon not found' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Plan not found' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);

    salon.currentPlan = plan._id;
    salon.subscriptionStartDate = startDate;
    salon.subscriptionEndDate = endDate;
    salon.subscriptionStatus = 'ACTIVE';
    await salon.save();

    const history = new SubscriptionHistory({
      salonId: salon._id,
      planId: plan._id,
      startDate,
      endDate,
      price: plan.price,
      action
    });
    await history.save();

    const updatedSalon = await Salon.findById(salon._id).populate('currentPlan');

    return res.json({
      message: `Plan successfully ${action.toLowerCase()}ed`,
      salon: updatedSalon,
      subscriptionHistory: history
    });
  } catch (err) {
    console.error('Assign plan error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update salon plan' });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    if (isMemoryMode()) {
      return memoryStore.getSubscriptionStatus(req, res);
    }
    // Isolated to tenant from token
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not linked to any salon' });
    }

    const salon = await Salon.findById(salonId).populate('currentPlan');
    if (!salon) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Salon not found' });
    }

    const history = await SubscriptionHistory.find({ salonId }).populate('planId').sort({ createdAt: -1 });

    const now = new Date();
    const isExpired = salon.subscriptionEndDate && new Date(salon.subscriptionEndDate) < now;

    return res.json({
      salonId: salon._id,
      salonName: salon.name,
      currentPlan: salon.currentPlan,
      subscriptionStartDate: salon.subscriptionStartDate,
      subscriptionEndDate: salon.subscriptionEndDate,
      subscriptionStatus: isExpired ? 'EXPIRED' : salon.subscriptionStatus,
      isExpired,
      history
    });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch subscription status' });
  }
};

exports.updateSalonConfig = async (req, res) => {
  try {
    if (isMemoryMode()) {
      return memoryStore.updateSalonConfig(req, res);
    }
    const salonId = req.user.salonId;
    const { name, address, latitude, longitude, allowedRadius } = req.body;

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Salon not found' });
    }

    if (name) salon.name = name;
    if (address !== undefined) salon.address = address;
    if (latitude !== undefined) salon.latitude = Number(latitude);
    if (longitude !== undefined) salon.longitude = Number(longitude);
    if (allowedRadius !== undefined) salon.allowedRadius = Number(allowedRadius);

    await salon.save();
    return res.json({ message: 'Salon configuration updated successfully', salon });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update salon config' });
  }
};
