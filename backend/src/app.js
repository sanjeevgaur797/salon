const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const salonRoutes = require('./routes/salonRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const clientRoutes = require('./routes/clientRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

const mongoose = require('mongoose');

// Dual mounting ensures 100% routing match whether accessed directly, rewritten by Vercel, or proxied
const mountRoutes = (prefix) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/plans`, planRoutes);
  app.use(`${prefix}/salons`, salonRoutes);
  app.use(`${prefix}/subscriptions`, subscriptionRoutes);
  app.use(`${prefix}/appointments`, appointmentRoutes);
  app.use(`${prefix}/clients`, clientRoutes);
  app.use(`${prefix}/attendance`, attendanceRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
};

mountRoutes('/api');
mountRoutes('');

// Health check endpoint
const healthHandler = (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'node-server',
    database: mongoose.connection.readyState === 1 ? 'mongodb-connected' : 'in-memory-demo-mode',
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Root API welcome
const rootHandler = (req, res) => {
  res.json({
    name: 'Salon CRM API',
    version: '1.0.0',
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'mongodb-connected' : 'in-memory-demo-mode'
  });
};

app.get('/api', rootHandler);
app.get('/', rootHandler);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected server error occurred.'
  });
});

module.exports = app;
