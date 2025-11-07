// server/routes/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Create HTTP + WebSocket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// --- MongoDB Models ---
const AggregateSchema = new mongoose.Schema({
  ts: { type: Date, required: true, index: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true }
});
const Aggregate = mongoose.model('Aggregate', AggregateSchema);

// Mongo connection (container name 'mongo')
mongoose.connect('mongodb://mongo:27017/realtime', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// --- Health route ---
app.get('/health', (req, res) => res.json({ ok: true }));

// --- Replay route ---
app.get('/replay', async (req, res) => {
  try {
    const { since } = req.query;
    if (!since) return res.status(400).json({ error: 'missing since param' });
    const sinceDate = isNaN(Number(since)) ? new Date(since) : new Date(Number(since));
    const rows = await Aggregate.find({ ts: { $gt: sinceDate } }).sort({ ts: 1 }).lean().exec();
    return res.json({ ok: true, rows });
  } catch (err) {
    console.error('replay error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Simulate aggregate computation & broadcast ---
async function computeAndBroadcastAggregate() {
  const payload = {
    ts: new Date(),
    activeUsers: Math.floor(Math.random() * 100),
    eps: Math.floor(Math.random() * 20),
    topRoutes: ['/home', '/login', '/search'].map(r => ({ route: r, count: Math.floor(Math.random() * 10) })),
    errorRate: Math.random()
  };

try {
  const doc = new Aggregate({ ts: payload.ts, payload, window: payload.window || null, bucketStart: payload.bucketStart || null });
  await doc.save();
} catch (err) {
  // ignore duplicate key errors (E11000) and log others
  if (err && err.code === 11000) {
    console.warn('Duplicate key when saving aggregate — ignoring:', err.keyValue || err.message);
  } else {
    console.error('Error saving aggregate:', err);
  }
}
// broadcast regardless (we keep UI live even if DB insertion duplicates)
io.emit('metrics', { ts: payload.ts, payload });

}

// --- WebSocket handling ---
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('hello', async (data) => {
    try {
      const lastSeen = data?.lastSeen ? new Date(Number(data.lastSeen)) : null;
      if (lastSeen) {
        const missed = await Aggregate.find({ ts: { $gt: lastSeen } }).sort({ ts: 1 }).lean().exec();
        socket.emit('replay', missed);
      } else {
        const latest = await Aggregate.findOne().sort({ ts: -1 }).lean().exec();
        if (latest) socket.emit('metrics', latest);
      }
    } catch (err) {
      console.error('replay failed', err);
    }
  });

  socket.on('disconnect', () => console.log('socket disconnected', socket.id));
});

// --- Ingest event (used by loadgen) ---
app.post('/ingest', async (req, res) => {
  try {
    computeAndBroadcastAggregate().catch(console.error);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start server
const PORT = 4000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
