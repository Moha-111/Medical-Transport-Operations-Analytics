'use strict';

const { parseCSV, calcKPIs, detectBreaches } = require('../src/core');

const DEFAULT_THRESHOLDS = { resp: 70, late: 10, missionsMax: 50 };

// Builds a CSV string from an array of row objects using the canonical column set.
function buildCSV(rows) {
  const headers = 'ResponseMin,DispatchMin,TravelMin,DurationMin,Status,Center,Severity,Shift,Month,Hospital';
  const lines = rows.map(r =>
    [
      r.ResponseMin ?? '60',
      r.DispatchMin  ?? '10',
      r.TravelMin    ?? '30',
      r.DurationMin  ?? '100',
      r.Status       ?? 'good',
      r.Center       ?? 'C1',
      r.Severity     ?? 'standard',
      r.Shift        ?? 'Morning',
      r.Month        ?? 'January',
      r.Hospital     ?? 'General',
    ].join(',')
  );
  return [headers, ...lines].join('\n');
}

// ── End-to-end pipeline ───────────────────────────────────────────────────────
describe('integration — parseCSV → calcKPIs → detectBreaches', () => {
  test('parses CSV and computes KPIs with correct mission count', () => {
    const csv = buildCSV([
      { Status: 'good' },
      { Status: 'late' },
      { Status: 'good' },
    ]);
    const rows = parseCSV(csv);
    const kpis = calcKPIs(rows);
    expect(kpis.n).toBe(3);
    expect(kpis.good).toBe(2);
    expect(kpis.late).toBe(1);
  });

  test('produces no breaches when all KPIs are within thresholds', () => {
    const csv = buildCSV(
      Array.from({ length: 10 }, () => ({ ResponseMin: '60', Status: 'good' }))
    );
    const kpis = calcKPIs(parseCSV(csv));
    expect(detectBreaches(kpis, null, DEFAULT_THRESHOLDS)).toEqual([]);
  });

  test('flags avgResp breach when response time exceeds threshold', () => {
    const csv = buildCSV(
      Array.from({ length: 5 }, () => ({ ResponseMin: '80', Status: 'good' }))
    );
    const kpis = calcKPIs(parseCSV(csv));
    const breaches = detectBreaches(kpis, null, DEFAULT_THRESHOLDS);
    expect(breaches.some(b => b.label === 'وقت الاستجابة الكلي')).toBe(true);
  });

  test('flags lateRate breach when majority of missions are late', () => {
    const csv = buildCSV(
      Array.from({ length: 10 }, (_, i) => ({ Status: i < 8 ? 'late' : 'good' }))
    );
    const kpis = calcKPIs(parseCSV(csv));
    expect(kpis.lateRate).toBe(80);
    const breaches = detectBreaches(kpis, null, DEFAULT_THRESHOLDS);
    expect(breaches.some(b => b.label === 'معدل التأخير')).toBe(true);
  });

  test('flags both avgResp and lateRate breaches simultaneously', () => {
    const csv = buildCSV(
      Array.from({ length: 10 }, () => ({ ResponseMin: '90', Status: 'late' }))
    );
    const kpis = calcKPIs(parseCSV(csv));
    const breaches = detectBreaches(kpis, null, DEFAULT_THRESHOLDS);
    expect(breaches.some(b => b.label === 'وقت الاستجابة الكلي')).toBe(true);
    expect(breaches.some(b => b.label === 'معدل التأخير')).toBe(true);
  });

  test('center-level breach is detected from parsed CSV data', () => {
    // All missions late → center late rate = 100, well above threshold + 1.5
    const csv = buildCSV(
      Array.from({ length: 10 }, () => ({ Center: 'C99', Status: 'late', ResponseMin: '60' }))
    );
    const kpis = calcKPIs(parseCSV(csv));
    const breaches = detectBreaches(kpis, null, DEFAULT_THRESHOLDS);
    expect(breaches.some(b => b.label.includes('C99'))).toBe(true);
  });

  test('life-saving severity is tracked through the full pipeline', () => {
    const csv = buildCSV([
      { Severity: 'life-saving' },
      { Severity: 'standard' },
      { Severity: 'standard' },
      { Severity: 'standard' },
    ]);
    const kpis = calcKPIs(parseCSV(csv));
    expect(kpis.lifeSave).toBe(1);
    expect(kpis.lifeSavePct).toBe(25);
  });
});
