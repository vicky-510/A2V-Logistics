require('dotenv').config();
const { connectDB } = require('../db/connection');
const { Inventory, Shipment } = require('../db/models');
const { calculateShortestPath } = require('../services/routingService');

async function seed() {
  const conn = await connectDB();
  if (!conn) {
    console.error('[Seed] No DB connection — aborting seed.');
    process.exit(1);
  }

  await Inventory.deleteMany({});
  await Shipment.deleteMany({});

  await Inventory.insertMany([
    { godownId: 'Godown A', name: 'Mumbai Central Godown', location: { lat: 19.076, lng: 72.8777 }, stock: 5000, capacity: 10000 },
    { godownId: 'Godown B', name: 'Pune Regional Godown', location: { lat: 18.5204, lng: 73.8567 }, stock: 3000, capacity: 8000 },
  ]);

  const demoPath = calculateShortestPath({ origin: 'Godown A', destination: 'Port 1' });
  await Shipment.create({
    shipmentId: 'SHIP-DEMO-1',
    originGodownId: 'Godown A',
    destination: 'Port 1',
    units: 150,
    status: 'in_transit',
    route: demoPath.route,
    currentPosition: demoPath.route[1],
    carrier: 'Carrier-204',
    etaMinutes: demoPath.etaMinutes,
  });

  console.log('[Seed] Demo inventory and shipment created.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
