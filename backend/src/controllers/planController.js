const Plan = require('../models/Plan');

exports.createPlan = async (req, res) => {
  try {
    const { name, price, durationInDays, maxStaff, maxAppointments } = req.body;

    if (!name || price === undefined || !durationInDays || !maxStaff || !maxAppointments) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'All plan fields (name, price, durationInDays, maxStaff, maxAppointments) are required.' });
    }

    const plan = new Plan({
      name,
      price: Number(price),
      durationInDays: Number(durationInDays),
      maxStaff: Number(maxStaff),
      maxAppointments: Number(maxAppointments)
    });

    await plan.save();
    return res.status(201).json({ message: 'Plan created successfully', plan });
  } catch (err) {
    console.error('Create plan error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create plan' });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    return res.json({ plans });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch plans' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, durationInDays, maxStaff, maxAppointments } = req.body;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Plan not found' });
    }

    if (name) plan.name = name;
    if (price !== undefined) plan.price = Number(price);
    if (durationInDays) plan.durationInDays = Number(durationInDays);
    if (maxStaff) plan.maxStaff = Number(maxStaff);
    if (maxAppointments) plan.maxAppointments = Number(maxAppointments);

    await plan.save();
    return res.json({ message: 'Plan updated successfully', plan });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update plan' });
  }
};
