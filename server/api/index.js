// Vercel serverless entry point for the whole /api/* surface. The
// accompanying vercel.json rewrites every /api/:path* request here
// (bracket catch-all filenames like [[...slug]].js only match a single
// path segment outside of Next.js, so a rewrite is used instead); Express
// itself does the real /api/* sub-routing internally based on req.url,
// which Vercel leaves untouched by a rewrite.
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
