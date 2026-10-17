const dns = require('dns');
const mongoose = require('mongoose');

// On some Windows setups, Node's built-in resolver (c-ares) fails SRV
// lookups for mongodb+srv:// URIs with ECONNREFUSED even though the OS
// resolver works fine. Prepending public DNS servers works around it
// without requiring any machine-level configuration changes.
try {
  dns.setServers([...dns.getServers(), '8.8.8.8', '1.1.1.1']);
} catch {
  // non-fatal — fall through to the system default resolver
}

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
