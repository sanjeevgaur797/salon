const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  // If already connected, reuse connection (critical for Serverless Lambdas)
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  try {
    if (uri) {
      console.log(`[DB] Connecting to MongoDB at: ${uri.replace(/:([^:@]+)@/, ':****@')}`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to MongoDB Database successfully.');
      return;
    }
  } catch (err) {
    console.warn('⚠️ Could not connect to specified MONGODB_URI. Error:', err.message);
  }

  // On Vercel / serverless production, MongoMemoryServer cannot run
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Warning: MONGODB_URI is not set or failed to connect in production/Vercel.');
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
    console.error('❌ Failed to start MongoMemoryServer:', memErr.message);
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, closeDB };
