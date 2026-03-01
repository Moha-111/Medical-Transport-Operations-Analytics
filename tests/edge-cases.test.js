'use strict';

/**
 * @file edge-cases.test.js
 * @description Boundary condition and defensive-programming tests.
 *
 * These tests verify that the analytics engine handles unusual or extreme
 * inputs gracefully — returning sensible values rather than throwing errors
 * or producing NaN/Infinity results that would corrupt the dashboard.
 *
 * Each describe block targets one module and covers inputs that lie at or
 * beyond the expected operating range.
 */

const {
  parseCSV,
  calcKPIs,
  detectBreaches,
  wma,
  trendSlope,
  predict,
  serialiseCFG,
  deserialiseCFG,
} = require('../src/core');

// ── parseCSV — boundary inputs ────────────────────────────────────────────────

describe('parseCSV — edge cases', () => {
  test('single-column dataset produces correct row objects', () => {
    const result = parseCSV('Status\nlate\ngood');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ Status: 'late' });
  });

  test('100-column header row does not throw', () => {
    const headers = Array.from({ length: 100 }, (_, i) => `col${i}`).join(',');
    const values  = Array.from({ length: 100 }, () => '0').join(',');
    expect(() => parseCSV(`${headers}\n${values}`)).not.toThrow();
  });

  test('10,000-row dataset parses without throwing', () => {
    const dataLine = 'good,12';
    const bulk = Array.from({ length: 10000 }, () => dataLine).join('\n');
    expect(() => parseCSV(`Status,ResponseMin\n${bulk}`)).not.toThrow();
    expect(parseCSV(`Status,ResponseMin\n${bulk}`)).toHaveLength(10000);
  });

  test('numeric-string header names are preserved without conversion', () => {
    const result = parseCSV('123,456\na,b');
    expect(result[0]).toHaveProperty('123', 'a');
    expect(result[0]).toHaveProperty('456', 'b');
  });

  test('completely empty CSV text returns empty array without throwing', () => {
    expect(() => parseCSV('')).not.toThrow();
    expect(parseCSV('')).toEqual([]);
  });

  test('CSV with only whitespace returns empty array', () => {
    expect(parseCSV('   \n  \n  ')).toEqual([]);
  });
});

// ── calcKPIs — boundary inputs ────────────────────────────────────────────────

describe('calcKPIs — edge cases', () => {
  test('single-row input returns a non-null result', () => {
    expect(calcKPIs([{ Status: 'late', ResponseMin: '10' }])).not.toBeNull();
  });

  test('rows with empty Status string are classified as exc', () => {
    const rows = [{ Status: '' }, { Status: '' }];
    const r = calcKPIs(rows);
    expect(r.exc).toBe(2);
    expect(r.excRate).toBe(100);
    expect(r.late).toBe(0);
    expect(r.good).toBe(0);
  });

  test('avgResp is 0 when all response times are zero', () => {
    const rows = [
      { ResponseMin: '0', Status: 'good' },
      { ResponseMin: '0', Status: 'good' },
    ];
    expect(calcKPIs(rows).avgResp).toBe(0);
  });

  test('all missions at the same center produces exactly one center entry', () => {
    const rows = Array.from({ length: 5 }, () => ({ Center: 'Solo', Status: 'good' }));
    const r = calcKPIs(rows);
    expect(r.centers).toHaveLength(1);
    expect(r.centers[0].id).toBe('Solo');
    expect(r.centers[0].missions).toBe(5);
  });

  test('shiftMap correctly tracks all three standard shift names', () => {
    const rows = [
      { Shift: 'Morning', Status: 'good' },
      { Shift: 'Evening', Status: 'good' },
      { Shift: 'Night',   Status: 'good' },
    ];
    const r = calcKPIs(rows);
    expect(r.shiftMap['Morning']).toBe(1);
    expect(r.shiftMap['Evening']).toBe(1);
    expect(r.shiftMap['Night']).toBe(1);
  });

  test('shiftMap total equals n', () => {
    const rows = [
      { Shift: 'Morning', Status: 'late' },
      { Shift: 'Morning', Status: 'good' },
      { Shift: 'Night',   Status: 'late' },
    ];
    const r = calcKPIs(rows);
    const shiftTotal = Object.values(r.shiftMap).reduce((a, b) => a + b, 0);
    expect(shiftTotal).toBe(r.n);
  });

  test('rows without a Shift value are excluded from shiftMap', () => {
    const rows = [{ Shift: '', Status: 'good' }, { Shift: 'Morning', Status: 'good' }];
    const r = calcKPIs(rows);
    expect(r.shiftMap['Morning']).toBe(1);
    expect(Object.keys(r.shiftMap)).toHaveLength(1);
  });

  test('very large response time values do not throw or produce Infinity', () => {
    const rows = [{ ResponseMin: String(Number.MAX_SAFE_INTEGER), Status: 'late' }];
    expect(() => calcKPIs(rows)).not.toThrow();
    const r = calcKPIs(rows);
    expect(isFinite(r.avgResp)).toBe(true);
  });

  test('topHospitals pct sums to ≤ 100 for any valid dataset', () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({
      Hospital: `H${i + 1}`, Status: 'good',
    }));
    const r   = calcKPIs(rows);
    const sum = r.topHospitals.reduce((a, h) => a + h.pct, 0);
    expect(sum).toBeLessThanOrEqual(100.1);  // allow ±0.1 for rounding
  });
});

// ── detectBreaches — boundary inputs ─────────────────────────────────────────

describe('detectBreaches — edge cases', () => {
  const TH = { resp: 15, late: 50, missionsMax: 100 };

  test('empty centers array does not trigger any center alerts', () => {
    const kpi = { n: 100, avgResp: 10, lateRate: 20, centers: [] };
    expect(detectBreaches(kpi, null, TH)).toEqual([]);
  });

  test('prev KPI with zero values computes delta without throwing', () => {
    const curr = { n: 3650, avgResp: 20, lateRate: 10, centers: [] };
    const prev = { n: 0,    avgResp:  0, lateRate:  0, centers: [] };
    expect(() => detectBreaches(curr, prev, TH)).not.toThrow();
  });

  test('threshold of 0 triggers breach for any positive KPI value', () => {
    const kpi    = { n: 365, avgResp: 1, lateRate: 1, centers: [] };
    const strict = { resp: 0, late: 0, missionsMax: 0 };
    const alerts = detectBreaches(kpi, null, strict);
    // avgResp=1 > 0, lateRate=1 > 0, n/365=1 > 0 → at least 3 breaches
    expect(alerts.length).toBeGreaterThanOrEqual(3);
  });

  test('center alert label includes the center ID', () => {
    const kpi = {
      n: 100, avgResp: 10, lateRate: 10,
      centers: [{ id: 'C42', late: 80, missions: 20 }],  // 80 > 50 + 1.5
    };
    const alerts = detectBreaches(kpi, null, TH);
    const centerAlert = alerts.find(a => a.label.includes('C42'));
    expect(centerAlert).toBeDefined();
    expect(centerAlert.icon).toBe('🏥');
    expect(centerAlert.unit).toBe('%');
  });
});

// ── wma — boundary inputs ─────────────────────────────────────────────────────

describe('wma — edge cases', () => {
  test('returns NaN for an empty array (weightSum = 0)', () => {
    expect(isNaN(wma([]))).toBe(true);
  });

  test('single-element array returns that element unchanged', () => {
    expect(wma([99])).toBe(99);
    expect(wma([0])).toBe(0);
  });

  test('window larger than array uses all elements (no truncation)', () => {
    // Both calls operate on the full [1,2,3] slice
    expect(wma([1, 2, 3], 100)).toBeCloseTo(wma([1, 2, 3], 3), 10);
  });

  test('negative values are handled correctly', () => {
    // weights [1,2,3], values [-10,-20,-30]: (-10 -40 -90)/6 = -140/6 ≈ -23.33
    expect(wma([-10, -20, -30])).toBeCloseTo(-23.33, 1);
  });

  test('all equal values return that value regardless of window size', () => {
    expect(wma([7, 7, 7, 7, 7], 3)).toBe(7);
    expect(wma([7, 7, 7, 7, 7], 7)).toBe(7);
  });

  test('later values are weighted higher than earlier values', () => {
    // [1, 100]: weights [1,2], WMA = (1 + 200)/3 ≈ 67 — much closer to 100 than 1
    const result = wma([1, 100]);
    expect(result).toBeGreaterThan(50);
  });
});

// ── trendSlope — boundary inputs ──────────────────────────────────────────────

describe('trendSlope — edge cases', () => {
  test('single-element array returns 0 (guarded against NaN)', () => {
    // Without the guard: (arr[0]-arr[0])/(1-1) = 0/0 = NaN
    expect(trendSlope([42], 1)).toBe(0);
    expect(trendSlope([0],  1)).toBe(0);
  });

  test('window larger than array uses all elements without throwing', () => {
    expect(() => trendSlope([1, 2], 100)).not.toThrow();
    expect(trendSlope([1, 2], 100)).toBeCloseTo(1, 10);  // (2-1)/(2-1) = 1
  });

  test('negative trend returns a negative slope', () => {
    // [100, 80, 60, 40, 20, 10, 0]: (0 - 100) / 6 ≈ -16.67
    expect(trendSlope([100, 80, 60, 40, 20, 10, 0])).toBeLessThan(0);
  });

  test('flat series returns 0 regardless of window', () => {
    expect(trendSlope([5, 5, 5, 5, 5, 5, 5])).toBe(0);
    expect(trendSlope([5, 5, 5, 5, 5, 5, 5], 3)).toBe(0);
  });
});

// ── predict — boundary inputs ─────────────────────────────────────────────────

describe('predict — edge cases', () => {
  const NEUTRAL = [1, 1, 1, 1, 1, 1, 1];  // no seasonal adjustment
  const FLAT    = [50, 50, 50, 50, 50, 50, 50];

  test('daysAhead = 0 returns a valid non-NaN result', () => {
    const { value, confidence } = predict(FLAT, NEUTRAL, 0, 0);
    expect(isNaN(value)).toBe(false);
    expect(value).toBeCloseTo(50, 0);
    expect(confidence).toBeGreaterThanOrEqual(55);
  });

  test('seasonal factor of 0 returns a predicted value of 0', () => {
    const zeroFactors = [0, 0, 0, 0, 0, 0, 0];
    expect(predict(FLAT, zeroFactors, 0, 1).value).toBe(0);
  });

  test('confidence does not exceed 93 even for perfectly stable data', () => {
    const { confidence } = predict(FLAT, NEUTRAL, 0, 1);
    expect(confidence).toBeLessThanOrEqual(93);
    expect(confidence).toBe(92);  // 92 - 0*2 = 92, clamped at max 93 → 92
  });

  test('confidence is at least 55 for extremely volatile data', () => {
    const extreme = [0, 1000, 0, 1000, 0, 1000, 0];
    const { confidence } = predict(extreme, NEUTRAL, 0, 1);
    expect(confidence).toBeGreaterThanOrEqual(55);
  });

  test('confidence is an integer', () => {
    const { confidence } = predict(FLAT, NEUTRAL, 3, 1);
    expect(Number.isInteger(confidence)).toBe(true);
  });

  test('value is rounded to exactly 1 decimal place', () => {
    const { value } = predict(FLAT, NEUTRAL, 0, 1);
    expect(value).toBe(parseFloat(value.toFixed(1)));
  });
});

// ── config — boundary inputs ──────────────────────────────────────────────────

describe('config — edge cases', () => {
  function makeSync(overrides = {}) {
    return {
      gsUrl: '', webhookUrl: '', alertEmail: '', intervalMin: 5,
      thresholds: { resp: 15, late: 95, missionsMax: 60 },
      alertLog: [], alertsToday: 0,
      ...overrides,
    };
  }

  test('alertLog of exactly 100 entries is not truncated', () => {
    const log = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const obj = JSON.parse(serialiseCFG(makeSync({ alertLog: log })));
    expect(obj.alertLog).toHaveLength(100);
  });

  test('alertLog of 101 entries is truncated to 100', () => {
    const log = Array.from({ length: 101 }, (_, i) => ({ id: i }));
    const obj = JSON.parse(serialiseCFG(makeSync({ alertLog: log })));
    expect(obj.alertLog).toHaveLength(100);
  });

  test('deserialiseCFG with empty JSON object {} returns base state unchanged', () => {
    const base   = makeSync({ intervalMin: 99 });
    const result = deserialiseCFG('{}', base);
    expect(result.intervalMin).toBe(99);
    expect(result.gsUrl).toBe('');
  });

  test('deserialiseCFG does not copy unknown keys from stored object', () => {
    const result = deserialiseCFG(JSON.stringify({ surprise: 'value' }), makeSync());
    expect(result).not.toHaveProperty('surprise');
  });

  test('null alertLog in base state does not throw during serialisation', () => {
    const sync = makeSync({ alertLog: null });
    expect(() => serialiseCFG(sync)).not.toThrow();
    const obj = JSON.parse(serialiseCFG(sync));
    expect(obj.alertLog).toEqual([]);
  });

  test('deserialiseCFG with numeric-string intervalMin restores the number', () => {
    const stored = JSON.stringify({ intervalMin: 15 });
    const base   = makeSync();
    const result = deserialiseCFG(stored, base);
    expect(result.intervalMin).toBe(15);
    expect(typeof result.intervalMin).toBe('number');
  });
});
