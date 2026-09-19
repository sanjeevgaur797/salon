const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { calculateDistanceMeters } = require('../utils/haversine');
const { isWithinWorkingHours, isOverlapping, timeToMinutes } = require('../utils/timeUtils');

const JWT_SECRET = process.env.JWT_SECRET || 'salon_secret_key_12345';

const isMemoryMode = () => {
  return mongoose.connection.readyState !== 1;
};

// Generate 24-character hexadecimal ObjectId mock
let idCounter = 1000;
const newId = () => {
  idCounter++;
  return '65a' + String(idCounter).padStart(21, '0');
};

// Static seed IDs
const PLAN_BASIC_ID = '65a000000000000000000001';
const PLAN_PRO_ID = '65a000000000000000000002';
const PLAN_ENTERPRISE_ID = '65a000000000000000000003';

const SALON_GLAMOUR_ID = '65a000000000000000000010';
const SALON_EXPIRED_ID = '65a000000000000000000020';

const USER_ADMIN_ID = '65a000000000000000000100';
const USER_OWNER_ID = '65a000000000000000000101';
const USER_RECEP_ID = '65a000000000000000000102';
const USER_STAFF_ID = '65a000000000000000000103';
const USER_EXPIRED_ID = '65a000000000000000000104';

const SERVICE_HAIRCUT_ID = '65a000000000000000000201';
const SERVICE_FACIAL_ID = '65a000000000000000000202';
const SERVICE_COLOR_ID = '65a000000000000000000203';

const STAFF_ALEX_ID = '65a000000000000000000301';
const STAFF_SARAH_ID = '65a000000000000000000302';

const CLIENT_EMILY_ID = '65a000000000000000000401';
const CLIENT_MICHAEL_ID = '65a000000000000000000402';
const CLIENT_JESSICA_ID = '65a000000000000000000403';

// Pre-hashed 'password123'
const HASHED_PASSWORD = bcrypt.hashSync('password123', 10);

class MemoryStore {
  constructor() {
    this.reset();
  }

  reset() {
    const now = new Date();
    const activeEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiredStart = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
    const expiredEnd = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    this.plans = [
      {
        _id: PLAN_BASIC_ID,
        name: 'Basic Salon Plan',
        price: 49,
        durationInDays: 30,
        maxStaff: 3,
        maxAppointments: 100,
        createdAt: new Date()
      },
      {
        _id: PLAN_PRO_ID,
        name: 'Pro Salon Plan',
        price: 99,
        durationInDays: 30,
        maxStaff: 10,
        maxAppointments: 500,
        createdAt: new Date()
      },
      {
        _id: PLAN_ENTERPRISE_ID,
        name: 'Enterprise Plan',
        price: 199,
        durationInDays: 365,
        maxStaff: 50,
        maxAppointments: 5000,
        createdAt: new Date()
      }
    ];

    this.salons = [
      {
        _id: SALON_GLAMOUR_ID,
        name: 'Glamour Touch Salon',
        address: '123 Beauty Blvd, New Delhi',
        latitude: 28.6139,
        longitude: 77.2090,
        allowedRadius: 100,
        currentPlan: PLAN_PRO_ID,
        subscriptionStartDate: now,
        subscriptionEndDate: activeEnd,
        subscriptionStatus: 'ACTIVE',
        createdAt: now
      },
      {
        _id: SALON_EXPIRED_ID,
        name: 'Sunset Glow Salon (Expired)',
        address: '456 Sunset Way, Mumbai',
        latitude: 19.0760,
        longitude: 72.8777,
        allowedRadius: 50,
        currentPlan: PLAN_BASIC_ID,
        subscriptionStartDate: expiredStart,
        subscriptionEndDate: expiredEnd,
        subscriptionStatus: 'EXPIRED',
        createdAt: expiredStart
      }
    ];

    this.users = [
      {
        _id: USER_ADMIN_ID,
        name: 'System Super Admin',
        email: 'admin@salon.com',
        password: HASHED_PASSWORD,
        role: 'SUPER_ADMIN',
        salonId: null
      },
      {
        _id: USER_OWNER_ID,
        name: 'Elena Rostova (Owner)',
        email: 'owner@glamour.com',
        password: HASHED_PASSWORD,
        role: 'SALON_OWNER',
        salonId: SALON_GLAMOUR_ID
      },
      {
        _id: USER_RECEP_ID,
        name: 'Rachel Green (Receptionist)',
        email: 'receptionist@glamour.com',
        password: HASHED_PASSWORD,
        role: 'RECEPTIONIST',
        salonId: SALON_GLAMOUR_ID
      },
      {
        _id: USER_STAFF_ID,
        name: 'Alex Johnson (Staff)',
        email: 'staff@glamour.com',
        password: HASHED_PASSWORD,
        role: 'STAFF',
        salonId: SALON_GLAMOUR_ID
      },
      {
        _id: USER_EXPIRED_ID,
        name: 'Marcus Vance (Expired Salon Owner)',
        email: 'expired@salon.com',
        password: HASHED_PASSWORD,
        role: 'SALON_OWNER',
        salonId: SALON_EXPIRED_ID
      }
    ];

    this.services = [
      {
        _id: SERVICE_HAIRCUT_ID,
        salonId: SALON_GLAMOUR_ID,
        name: 'Haircut',
        durationMinutes: 30,
        price: 35
      },
      {
        _id: SERVICE_FACIAL_ID,
        salonId: SALON_GLAMOUR_ID,
        name: 'Facial',
        durationMinutes: 60,
        price: 65
      },
      {
        _id: SERVICE_COLOR_ID,
        salonId: SALON_GLAMOUR_ID,
        name: 'Hair Color',
        durationMinutes: 120,
        price: 120
      }
    ];

    this.staff = [
      {
        _id: STAFF_ALEX_ID,
        userId: USER_STAFF_ID,
        salonId: SALON_GLAMOUR_ID,
        name: 'Alex Johnson',
        specialization: 'Hair Color & Styling',
        phone: '+1 555-0101'
      },
      {
        _id: STAFF_SARAH_ID,
        userId: null,
        salonId: SALON_GLAMOUR_ID,
        name: 'Sarah Miller',
        specialization: 'Skincare & Facial Specialist',
        phone: '+1 555-0102'
      }
    ];

    this.clients = [
      {
        _id: CLIENT_EMILY_ID,
        salonId: SALON_GLAMOUR_ID,
        name: 'Emily Watson',
        email: 'emily@example.com',
        phone: '+1 555-0192',
        notes: 'Prefers organic shampoos',
        createdAt: now
      },
      {
        _id: CLIENT_MICHAEL_ID,
        salonId: SALON_GLAMOUR_ID,
        name: 'Michael Brown',
        email: 'michael@example.com',
        phone: '+1 555-0184',
        notes: 'Allergic to specific hair dyes',
        createdAt: now
      },
      {
        _id: CLIENT_JESSICA_ID,
        salonId: SALON_GLAMOUR_ID,
        name: 'Jessica Alba',
        email: 'jessica@example.com',
        phone: '+1 555-0177',
        notes: 'VIP Customer',
        createdAt: now
      }
    ];

    const todayStr = now.toISOString().split('T')[0];

    this.appointments = [
      {
        _id: newId(),
        salonId: SALON_GLAMOUR_ID,
        client: CLIENT_EMILY_ID,
        service: SERVICE_HAIRCUT_ID,
        staff: STAFF_ALEX_ID,
        date: todayStr,
        startTime: '10:00',
        endTime: '10:30',
        status: 'CONFIRMED',
        notes: 'Regular trim and blow dry',
        createdAt: now
      },
      {
        _id: newId(),
        salonId: SALON_GLAMOUR_ID,
        client: CLIENT_MICHAEL_ID,
        service: SERVICE_FACIAL_ID,
        staff: STAFF_SARAH_ID,
        date: todayStr,
        startTime: '11:00',
        endTime: '12:00',
        status: 'CONFIRMED',
        notes: 'Hydrating glow facial',
        createdAt: now
      }
    ];

    this.attendances = [];

    this.subscriptionHistories = [
      {
        _id: newId(),
        salonId: SALON_GLAMOUR_ID,
        planId: PLAN_PRO_ID,
        startDate: now,
        endDate: activeEnd,
        price: 99,
        action: 'ASSIGN',
        createdAt: now
      },
      {
        _id: newId(),
        salonId: SALON_EXPIRED_ID,
        planId: PLAN_BASIC_ID,
        startDate: expiredStart,
        endDate: expiredEnd,
        price: 49,
        action: 'ASSIGN',
        createdAt: expiredStart
      }
    ];
  }

  // Helpers
  getUserById(id) {
    return this.users.find(u => String(u._id) === String(id));
  }

  getSalonById(id) {
    const salon = this.salons.find(s => String(s._id) === String(id));
    if (!salon) return null;
    const plan = this.plans.find(p => String(p._id) === String(salon.currentPlan));
    return { ...salon, currentPlan: plan || salon.currentPlan };
  }

  populateAppointment(appt) {
    const client = this.clients.find(c => String(c._id) === String(appt.client)) || null;
    const service = this.services.find(s => String(s._id) === String(appt.service)) || null;
    const staff = this.staff.find(st => String(st._id) === String(appt.staff)) || null;
    return { ...appt, client, service, staff };
  }

  // 1. Auth Handlers
  async login(req, res) {
    const { email, password } = req.body;
    const user = this.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, salonId: user.salonId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const salon = user.salonId ? this.getSalonById(user.salonId) : null;

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        salonId: user.salonId
      },
      salon
    });
  }

  getMe(req, res) {
    const user = this.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    }
    const { password, ...safeUser } = user;
    const salon = user.salonId ? this.getSalonById(user.salonId) : null;
    return res.json({ user: safeUser, salon });
  }

  // 2. Dashboard
  getDashboardStats(req, res) {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not linked to any salon' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAppointments = this.appointments.filter(a => String(a.salonId) === String(salonId) && a.date === todayStr);
    const totalClients = this.clients.filter(c => String(c.salonId) === String(salonId)).length;
    const totalStaff = this.staff.filter(s => String(s.salonId) === String(salonId)).length;
    const totalServices = this.services.filter(s => String(s.salonId) === String(salonId)).length;
    const salon = this.getSalonById(salonId);

    const checkInToday = this.attendances.find(att => 
      String(att.salonId) === String(salonId) && 
      String(att.userId) === String(req.user.id)
    );

    const recentAppointments = todayAppointments.map(a => this.populateAppointment(a));
    const staffList = this.staff.filter(s => String(s.salonId) === String(salonId));
    const serviceList = this.services.filter(s => String(s.salonId) === String(salonId));

    return res.json({
      todayCount: todayAppointments.length,
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
  }

  // 3. Appointments
  createAppointment(req, res) {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'Tenant isolation requirement: User must belong to a salon' });
    }

    const { client, service, staff, date, startTime, endTime, notes } = req.body;
    if (!client || !service || !staff || !date || !startTime) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'client, service, staff, date, and startTime are required.' });
    }

    const serviceDoc = this.services.find(s => String(s._id) === String(service) && String(s.salonId) === String(salonId));
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

    if (!isWithinWorkingHours(startTime, calculatedEndTime, '09:00', '20:00')) {
      return res.status(400).json({
        error: 'OUTSIDE_WORKING_HOURS',
        message: `Appointment (${startTime} - ${calculatedEndTime}) must fall strictly within working hours (09:00 - 20:00).`
      });
    }

    const staffDoc = this.staff.find(st => String(st._id) === String(staff) && String(st.salonId) === String(salonId));
    if (!staffDoc) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Staff member not found in this salon' });
    }

    const clientDoc = this.clients.find(c => String(c._id) === String(client) && String(c.salonId) === String(salonId));
    if (!clientDoc) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Client not found in this salon' });
    }

    const existingStaffAppointments = this.appointments.filter(a => 
      String(a.salonId) === String(salonId) && 
      String(a.staff) === String(staff) && 
      a.date === date && 
      a.status !== 'CANCELLED'
    );

    for (const appt of existingStaffAppointments) {
      if (isOverlapping(startTime, calculatedEndTime, appt.startTime, appt.endTime)) {
        return res.status(400).json({
          error: 'STAFF_CONFLICT',
          message: `Staff member ${staffDoc.name} is already booked for another appointment from ${appt.startTime} to ${appt.endTime} on ${date}.`
        });
      }
    }

    const appointment = {
      _id: newId(),
      salonId,
      client,
      service,
      staff,
      date,
      startTime,
      endTime: calculatedEndTime,
      status: 'CONFIRMED',
      notes: notes || '',
      createdAt: new Date()
    };

    this.appointments.push(appointment);

    return res.status(201).json({
      message: 'Appointment created successfully',
      appointment: this.populateAppointment(appointment)
    });
  }

  getAppointments(req, res) {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not linked to any salon' });
    }

    const { date, status, staffId } = req.query;
    let list = this.appointments.filter(a => String(a.salonId) === String(salonId));
    if (date) list = list.filter(a => a.date === date);
    if (status) list = list.filter(a => a.status === status);
    if (staffId) list = list.filter(a => String(a.staff) === String(staffId));

    const appointments = list.map(a => this.populateAppointment(a));
    return res.json({ appointments });
  }

  updateAppointmentStatus(req, res) {
    const salonId = req.user.salonId;
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Invalid appointment status' });
    }

    const appointment = this.appointments.find(a => String(a._id) === String(id) && String(a.salonId) === String(salonId));
    if (!appointment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Appointment not found' });
    }

    appointment.status = status;
    return res.json({ message: 'Appointment status updated', appointment: this.populateAppointment(appointment) });
  }

  // 4. Attendance
  checkIn(req, res) {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not linked to any salon' });
    }

    const { latitude, longitude } = req.body;
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

    const salon = this.getSalonById(salonId);
    if (!salon) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Salon not found' });
    }

    const distanceMeters = calculateDistanceMeters(latNum, lonNum, salon.latitude, salon.longitude);
    if (distanceMeters > salon.allowedRadius) {
      return res.status(403).json({
        error: 'OUT_OF_RANGE',
        message: `Check-in rejected: You are ${distanceMeters} meters away from the salon. Allowed radius is ${salon.allowedRadius} meters.`,
        distanceMeters,
        allowedRadius: salon.allowedRadius
      });
    }

    const staffDoc = this.staff.find(st => String(st.userId) === String(req.user.id) && String(st.salonId) === String(salonId));

    const attendance = {
      _id: newId(),
      salonId,
      userId: req.user.id,
      staffId: staffDoc ? staffDoc._id : null,
      latitude: latNum,
      longitude: lonNum,
      distance: distanceMeters,
      status: 'CHECKED_IN',
      timestamp: new Date()
    };

    this.attendances.push(attendance);

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
  }

  getTodayStatus(req, res) {
    const salonId = req.user.salonId;
    const checkInRecord = this.attendances.find(att => 
      String(att.salonId) === String(salonId) && 
      String(att.userId) === String(req.user.id)
    );

    return res.json({
      isCheckedIn: !!checkInRecord,
      checkInTime: checkInRecord ? checkInRecord.timestamp : null,
      record: checkInRecord || null
    });
  }

  getAttendanceList(req, res) {
    const salonId = req.user.salonId;
    const records = this.attendances
      .filter(a => String(a.salonId) === String(salonId))
      .map(att => {
        const user = this.getUserById(att.userId);
        const staff = this.staff.find(s => String(s._id) === String(att.staffId));
        return {
          ...att,
          userId: user ? { name: user.name, email: user.email, role: user.role } : null,
          staffId: staff ? { name: staff.name, specialization: staff.specialization } : null
        };
      });

    return res.json({ records });
  }

  // 5. Plans
  createPlan(req, res) {
    const { name, price, durationInDays, maxStaff, maxAppointments } = req.body;
    if (!name || price === undefined || !durationInDays || !maxStaff || !maxAppointments) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'All plan fields are required.' });
    }

    const plan = {
      _id: newId(),
      name,
      price: Number(price),
      durationInDays: Number(durationInDays),
      maxStaff: Number(maxStaff),
      maxAppointments: Number(maxAppointments),
      createdAt: new Date()
    };

    this.plans.unshift(plan);
    return res.status(201).json({ message: 'Plan created successfully', plan });
  }

  getPlans(req, res) {
    return res.json({ plans: this.plans });
  }

  updatePlan(req, res) {
    const { id } = req.params;
    const plan = this.plans.find(p => String(p._id) === String(id));
    if (!plan) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Plan not found' });
    }

    const { name, price, durationInDays, maxStaff, maxAppointments } = req.body;
    if (name) plan.name = name;
    if (price !== undefined) plan.price = Number(price);
    if (durationInDays) plan.durationInDays = Number(durationInDays);
    if (maxStaff) plan.maxStaff = Number(maxStaff);
    if (maxAppointments) plan.maxAppointments = Number(maxAppointments);

    return res.json({ message: 'Plan updated successfully', plan });
  }

  // 6. Salons
  getSalons(req, res) {
    const salons = this.salons.map(s => {
      const plan = this.plans.find(p => String(p._id) === String(s.currentPlan));
      return { ...s, currentPlan: plan || null };
    });
    return res.json({ salons });
  }

  async createSalon(req, res) {
    const { name, address, latitude, longitude, allowedRadius, ownerName, ownerEmail, ownerPassword } = req.body;
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Name, latitude, and longitude are required' });
    }

    const salon = {
      _id: newId(),
      name,
      address: address || '',
      latitude: Number(latitude),
      longitude: Number(longitude),
      allowedRadius: Number(allowedRadius || 100),
      subscriptionStatus: 'NONE',
      createdAt: new Date()
    };
    this.salons.unshift(salon);

    let owner = null;
    if (ownerEmail && ownerPassword && ownerName) {
      const existingUser = this.users.find(u => u.email.toLowerCase() === ownerEmail.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: 'USER_EXISTS', message: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(ownerPassword, 10);
      owner = {
        _id: newId(),
        name: ownerName,
        email: ownerEmail.toLowerCase(),
        password: hashedPassword,
        role: 'SALON_OWNER',
        salonId: salon._id
      };
      this.users.push(owner);
    }

    return res.status(201).json({ message: 'Salon created successfully', salon, owner: owner ? { id: owner._id, email: owner.email } : null });
  }

  assignOrRenewPlan(req, res) {
    const { salonId } = req.params;
    const { planId, action } = req.body;

    if (!planId || !action || !['ASSIGN', 'RENEW', 'UPGRADE'].includes(action)) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'planId and valid action (ASSIGN, RENEW, UPGRADE) are required' });
    }

    const salon = this.salons.find(s => String(s._id) === String(salonId));
    if (!salon) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Salon not found' });
    }

    const plan = this.plans.find(p => String(p._id) === String(planId));
    if (!plan) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Plan not found' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);

    salon.currentPlan = plan._id;
    salon.subscriptionStartDate = startDate;
    salon.subscriptionEndDate = endDate;
    salon.subscriptionStatus = 'ACTIVE';

    const history = {
      _id: newId(),
      salonId: salon._id,
      planId: plan._id,
      startDate,
      endDate,
      price: plan.price,
      action,
      createdAt: new Date()
    };
    this.subscriptionHistories.unshift(history);

    return res.json({
      message: `Plan successfully ${action.toLowerCase()}ed`,
      salon: { ...salon, currentPlan: plan },
      subscriptionHistory: history
    });
  }

  getSubscriptionStatus(req, res) {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not linked to any salon' });
    }

    const salon = this.getSalonById(salonId);
    if (!salon) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Salon not found' });
    }

    const history = this.subscriptionHistories.filter(h => String(h.salonId) === String(salonId));
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
  }

  updateSalonConfig(req, res) {
    const salonId = req.user.salonId;
    const { name, address, latitude, longitude, allowedRadius } = req.body;

    const salon = this.salons.find(s => String(s._id) === String(salonId));
    if (!salon) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Salon not found' });
    }

    if (name) salon.name = name;
    if (address !== undefined) salon.address = address;
    if (latitude !== undefined) salon.latitude = Number(latitude);
    if (longitude !== undefined) salon.longitude = Number(longitude);
    if (allowedRadius !== undefined) salon.allowedRadius = Number(allowedRadius);

    return res.json({ message: 'Salon configuration updated successfully', salon });
  }

  // 7. Clients
  getClients(req, res) {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not associated with a salon' });
    }

    const clients = this.clients.filter(c => String(c.salonId) === String(salonId));
    return res.json({ clients });
  }

  createClient(req, res) {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'MISSING_SALON', message: 'User is not associated with a salon' });
    }

    const { name, email, phone, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Client name and phone number are required' });
    }

    const client = {
      _id: newId(),
      salonId,
      name,
      email: email || '',
      phone,
      notes: notes || '',
      createdAt: new Date()
    };
    this.clients.unshift(client);

    return res.status(201).json({ message: 'Client created successfully', client });
  }

  // 8. Subscription History
  getAllHistory(req, res) {
    const { salonId } = req.query;
    let list = this.subscriptionHistories;
    if (salonId) {
      list = list.filter(h => String(h.salonId) === String(salonId));
    }

    const history = list.map(h => {
      const salon = this.salons.find(s => String(s._id) === String(h.salonId));
      const plan = this.plans.find(p => String(p._id) === String(h.planId));
      return {
        ...h,
        salonId: salon ? { name: salon.name, address: salon.address } : null,
        planId: plan ? { name: plan.name, price: plan.price, durationInDays: plan.durationInDays, maxStaff: plan.maxStaff, maxAppointments: plan.maxAppointments } : null
      };
    });

    return res.json({ history });
  }
}

const memoryStoreInstance = new MemoryStore();

module.exports = {
  memoryStore: memoryStoreInstance,
  isMemoryMode
};
