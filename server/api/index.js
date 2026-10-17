// Vercel serverless entry point. Vercel routes all /api/* requests here
// per vercel.json; the Express app itself defines the /api/* routes.
require('dotenv').config();
const { createApp } = require('../app');
const { connectDB } = require('../db/connection');

let dbReady = null;

module.exports = async (req, res) => {
  if (!dbReady) {
    dbReady = connectDB();
  }
  await dbReady;
  const app = createApp();
  return app(req, res);
};
