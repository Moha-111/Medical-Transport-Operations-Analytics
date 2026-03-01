'use strict';

/**
 * @file integration.test.js
 * @description End-to-end pipeline tests for the Wasl analytics engine.
 *
 * Unlike the unit tests (which verify each function in isolation), these tests
 * exercise the full data pipeline and verify that the modules work correctly
 * together:
 *
 *   CSV text  →  parseCSV  →  calcKPIs  →  detectBreaches
 *                                        →  predict
 *                                        →  serialiseCFG / deserialiseCFG
 *
 * Tests import through core.js to exercise the barrel re-export as well.
 */

const {
  parseCSV,
  calcKPIs,
  detectBreaches,
  predict,
  serialiseCFG,
  deserialiseCFG,
} = require('../src/core');

// ── Shared test dataset ───────────────────────────────────────────────────────

/**
 * Build a CSV string from an array of row descriptor objects.
 * All fields must be provided — no defaults are applied here.
 */
function makeCSV(rowDescriptors) {
  const header = [
    'ResponseMin', 'DispatchMin', 'TravelMin', 'DurationMin',
    'Status', 'Center', 'Severity', 'Shift', 'Month', 'Hospital',
  ].join(',');

  const lines = rowDescriptors.map(r =>
    [r.resp, r.disp, r.travel, r.dur, r.status, r.center, r.sev, r.shift, r.month, r.hosp].join(',')
  );

  return [header, ...lines].join('\n');
}

// Five representative missions covering all status types and severity levels
const SAMPLE_ROWS = [
  { resp: 12, disp: 4, travel: 8,  dur: 100, status: 'good',      center: 'C1', sev: 'standard',    shift: 'Morning', month: 'January',  hosp: 'H1' },
  { resp: 18, disp: 6, travel: 12, dur: 150, status: 'late',      center: 'C2', sev: 'life-saving', shift: 'Evening', month: 'January',  hosp: 'H1' },
  { resp:  9, disp: 3, travel:  6, dur:  90, status: 'excellent', center: 'C1', sev: 'standard',    shift: 'Morning', month: 'February', hosp: 'H2' },
  { resp: 20, disp: 8, travel: 12, dur: 160, status: 'late',      center: 'C3', sev: 'life-saving', shift: 'Night',   month: 'February', hosp: 'H1' },
  { resp: 14, disp: 5, travel:  9, dur: 120, status: 'good',      center: 'C1', sev: 'standard',    shift: 'Morning', month: 'March',    hosp: 'H2' },
];

// ── Pipeline: parseCSV → calcKPIs ─────────────────────────────────────────────

describe('Integration — parseCSV → calcKPIs', () => {
  let rows, kpis;

  beforeAll(() => {
    rows = parseCSV(makeCSV(SAMPLE_ROWS));
    kpis = calcKPIs(rows);
  });

  test('parseCSV produces the correct number of rows', () => {
    expect(rows).toHaveLength(SAMPLE_ROWS.length);
  });

  test('calcKPIs returns a non-null result from real CSV data', () => {
    expect(kpis).not.toBeNull();
    expect(kpis.n).toBe(SAMPLE_ROWS.length);
  });

  test('avgResp is the exact mean of the input response values', () => {
    // (12 + 18 + 9 + 20 + 14) / 5 = 73 / 5 = 14.6
    expect(kpis.avgResp).toBeCloseTo(14.6, 1);
  });

  test('avgDisp is the exact mean of the input dispatch values', () => {
    // (4 + 6 + 3 + 8 + 5) / 5 = 26 / 5 = 5.2
    expect(kpis.avgDisp).toBeCloseTo(5.2, 1);
  });

  test('status counts are correct across parsed rows', () => {
    expect(kpis.late).toBe(2);   // rows 2 and 4
    expect(kpis.good).toBe(2);   // rows 1 and 5
    expect(kpis.exc).toBe(1);    // row 3 (excellent)
  });

  test('lateRate + goodRate + excRate equals exactly 100%', () => {
    const total = +(kpis.lateRate + kpis.goodRate + kpis.excRate).toFixed(1);
    expect(total).toBe(100.0);
  });

  test('life-saving missions are correctly identified through the pipeline', () => {
    expect(kpis.lifeSave).toBe(2);        // rows 2 and 4 have "life-saving" severity
    expect(kpis.lifeSavePct).toBe(40.0);  // 2/5 × 100
  });

  test('monthly distribution reflects the correct month spread', () => {
    expect(kpis.monthlyArr[0]).toBe(2);  // January  (index  0): rows 1 & 2
    expect(kpis.monthlyArr[1]).toBe(2);  // February (index  1): rows 3 & 4
    expect(kpis.monthlyArr[2]).toBe(1);  // March    (index  2): row  5
    expect(kpis.monthlyArr[11]).toBe(0); // December (index 11): none
  });

  test('monthly mission count equals total mission count', () => {
    const total = kpis.monthlyArr.reduce((a, b) => a + b, 0);
    expect(total).toBe(kpis.n);
  });

  test('hospital distribution shows H1 as the top hospital', () => {
    const h1 = kpis.topHospitals.find(h => h.hospital === 'H1');
    const h2 = kpis.topHospitals.find(h => h.hospital === 'H2');
    expect(h1.count).toBe(3);   // rows 1, 2, 4
    expect(h2.count).toBe(2);   // rows 3, 5
    expect(h1.pct).toBe(60.0);
  });

  test('center breakdown contains all three centers', () => {
    const ids = kpis.centers.map(c => c.id).sort();
    expect(ids).toEqual(['C1', 'C2', 'C3']);
  });

  test('center C1 has the correct mission count and avg response time', () => {
    const c1 = kpis.centers.find(c => c.id === 'C1');
    expect(c1.missions).toBe(3);                           // rows 1, 3, 5
    expect(c1.resp).toBeCloseTo((12 + 9 + 14) / 3, 1);   // 11.7 min
  });

  test('sum of center missions equals total missions', () => {
    const total = kpis.centers.reduce((a, c) => a + c.missions, 0);
    expect(total).toBe(kpis.n);
  });

  test('shiftMap accounts for all missions', () => {
    const total = Object.values(kpis.shiftMap).reduce((a, b) => a + b, 0);
    expect(total).toBe(kpis.n);
    expect(kpis.shiftMap['Morning']).toBe(3);
    expect(kpis.shiftMap['Evening']).toBe(1);
    expect(kpis.shiftMap['Night']).toBe(1);
  });
});

// ── Pipeline: calcKPIs → detectBreaches ───────────────────────────────────────

describe('Integration — calcKPIs → detectBreaches', () => {
  test('no alerts are raised when all KPIs are within thresholds', () => {
    const csv = makeCSV([
      { resp: 10, disp: 3, travel: 7,  dur: 80,  status: 'good', center: 'C1', sev: 'standard', shift: 'Morning', month: 'January', hosp: 'H1' },
      { resp: 12, disp: 4, travel: 8,  dur: 100, status: 'good', center: 'C1', sev: 'standard', shift: 'Morning', month: 'January', hosp: 'H1' },
    ]);
    const kpis   = calcKPIs(parseCSV(csv));
    const alerts = detectBreaches(kpis, null, { resp: 100, late: 100, missionsMax: 100 });
    expect(alerts).toEqual([]);
  });

  test('response time breach propagates correctly from parsed data', () => {
    const csv  = makeCSV([
      { resp: 20, disp: 6, travel: 14, dur: 200, status: 'late', center: 'C1', sev: 'standard', shift: 'Morning', month: 'January', hosp: 'H1' },
    ]);
    const kpis   = calcKPIs(parseCSV(csv));
    const alerts = detectBreaches(kpis, null, { resp: 15, late: 100, missionsMax: 100 });
    expect(alerts.find(a => a.label === 'وقت الاستجابة الكلي')).toBeDefined();
  });

  test('center breach fires for a center with 100% late rate above threshold', () => {
    const csv = makeCSV([
      { resp: 10, disp: 4, travel: 6, dur: 90, status: 'late', center: 'C9', sev: 'standard', shift: 'Morning', month: 'January', hosp: 'H1' },
      { resp: 10, disp: 4, travel: 6, dur: 90, status: 'late', center: 'C9', sev: 'standard', shift: 'Morning', month: 'January', hosp: 'H1' },
    ]);
    const kpis   = calcKPIs(parseCSV(csv));
    // C9 late rate = 100%; threshold = 50; 100 > 50 + 1.5 → breach
    const alerts = detectBreaches(kpis, null, { resp: 100, late: 50, missionsMax: 100 });
    expect(alerts.find(a => a.label.includes('C9'))).toBeDefined();
  });

  test('delta is computed correctly when prev KPIs are provided', () => {
    const csv  = makeCSV([
      { resp: 20, disp: 5, travel: 15, dur: 160, status: 'late', center: 'C1', sev: 'standard', shift: 'Morning', month: 'January', hosp: 'H1' },
    ]);
    const curr = calcKPIs(parseCSV(csv));
    const prev = { ...curr, avgResp: 16 };   // simulated previous snapshot
    const alerts = detectBreaches(curr, prev, { resp: 15, late: 100, missionsMax: 100 });
    const rb = alerts.find(a => a.label === 'وقت الاستجابة الكلي');
    expect(rb).toBeDefined();
    expect(rb.delta).toBeCloseTo(curr.avgResp - 16, 1);  // delta = curr - prev
  });
});

// ── Pipeline: predict with realistic history ──────────────────────────────────

describe('Integration — predict with realistic KPI history', () => {
  // Typical Saudi EMS day-of-week pattern (Sunday = start of work week)
  const DAY_FACTORS = [1.10, 1.05, 1.00, 0.95, 0.90, 0.75, 0.85];

  test('prediction falls within a plausible range for stable history', () => {
    const stable = [50, 52, 48, 51, 50, 49, 51];
    const { value, confidence } = predict(stable, DAY_FACTORS, 0, 1);
    // Should be near ~50, scaled up by Sunday factor 1.10 → ~55
    expect(value).toBeGreaterThan(40);
    expect(value).toBeLessThan(80);
    expect(confidence).toBeGreaterThanOrEqual(55);
    expect(confidence).toBeLessThanOrEqual(93);
  });

  test('predicted value grows with a rising trend when projecting further ahead', () => {
    const rising  = [40, 43, 46, 49, 52, 55, 58];
    const neutral = [1, 1, 1, 1, 1, 1, 1];
    const near = predict(rising, neutral, 0, 1).value;
    const far  = predict(rising, neutral, 0, 7).value;
    expect(far).toBeGreaterThan(near);
  });

  test('predicted value falls with a declining trend when projecting further ahead', () => {
    const falling = [80, 75, 70, 65, 60, 55, 50];
    const neutral = [1, 1, 1, 1, 1, 1, 1];
    const near = predict(falling, neutral, 0, 1).value;
    const far  = predict(falling, neutral, 0, 7).value;
    expect(far).toBeLessThan(near);
  });

  test('lower-variance history produces higher confidence than volatile history', () => {
    const stable   = [50, 51, 50, 49, 51, 50, 50];
    const volatile = [20, 80, 25, 75, 30, 70, 35];
    const neutral  = [1, 1, 1, 1, 1, 1, 1];
    const stableConf   = predict(stable,   neutral, 0, 1).confidence;
    const volatileConf = predict(volatile, neutral, 0, 1).confidence;
    expect(stableConf).toBeGreaterThan(volatileConf);
  });
});

// ── Pipeline: config round-trip ───────────────────────────────────────────────

describe('Integration — serialiseCFG → deserialiseCFG round-trip', () => {
  const ORIGINAL = {
    gsUrl:       'https://docs.google.com/test-sheet',
    webhookUrl:  'https://hook.make.com/test123',
    alertEmail:  'ops@hospital.sa',
    intervalMin: 10,
    thresholds:  { resp: 12, late: 90, missionsMax: 55 },
    alertLog:    [{ id: 1, ts: 1706745600000, label: 'test alert' }],
    alertsToday: 3,
  };

  const DEFAULT_SYNC = {
    gsUrl: '', webhookUrl: '', alertEmail: '', intervalMin: 5,
    thresholds: { resp: 70, late: 10, missionsMax: 50 },
    alertLog: [], alertsToday: 0,
  };

  test('serialiseCFG produces valid JSON', () => {
    expect(() => JSON.parse(serialiseCFG(ORIGINAL))).not.toThrow();
  });

  test('all persistable fields survive a full round-trip', () => {
    const json     = serialiseCFG(ORIGINAL);
    const restored = deserialiseCFG(json, DEFAULT_SYNC);

    expect(restored.gsUrl).toBe(ORIGINAL.gsUrl);
    expect(restored.webhookUrl).toBe(ORIGINAL.webhookUrl);
    expect(restored.alertEmail).toBe(ORIGINAL.alertEmail);
    expect(restored.intervalMin).toBe(ORIGINAL.intervalMin);
    expect(restored.thresholds).toEqual(ORIGINAL.thresholds);
    expect(restored.alertLog).toHaveLength(ORIGINAL.alertLog.length);
    expect(restored.alertsToday).toBe(ORIGINAL.alertsToday);
  });

  test('round-trip does not mutate the original SYNC object', () => {
    const snap = { ...DEFAULT_SYNC };
    deserialiseCFG(serialiseCFG(ORIGINAL), DEFAULT_SYNC);
    expect(DEFAULT_SYNC.gsUrl).toBe(snap.gsUrl);
    expect(DEFAULT_SYNC.intervalMin).toBe(snap.intervalMin);
  });
});
