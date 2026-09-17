const mongoose = require('mongoose');

const salonSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, default: '' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  allowedRadius: { type: Number, required: true, default: 100 }, // in meters
  currentPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
  subscriptionStatus: { 
    type: String, 
    enum: ['ACTIVE', 'EXPIRED', 'NONE'], 
    default: 'NONE' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Salon', salonSchema);
