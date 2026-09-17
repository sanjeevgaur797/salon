const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { connectDB, closeDB } = require('./config/db');
const User = require('./models/User');
const Salon = require('./models/Salon');
const Plan = require('./models/Plan');
const SubscriptionHistory = require('./models/SubscriptionHistory');
const Staff = require('./models/Staff');
const Service = require('./models/Service');
const Client = require('./models/Client');
const Appointment = require('./models/Appointment');
const Attendance = require('./models/Attendance');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Clearing existing database records...');

    await Promise.all([
      User.deleteMany({}),
      Salon.deleteMany({}),
      Plan.deleteMany({}),
      SubscriptionHistory.deleteMany({}),
      Staff.deleteMany({}),
      Service.deleteMany({}),
      Client.deleteMany({}),
      Appointment.deleteMany({}),
      Attendance.deleteMany({})
    ]);

    console.log('✨ Creating Plans...');
    const basicPlan = await Plan.create({
      name: 'Basic Salon Plan',
      price: 49,
      durationInDays: 30,
      maxStaff: 3,
      maxAppointments: 100
    });

    const proPlan = await Plan.create({
      name: 'Pro Salon Plan',
      price: 99,
      durationInDays: 30,
      maxStaff: 10,
      maxAppointments: 500
    });

    const enterprisePlan = await Plan.create({
      name: 'Enterprise Plan',
      price: 199,
      durationInDays: 365,
      maxStaff: 50,
      maxAppointments: 5000
    });

    console.log('🏛️ Creating Salons...');
    const startDate = new Date();
    const endDateActive = new Date();
    endDateActive.setDate(startDate.getDate() + 30);

    const endDateExpired = new Date();
    endDateExpired.setDate(startDate.getDate() - 5); // 5 days ago

    // Salon 1: Active subscription
    const glamourSalon = await Salon.create({
      name: 'Glamour Touch Salon',
      address: '123 Beauty Blvd, New Delhi',
      latitude: 28.6139,
      longitude: 77.2090,
      allowedRadius: 100, // 100 meters
      currentPlan: proPlan._id,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDateActive,
      subscriptionStatus: 'ACTIVE'
    });

    await SubscriptionHistory.create({
      salonId: glamourSalon._id,
      planId: proPlan._id,
      startDate,
      endDate: endDateActive,
      price: proPlan.price,
      action: 'ASSIGN'
    });

    // Salon 2: Expired subscription (for testing gating requirement)
    const expiredSalon = await Salon.create({
      name: 'Sunset Glow Salon (Expired)',
      address: '456 Sunset Way, Mumbai',
      latitude: 19.0760,
      longitude: 72.8777,
      allowedRadius: 50,
      currentPlan: basicPlan._id,
      subscriptionStartDate: new Date(startDate.getTime() - 35 * 24 * 60 * 60 * 1000),
      subscriptionEndDate: endDateExpired,
      subscriptionStatus: 'EXPIRED'
    });

    await SubscriptionHistory.create({
      salonId: expiredSalon._id,
      planId: basicPlan._id,
      startDate: new Date(startDate.getTime() - 35 * 24 * 60 * 60 * 1000),
      endDate: endDateExpired,
      price: basicPlan.price,
      action: 'ASSIGN'
    });

    console.log('👤 Creating Users & Password Hashes...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const superAdmin = await User.create({
      name: 'System Super Admin',
      email: 'admin@salon.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN'
    });

    const salonOwner = await User.create({
      name: 'Elena Rostova (Owner)',
      email: 'owner@glamour.com',
      password: hashedPassword,
      role: 'SALON_OWNER',
      salonId: glamourSalon._id
    });

    const receptionist = await User.create({
      name: 'Rachel Green (Receptionist)',
      email: 'receptionist@glamour.com',
      password: hashedPassword,
      role: 'RECEPTIONIST',
      salonId: glamourSalon._id
    });

    const staffUser = await User.create({
      name: 'Alex Johnson (Staff)',
      email: 'staff@glamour.com',
      password: hashedPassword,
      role: 'STAFF',
      salonId: glamourSalon._id
    });

    // Expired salon owner
    await User.create({
      name: 'Marcus Vance (Expired Salon Owner)',
      email: 'expired@salon.com',
      password: hashedPassword,
      role: 'SALON_OWNER',
      salonId: expiredSalon._id
    });

    console.log('✂️ Creating Services...');
    const haircutService = await Service.create({
      salonId: glamourSalon._id,
      name: 'Haircut',
      durationMinutes: 30,
      price: 35
    });

    const facialService = await Service.create({
      salonId: glamourSalon._id,
      name: 'Facial',
      durationMinutes: 60,
      price: 65
    });

    const colorService = await Service.create({
      salonId: glamourSalon._id,
      name: 'Hair Color',
      durationMinutes: 120,
      price: 120
    });

    console.log('💈 Creating Staff Profiles...');
    const staffAlex = await Staff.create({
      userId: staffUser._id,
      salonId: glamourSalon._id,
      name: 'Alex Johnson',
      specialization: 'Hair Color & Styling',
      phone: '+1 555-0101'
    });

    const staffSarah = await Staff.create({
      salonId: glamourSalon._id,
      name: 'Sarah Miller',
      specialization: 'Skincare & Facial Specialist',
      phone: '+1 555-0102'
    });

    console.log('👥 Creating Clients...');
    const clientEmily = await Client.create({
      salonId: glamourSalon._id,
      name: 'Emily Watson',
      email: 'emily@example.com',
      phone: '+1 555-0192',
      notes: 'Prefers organic shampoos'
    });

    const clientMichael = await Client.create({
      salonId: glamourSalon._id,
      name: 'Michael Brown',
      email: 'michael@example.com',
      phone: '+1 555-0184',
      notes: 'Allergic to specific hair dyes'
    });

    const clientJessica = await Client.create({
      salonId: glamourSalon._id,
      name: 'Jessica Alba',
      email: 'jessica@example.com',
      phone: '+1 555-0177',
      notes: 'VIP Customer'
    });

    console.log('📅 Creating Sample Appointments...');
    const todayStr = new Date().toISOString().split('T')[0];

    // Appointment 1: 10:00 to 10:30
    await Appointment.create({
      salonId: glamourSalon._id,
      client: clientEmily._id,
      service: haircutService._id,
      staff: staffAlex._id,
      date: todayStr,
      startTime: '10:00',
      endTime: '10:30',
      status: 'CONFIRMED',
      notes: 'Regular trim and blow dry'
    });

    // Appointment 2: 11:00 to 12:00
    await Appointment.create({
      salonId: glamourSalon._id,
      client: clientMichael._id,
      service: facialService._id,
      staff: staffSarah._id,
      date: todayStr,
      startTime: '11:00',
      endTime: '12:00',
      status: 'CONFIRMED',
      notes: 'Hydrating glow facial'
    });

    // Appointment 3: 14:00 to 16:00
    await Appointment.create({
      salonId: glamourSalon._id,
      client: clientJessica._id,
      service: colorService._id,
      staff: staffAlex._id,
      date: todayStr,
      startTime: '14:00',
      endTime: '16:00',
      status: 'PENDING',
      notes: 'Full balayage treatment'
    });

    console.log('✅ Seed completed successfully!');
    console.log('=====================================================');
    console.log('🔑 TEST CREDENTIALS:');
    console.log('Super Admin  : admin@salon.com       / password123');
    console.log('Salon Owner  : owner@glamour.com     / password123');
    console.log('Receptionist : receptionist@glamour.com / password123');
    console.log('Staff        : staff@glamour.com     / password123');
    console.log('Expired Owner: expired@salon.com    / password123');
    console.log('=====================================================');

  } catch (err) {
    console.error('❌ Error seeding database:', err);
  }
};

if (require.main === module) {
  seedDatabase().then(() => closeDB().then(() => process.exit(0)));
}

module.exports = seedDatabase;
