'use strict';

const { detectBreaches } = require('../src/core');

// Default thresholds matching the application defaults
const DEFAULT_THRESHOLDS = { resp: 70, late: 10, missionsMax: 50 };

// Helper: build a minimal KPI object
function makeKPI(overrides = {}) {
  return {
    n:        3650,   // 10 missions/day × 365
    avgResp:  60,
    lateRate: 8,
    centers:  [],
    ...overrides,
  };
}

// ── Null / invalid input ──────────────────────────────────────────────────────
describe('detectBreaches — null / invalid curr', () => {
  test('returns empty array for null curr', () => {
    expect(detectBreaches(null, null, DEFAULT_THRESHOLDS)).toEqual([]);
  });

  test('returns empty array for undefined curr', () => {
    expect(detectBreaches(undefined, null, DEFAULT_THRESHOLDS)).toEqual([]);
  });
});

// ── No breaches ───────────────────────────────────────────────────────────────
describe('detectBreaches — all within thresholds', () => {
  test('returns empty array when all KPIs are within limits', () => {
    const curr = makeKPI({ avgResp: 60, lateRate: 8, n: 3650 });
    expect(detectBreaches(curr, null, DEFAULT_THRESHOLDS)).toEqual([]);
  });

  test('returns empty array when values equal thresholds exactly (not exceeded)', () => {
    // Boundary: val === threshold should NOT breach (condition is strictly >)
    const curr = makeKPI({
      avgResp:  DEFAULT_THRESHOLDS.resp,
      lateRate: DEFAULT_THRESHOLDS.late,
      n:        DEFAULT_THRESHOLDS.missionsMax * 365,  // n/365 === missionsMax
    });
    expect(detectBreaches(curr, null, DEFAULT_THRESHOLDS)).toEqual([]);
  });
});

// ── Response time breach ──────────────────────────────────────────────────────
describe('detectBreaches — avgResp breach', () => {
  test('returns a breach when avgResp exceeds threshold', () => {
    const curr = makeKPI({ avgResp: 75 }); // > 70
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    expect(breaches.length).toBeGreaterThanOrEqual(1);
    const rb = breaches.find(b => b.label === 'وقت الاستجابة الكلي');
    expect(rb).toBeDefined();
    expect(rb.val).toBe(75);
    expect(rb.threshold).toBe(70);
    expect(rb.severity).toBe('critical');
    expect(rb.unit).toBe('د');
  });

  test('does not breach when avgResp is exactly at threshold', () => {
    const curr = makeKPI({ avgResp: 70 });
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    expect(breaches.find(b => b.label === 'وقت الاستجابة الكلي')).toBeUndefined();
  });

  test('does not breach when avgResp is below threshold', () => {
    const curr = makeKPI({ avgResp: 50 });
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    expect(breaches.find(b => b.label === 'وقت الاستجابة الكلي')).toBeUndefined();
  });
});

// ── Late rate breach ──────────────────────────────────────────────────────────
describe('detectBreaches — lateRate breach', () => {
  test('returns a breach when lateRate exceeds threshold', () => {
    const curr = makeKPI({ lateRate: 15 }); // > 10
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    const lb = breaches.find(b => b.label === 'معدل التأخير');
    expect(lb).toBeDefined();
    expect(lb.val).toBe(15);
    expect(lb.unit).toBe('%');
  });

  test('does not breach when lateRate equals threshold', () => {
    const curr = makeKPI({ lateRate: 10 });
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    expect(breaches.find(b => b.label === 'معدل التأخير')).toBeUndefined();
  });
});

// ── Daily missions breach ─────────────────────────────────────────────────────
describe('detectBreaches — daily missions breach', () => {
  test('returns a breach when n/365 exceeds missionsMax', () => {
    const curr = makeKPI({ n: 365 * 55 }); // 55 missions/day > 50
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    const mb = breaches.find(b => b.label === 'المهام اليومية');
    expect(mb).toBeDefined();
    expect(mb.val).toBeCloseTo(55, 0);
  });

  test('does not breach when n/365 is below missionsMax', () => {
    const curr = makeKPI({ n: 365 * 40 }); // 40/day
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    expect(breaches.find(b => b.label === 'المهام اليومية')).toBeUndefined();
  });
});

// ── Center-level breach ───────────────────────────────────────────────────────
describe('detectBreaches — center-level breaches', () => {
  test('flags a center whose late rate exceeds threshold + 1.5', () => {
    const curr = makeKPI({
      centers: [{ id: 'C7', late: 13, missions: 100 }], // 13 > 10 + 1.5 = 11.5
    });
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    const cb = breaches.find(b => b.label.includes('C7'));
    expect(cb).toBeDefined();
    expect(cb.val).toBe(13);
    expect(cb.icon).toBe('🏥');
  });

  test('does not flag a center below threshold + 1.5', () => {
    const curr = makeKPI({
      centers: [{ id: 'C1', late: 11, missions: 100 }], // 11 < 11.5
    });
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    expect(breaches.find(b => b.label.includes('C1'))).toBeUndefined();
  });

  test('flags multiple centers simultaneously', () => {
    const curr = makeKPI({
      centers: [
        { id: 'C1', late: 20, missions: 50 },
        { id: 'C2', late: 15, missions: 30 },
        { id: 'C3', late:  5, missions: 80 }, // within limits
      ],
    });
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    const centerBreaches = breaches.filter(b => b.icon === '🏥');
    expect(centerBreaches).toHaveLength(2);
  });

  test('handles missing centers array gracefully', () => {
    const curr = makeKPI();
    delete curr.centers;
    expect(() => detectBreaches(curr, null, DEFAULT_THRESHOLDS)).not.toThrow();
  });
});

// ── Multiple simultaneous global breaches ─────────────────────────────────────
describe('detectBreaches — multiple simultaneous breaches', () => {
  test('reports all global KPI breaches at once', () => {
    const curr = makeKPI({
      avgResp:  80,    // > 70
      lateRate: 20,    // > 10
      n:        365 * 60, // 60/day > 50
    });
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    expect(breaches.length).toBeGreaterThanOrEqual(3);
  });
});

// ── Custom thresholds ─────────────────────────────────────────────────────────
describe('detectBreaches — custom thresholds', () => {
  test('respects a stricter response threshold', () => {
    const curr = makeKPI({ avgResp: 55 });
    const strict = { resp: 50, late: 10, missionsMax: 50 };
    const breaches = detectBreaches(curr, null, strict);
    expect(breaches.find(b => b.label === 'وقت الاستجابة الكلي')).toBeDefined();
  });

  test('respects a looser response threshold', () => {
    const curr = makeKPI({ avgResp: 55 });
    const loose = { resp: 90, late: 10, missionsMax: 50 };
    const breaches = detectBreaches(curr, null, loose);
    expect(breaches.find(b => b.label === 'وقت الاستجابة الكلي')).toBeUndefined();
  });
});

// ── Breach object shape ───────────────────────────────────────────────────────
describe('detectBreaches — breach object shape', () => {
  test('every breach has required fields', () => {
    const curr = makeKPI({ avgResp: 80 });
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    const rb = breaches.find(b => b.label === 'وقت الاستجابة الكلي');
    expect(rb).toMatchObject({
      icon:      expect.any(String),
      label:     expect.any(String),
      val:       expect.any(Number),
      threshold: expect.any(Number),
      delta:     expect.any(Number),
      unit:      expect.any(String),
      severity:  'critical',
    });
  });
});

// ── Empty centers array ───────────────────────────────────────────────────────
describe('detectBreaches — empty centers array', () => {
  test('does not throw when centers is an empty array', () => {
    const curr = makeKPI({ centers: [] });
    expect(() => detectBreaches(curr, null, DEFAULT_THRESHOLDS)).not.toThrow();
  });

  test('produces no center-level breaches when centers is empty', () => {
    const curr = makeKPI({ centers: [] });
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    expect(breaches.filter(b => b.icon === '🏥')).toHaveLength(0);
  });
});

// ── Delta calculation ─────────────────────────────────────────────────────────
describe('detectBreaches — delta values', () => {
  // NOTE: The delta formula in core.js:130 is `val - prev.avgResp` for ALL
  // 'up'-direction checks, not only for the response-time breach.
  // The tests below document the actual runtime behaviour of the code.

  test('delta is 0 for any breach when prev is null', () => {
    const curr = makeKPI({ lateRate: 15 });
    const lb = detectBreaches(curr, null, DEFAULT_THRESHOLDS)
      .find(b => b.label === 'معدل التأخير');
    expect(lb.delta).toBe(0);
  });

  test('delta is 0 for missions breach when prev is null', () => {
    const curr = makeKPI({ n: 365 * 55 });
    const mb = detectBreaches(curr, null, DEFAULT_THRESHOLDS)
      .find(b => b.label === 'المهام اليومية');
    expect(mb.delta).toBe(0);
  });

  test('delta reflects prev.avgResp for a response time breach', () => {
    const curr = makeKPI({ avgResp: 80 });
    const prev = makeKPI({ avgResp: 70 });
    const rb = detectBreaches(curr, prev, DEFAULT_THRESHOLDS)
      .find(b => b.label === 'وقت الاستجابة الكلي');
    expect(rb.delta).toBe(10); // 80 − 70
  });

  test('delta is 0 for response breach when prev is null', () => {
    const curr = makeKPI({ avgResp: 80 });
    const rb = detectBreaches(curr, null, DEFAULT_THRESHOLDS)
      .find(b => b.label === 'وقت الاستجابة الكلي');
    expect(rb.delta).toBe(0);
  });

  test('when prev is provided, delta for lateRate breach is val − prev.avgResp', () => {
    // The formula uses prev.avgResp as the subtrahend for all 'up' breaches.
    // With curr.lateRate=15 and prev.avgResp=60: delta = 15 − 60 = −45
    const curr = makeKPI({ lateRate: 15 });
    const prev = makeKPI({ avgResp: 60 }); // default avgResp in makeKPI
    const lb = detectBreaches(curr, prev, DEFAULT_THRESHOLDS)
      .find(b => b.label === 'معدل التأخير');
    expect(lb.delta).toBe(-45);
  });
});

// ── Center + global breaches simultaneously ───────────────────────────────────
describe('detectBreaches — center + global breach together', () => {
  test('detects a global avgResp breach and a center late breach at the same time', () => {
    const curr = makeKPI({
      avgResp:  80,  // > 70 → global breach
      lateRate:  8,  // within limit
      centers: [{ id: 'C1', late: 20, missions: 100 }], // > 11.5 → center breach
    });
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    expect(breaches.find(b => b.label === 'وقت الاستجابة الكلي')).toBeDefined();
    expect(breaches.find(b => b.label.includes('C1'))).toBeDefined();
  });

  test('detects all 3 global breaches plus a center breach simultaneously', () => {
    const curr = makeKPI({
      avgResp:  80,       // global breach
      lateRate: 20,       // global breach
      n:        365 * 60, // global breach
      centers: [{ id: 'CX', late: 30, missions: 50 }], // center breach
    });
    const breaches = detectBreaches(curr, null, DEFAULT_THRESHOLDS);
    expect(breaches.length).toBeGreaterThanOrEqual(4);
    expect(breaches.filter(b => b.icon === '🏥')).toHaveLength(1);
  });
});
