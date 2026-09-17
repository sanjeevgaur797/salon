const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  distance: { type: Number, required: true }, // meters calculated
  status: { type: String, default: 'CHECKED_IN' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
