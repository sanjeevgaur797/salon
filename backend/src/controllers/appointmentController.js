const Appointment = require('../models/Appointment');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const Client = require('../models/Client');
const Salon = require('../models/Salon');
const { isWithinWorkingHours, isOverlapping, timeToMinutes } = require('../utils/timeUtils');

exports.createAppointment = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'Tenant isolation requirement: User must belong to a salon' });
    }

    const { client, service, staff, date, startTime, endTime, notes } = req.body;

    if (!client || !service || !staff || !date || !startTime) {
      return res.status(400).json({ 
        error: 'INVALID_INPUT', 
        message: 'client, service, staff, date, and startTime are required.' 
      });
    }

    // 1. Verify Service & auto-calculate EndTime if not provided
    const serviceDoc = await Service.findOne({ _id: service, salonId });
    if (!serviceDoc) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Service not found in this salon' });
    }

    let calculatedEndTime = endTime;
    if (!calculatedEndTime) {
      const startMins = timeToMinutes(startTime);
      if (startMins !== null) {
        const endMins = startMins + serviceDoc.durationMinutes;
        const endHours = Math.floor(endMins / 60);
        const endRemMins = endMins % 60;
        calculatedEndTime = `${String(endHours).padStart(2, '0')}:${String(endRemMins).padStart(2, '0')}`;
      }
    }

    if (!calculatedEndTime) {
      return res.status(400).json({ error: 'INVALID_TIME', message: 'Invalid startTime or calculated endTime' });
    }

    // 2. Validate Working Hours (09:00 - 20:00)
    if (!isWithinWorkingHours(startTime, calculatedEndTime, '09:00', '20:00')) {
      return res.status(400).json({
        error: 'OUTSIDE_WORKING_HOURS',
        message: `Appointment (${startTime} - ${calculatedEndTime}) must fall strictly within working hours (09:00 - 20:00).`
      });
    }

    // 3. Verify Staff exists in this salon
    const staffDoc = await Staff.findOne({ _id: staff, salonId });
    if (!staffDoc) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Staff member not found in this salon' });
    }

    // 4. Verify Client exists in this salon
    const clientDoc = await Client.findOne({ _id: client, salonId });
    if (!clientDoc) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Client not found in this salon' });
    }

    // 5. Staff Conflict Check: same staff cannot have overlapping active (non-cancelled) appointments
    const existingStaffAppointments = await Appointment.find({
      salonId,
      staff,
      date,
      status: { $ne: 'CANCELLED' }
    });

    for (const appt of existingStaffAppointments) {
      if (isOverlapping(startTime, calculatedEndTime, appt.startTime, appt.endTime)) {
        return res.status(400).json({
          error: 'STAFF_CONFLICT',
          message: `Staff member ${staffDoc.name} is already booked for another appointment from ${appt.startTime} to ${appt.endTime} on ${date}.`
        });
      }
    }

    // 6. Max Appointments Plan Limit Check (optional feature)
    const salon = await Salon.findById(salonId).populate('currentPlan');
    if (salon && salon.currentPlan && salon.currentPlan.maxAppointments) {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const monthAppointmentsCount = await Appointment.countDocuments({
        salonId,
        createdAt: { $gte: startOfMonth }
      });
      if (monthAppointmentsCount >= salon.currentPlan.maxAppointments) {
        return res.status(403).json({
          error: 'PLAN_LIMIT_REACHED',
          message: `Your current plan limit of ${salon.currentPlan.maxAppointments} monthly appointments has been reached. Please upgrade your plan.`
        });
      }
    }

    // 7. Save Appointment
    const appointment = new Appointment({
      salonId,
      client,
      service,
      staff,
      date,
      startTime,
      endTime: calculatedEndTime,
      status: 'CONFIRMED',
      notes: notes || ''
    });

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('client')
      .populate('service')
      .populate('staff');

    return res.status(201).json({
      message: 'Appointment created successfully',
      appointment: populatedAppointment
    });
  } catch (err) {
    console.error('Create appointment error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create appointment' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not linked to any salon' });
    }

    const { date, status, staffId } = req.query;

    // Strict tenant isolation
    const query = { salonId };
    if (date) query.date = date;
    if (status) query.status = status;
    if (staffId) query.staff = staffId;

    const appointments = await Appointment.find(query)
      .populate('client')
      .populate('service')
      .populate('staff')
      .sort({ date: -1, startTime: 1 });

    return res.json({ appointments });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch appointments' });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Invalid appointment status' });
    }

    const appointment = await Appointment.findOne({ _id: id, salonId });
    if (!appointment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate('client')
      .populate('service')
      .populate('staff');

    return res.json({ message: 'Appointment status updated', appointment: updated });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update appointment' });
  }
};
