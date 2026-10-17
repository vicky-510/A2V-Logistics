require('dotenv').config();
const { createApp } = require('./app');
const { connectDB } = require('./db/connection');

async function main() {
  await connectDB();
  const app = createApp();
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`[Server] AutoRoute AI backend listening on port ${port}`);
  });
}

main();
