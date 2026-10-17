const { EventEmitter } = require('events');

/**
 * Process-wide event bus used to stream live terminal/log events
 * from the self-healing loop (and other backend activity) to SSE clients.
 */
const eventBus = new EventEmitter();
eventBus.setMaxListeners(50);

function emitLog(entry) {
  const payload = { timestamp: new Date().toISOString(), ...entry };
  eventBus.emit('log', payload);
  return payload;
}

module.exports = { eventBus, emitLog };
