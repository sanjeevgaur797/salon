require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const seedDatabase = require('./seed');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is fresh/empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🔄 Database is empty. Running initial seed...');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`🚀 Salon CRM Backend Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
