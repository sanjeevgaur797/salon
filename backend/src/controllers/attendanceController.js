const Attendance = require('../models/Attendance');
const Salon = require('../models/Salon');
const Staff = require('../models/Staff');
const { calculateDistanceMeters } = require('../utils/haversine');

exports.checkIn = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not linked to any salon' });
    }

    const { latitude, longitude } = req.body;

    // Handle missing or invalid GPS coordinates strictly
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({
        error: 'INVALID_COORDINATES',
        message: 'GPS coordinates missing or unavailable. Please enable device location services and try again.'
      });
    }

    const latNum = Number(latitude);
    const lonNum = Number(longitude);

    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({
        error: 'INVALID_COORDINATES',
        message: 'Latitude must be between -90 and 90, and longitude between -180 and 180.'
      });
    }

    // Fetch salon geo-location configuration
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Salon not found' });
    }

    // Server-side Haversine distance calculation
    const distanceMeters = calculateDistanceMeters(latNum, lonNum, salon.latitude, salon.longitude);

    console.log(`[Geo-Fence Check-In] User: ${req.user.name} | Staff Location: (${latNum}, ${lonNum}) | Salon Location: (${salon.latitude}, ${salon.longitude}) | Distance: ${distanceMeters}m | Allowed Radius: ${salon.allowedRadius}m`);

    // Compare calculated distance to salon allowed radius
    if (distanceMeters > salon.allowedRadius) {
      return res.status(403).json({
        error: 'OUT_OF_RANGE',
        message: `Check-in rejected: You are ${distanceMeters} meters away from the salon. Allowed radius is ${salon.allowedRadius} meters.`,
        distanceMeters,
        allowedRadius: salon.allowedRadius
      });
    }

    // Find staff profile if linked
    const staffDoc = await Staff.findOne({ userId: req.user.id, salonId });

    // Save Attendance Record
    const attendance = new Attendance({
      salonId,
      userId: req.user.id,
      staffId: staffDoc ? staffDoc._id : null,
      latitude: latNum,
      longitude: lonNum,
      distance: distanceMeters,
      status: 'CHECKED_IN',
      timestamp: new Date()
    });

    await attendance.save();

    return res.status(200).json({
      message: 'Staff check-in successful!',
      attendance: {
        id: attendance._id,
        timestamp: attendance.timestamp,
        distanceMeters,
        allowedRadius: salon.allowedRadius,
        status: attendance.status
      }
    });
  } catch (err) {
    console.error('Geo-fencing check-in error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Check-in processing failed' });
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not linked to any salon' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const checkInRecord = await Attendance.findOne({
      salonId,
      userId: req.user.id,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ timestamp: -1 });

    return res.json({
      isCheckedIn: !!checkInRecord,
      checkInTime: checkInRecord ? checkInRecord.timestamp : null,
      record: checkInRecord
    });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch attendance status' });
  }
};

exports.getAttendanceList = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const records = await Attendance.find({ salonId })
      .populate('userId', 'name email role')
      .populate('staffId', 'name specialization')
      .sort({ timestamp: -1 });

    return res.json({ records });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch attendance records' });
  }
};
