// server/src/models/Event.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  ts: { type: Date, required: true, index: true },
  // store event details
  payload: { type: mongoose.Schema.Types.Mixed }
}, {
  strict: false
});

// TTL: remove raw events 48 hours after their `ts` timestamp
EventSchema.index({ ts: 1 }, { expireAfterSeconds: 48 * 3600 });

// export with guard
try {
  module.exports = mongoose.model('Event');
} catch (err) {
  module.exports = mongoose.model('Event', EventSchema);
}
