const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

let mongoServer;

const connectDB = async () => {
  // If already connected, reuse connection (critical for Serverless Lambdas)
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  try {
    if (uri && uri.trim().length > 0) {
      console.log(`[DB] Connecting to MongoDB at: ${uri.replace(/:([^:@]+)@/, ':****@')}`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      console.log('✅ Connected to MongoDB Database successfully.');

      // Auto-seed if database is fresh/empty
      try {
        const User = require('../models/User');
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          console.log('🌱 Cloud database is empty. Seeding initial data...');
          const seedDatabase = require('../seed');
          await seedDatabase();
        }
      } catch (seedErr) {
        console.warn('Auto-seed check note:', seedErr.message);
      }
      return;
    }
  } catch (err) {
    console.warn('⚠️ Could not connect to specified MONGODB_URI. Falling back to in-memory demo mode. Error:', err.message);
  }

  // On Vercel / serverless production, use the zero-config in-memory store
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.log('ℹ️ [DB] Running in Zero-Config High-Performance In-Memory Demo Mode for Vercel.');
    return;
  }

  // Fallback to in-memory MongoDB for local zero-config development
  try {
    console.log('[DB] Starting MongoDB Memory Server for instant zero-config evaluation...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log(`✅ Connected to MongoMemoryServer successfully at: ${mongoUri}`);
  } catch (memErr) {
    console.log('ℹ️ MongoMemoryServer unavailable, using In-Memory Store fallback.');
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, closeDB };
