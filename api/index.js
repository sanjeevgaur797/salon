const { connectDB } = require('../backend/src/config/db');
const app = require('../backend/src/app');

let isConnected = false;

// Vercel Serverless Function Handler
module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.warn('Serverless DB connection notice:', err.message);
    }
  }
  return app(req, res);
};
