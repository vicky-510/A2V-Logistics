const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[DB] MONGODB_URI not set — running without persistence.');
    return null;
  }
  try {
    await mongoose.connect(uri);
    console.log('[DB] Connected to MongoDB Atlas');
    return mongoose.connection;
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    return null;
  }
}

module.exports = { connectDB };
