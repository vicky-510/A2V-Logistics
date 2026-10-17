// Vercel serverless entry point. Naming this with Vercel's optional
// catch-all convention ([[...slug]]) makes it handle every request under
// /api/* (including bare /api) without needing a custom vercel.json
// routes/builds config — Express itself still does the real /api/*
// sub-routing internally.
require('dotenv').config();
const { createApp } = require('../app');
const { connectDB } = require('../db/connection');

let dbReady = null;
let app = null;

module.exports = async (req, res) => {
  if (!dbReady) {
    dbReady = connectDB();
  }
  await dbReady;
  if (!app) {
    app = createApp();
  }
  return app(req, res);
};
