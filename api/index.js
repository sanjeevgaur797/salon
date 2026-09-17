const { connectDB } = require('../backend/src/config/db');
const app = require('../backend/src/app');

// Vercel Serverless Function Handler
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Serverless DB connection error:', err);
  }
  return app(req, res);
};
