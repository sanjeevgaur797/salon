const Appointment = require('../models/Appointment');
const Salon = require('../models/Salon');
const Client = require('../models/Client');
const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const { memoryStore, isMemoryMode } = require('../config/memoryStore');

exports.getDashboardStats = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not linked to any salon' });
    }

    if (isMemoryMode()) {
      return memoryStore.getDashboardStats(req, res);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [todayCount, totalClients, totalStaff, totalServices, salon, checkInToday] = await Promise.all([
      Appointment.countDocuments({ salonId, date: todayStr }),
      Client.countDocuments({ salonId }),
      Staff.countDocuments({ salonId }),
      Service.countDocuments({ salonId }),
      Salon.findById(salonId).populate('currentPlan'),
      Attendance.findOne({
        salonId,
        userId: req.user.id,
        timestamp: {
          $gte: new Date(new Date().setHours(0,0,0,0)),
          $lte: new Date(new Date().setHours(23,59,59,999))
        }
      })
    ]);

    const recentAppointments = await Appointment.find({ salonId, date: todayStr })
      .populate('client')
      .populate('service')
      .populate('staff')
      .sort({ startTime: 1 });

    const staffList = await Staff.find({ salonId });
    const serviceList = await Service.find({ salonId });

    return res.json({
      todayCount,
      totalClients,
      totalStaff,
      totalServices,
      salon,
      isCheckedIn: !!checkInToday,
      checkInTime: checkInToday ? checkInToday.timestamp : null,
      recentAppointments,
      staffList,
      serviceList
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch dashboard statistics' });
  }
};
