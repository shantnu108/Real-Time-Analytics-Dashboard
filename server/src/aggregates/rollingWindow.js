const Aggregate = require('../models/Aggregate');
const pino = require('pino');
const log = pino();

class RollingWindow {
  constructor({ emitFn, persistIntervalMs = 5000 }) {
    this.buckets = new Map(); // epochSecond -> metrics
    this.emitFn = emitFn;
    this.persistIntervalMs = persistIntervalMs;
    this.persistTimer = setInterval(() => this.persistMaterialized(), this.persistIntervalMs);
  }

  ingest(evt) {
    const epoch = Math.floor(new Date(evt.timestamp).getTime() / 1000);
    let b = this.buckets.get(epoch);
    if (!b) {
      b = { count: 0, uniques: new Set(), routes: new Map(), errors: 0 };
      this.buckets.set(epoch, b);
    }
    b.count += 1;
    b.uniques.add(evt.sessionId);
    b.routes.set(evt.route, (b.routes.get(evt.route) || 0) + 1);
    if (evt.metadata && evt.metadata.error) b.errors += 1;

    this.emitDeltas(epoch);
    this.gc();
  }

  snapshotWindow(endEpoch, seconds) {
    const start = endEpoch - seconds + 1;
    let total = 0, uniques = new Set(), routes = new Map(), errors = 0;
    for (let t = start; t <= endEpoch; t++) {
      const b = this.buckets.get(t);
      if (!b) continue;
      total += b.count;
      b.uniques.forEach(u => uniques.add(u));
      for (const [r, c] of b.routes) routes.set(r, (routes.get(r) || 0) + c);
      errors += b.errors;
    }
    return { total, uniqueSessions: uniques.size, topRoutes: [...routes.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10), errors };
  }

  emitDeltas(epoch) {
    const payload = {
      ts: new Date(epoch * 1000).toISOString(),
      windows: {
        '1s': this.snapshotWindow(epoch, 1),
        '5s': this.snapshotWindow(epoch, 5),
        '60s': this.snapshotWindow(epoch, 60)
      }
    };
    this.emitFn(payload);
  }

  gc() {
    const now = Math.floor(Date.now() / 1000);
    for (const [key] of this.buckets) {
      if (key < now - 300) this.buckets.delete(key);
    }
  }

  async persistMaterialized() {
    try {
      const now = Math.floor(Date.now() / 1000);
      for (const win of [1, 5, 60]) {
        const snap = this.snapshotWindow(now, win);
        const bucketStart = new Date((now - (now % win)) * 1000);
        await Aggregate.updateOne(
          { window: win, bucketStart },
          { window: win, bucketStart, metrics: snap },
          { upsert: true }
        );
      }
    } catch (err) {
      log.error({ err }, 'Persist error');
    }
  }
}

module.exports = RollingWindow;
