const Client = require('../models/Client');

exports.getClients = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not associated with a salon' });
    }

    const clients = await Client.find({ salonId }).sort({ createdAt: -1 });
    return res.json({ clients });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch clients' });
  }
};

exports.createClient = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not associated with a salon' });
    }

    const { name, email, phone, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Client name and phone number are required' });
    }

    const client = new Client({
      salonId,
      name,
      email: email || '',
      phone,
      notes: notes || ''
    });

    await client.save();
    return res.status(201).json({ message: 'Client created successfully', client });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create client' });
  }
};
