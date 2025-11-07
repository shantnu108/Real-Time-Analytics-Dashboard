// server/src/models/Aggregate.js
const mongoose = require('mongoose');

const AggregateSchema = new mongoose.Schema({
  // timestamp of aggregate (required)
  ts: { type: Date, required: true, index: true },

  // the precomputed payload: { activeUsers, eps, topRoutes, errorRate, ... }
  payload: { type: mongoose.Schema.Types.Mixed, required: true },

  // optional source or bucket metadata (non-unique)
  window: { type: String, default: null },
  bucketStart: { type: Date, default: null }
}, {
  strict: false,      // allow extra fields if any
  timestamps: false
});

// Ensure no unique indexes here (explicitly)
AggregateSchema.index({ ts: 1 }); // normal index only

// Export model; guard against model recompilation in watch/dev
try {
  module.exports = mongoose.model('Aggregate');
} catch (err) {
  module.exports = mongoose.model('Aggregate', AggregateSchema);
}
