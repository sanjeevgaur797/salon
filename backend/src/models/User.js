const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'SALON_OWNER', 'RECEPTIONIST', 'STAFF'], 
    required: true 
  },
  salonId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Salon',
    required: function() { return this.role !== 'SUPER_ADMIN'; }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
