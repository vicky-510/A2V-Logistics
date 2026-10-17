const mongoose = require('mongoose');
const { Schema } = mongoose;

const InventorySchema = new Schema({
  godownId: { type: String, required: true, unique: true },
  name: String,
  location: { lat: Number, lng: Number },
  stock: { type: Number, default: 0 },
  capacity: { type: Number, default: 10000 },
}, { timestamps: true });

const ShipmentSchema = new Schema({
  shipmentId: { type: String, required: true, unique: true },
  originGodownId: String,
  destination: String,
  units: Number,
  status: {
    type: String,
    enum: ['pending', 'packaging', 'in_transit', 'rerouting', 'dispatched', 'delivered', 'failed'],
    default: 'pending',
  },
  route: [{ lat: Number, lng: Number, label: String }],
  currentPosition: { lat: Number, lng: Number },
  carrier: String,
  etaMinutes: Number,
}, { timestamps: true });

const TelemetryEventSchema = new Schema({
  shipmentId: String,
  type: { type: String, enum: ['roadblock', 'breakdown', 'weather', 'other'], default: 'other' },
  description: String,
  location: { lat: Number, lng: Number },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

const HealingLogSchema = new Schema({
  shipmentId: String,
  triggerEventId: String,
  steps: [{
    actor: String, // e.g. 'logistics_debugger', 'gemini-agent'
    message: String,
    timestamp: { type: Date, default: Date.now },
  }],
  diagnosis: String,
  newRoute: [{ lat: Number, lng: Number, label: String }],
  modelUsed: String,
  fallbackTriggered: { type: Boolean, default: false },
  outcome: { type: String, enum: ['healed', 'failed', 'in_progress'], default: 'in_progress' },
}, { timestamps: true });

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);
const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', ShipmentSchema);
const TelemetryEvent = mongoose.models.TelemetryEvent || mongoose.model('TelemetryEvent', TelemetryEventSchema);
const HealingLog = mongoose.models.HealingLog || mongoose.model('HealingLog', HealingLogSchema);

module.exports = { Inventory, Shipment, TelemetryEvent, HealingLog };
