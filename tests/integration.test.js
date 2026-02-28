'use strict';

/**
 * Integration tests: verify that the three core pipeline stages
 * (parseCSV → calcKPIs → detectBreaches) work correctly together.
 */

const { parseCSV, calcKPIs, detectBreaches } = require('../src/core');

// ── Shared CSV fixture (10 data rows, 3 centers, 3 hospitals) ─────────────────
const SAMPLE_CSV = [
  'ResponseMin,DispatchMin,TravelMin,DurationMin,Status,Center,Severity,Shift,Month,Hospital',
  '64,12,38,110,late,C1,life-saving,Morning,January,King Faisal',
  '45,10,25,90,good,C1,standard,Evening,January,King Faisal',
  '80,15,45,120,late,C2,standard,Morning,February,National Guard',
  '55,8,30,95,good,C2,life-saving,Night,March,King Faisal',
  '70,12,40,105,late,C1,standard,Morning,April,Prince Sultan',
  '50,9,28,88,good,C3,standard,Evening,May,King Faisal',
  '90,20,50,130,late,C3,life-saving,Night,June,National Guard',
  '42,7,22,80,good,C1,standard,Morning,July,Prince Sultan',
  '75,14,42,115,late,C2,standard,Evening,August,King Faisal',
  '60,11,35,100,good,C3,standard,Night,September,National Guard',
].join('\n');

// ── parseCSV → calcKPIs ───────────────────────────────────────────────────────
describe('integration: parseCSV → calcKPIs', () => {
  let kpis;
  beforeAll(() => {
    kpis = calcKPIs(parseCSV(SAMPLE_CSV));
  });

  test('produces a valid (non-null) KPI result', () => {
    expect(kpis).not.toBeNull();
  });

  test('n matches the number of data rows in the CSV', () => {
    expect(kpis.n).toBe(10);
  });

  test('late count is correct', () => {
    // Rows 1,3,5,7,9 are "late" → 5
    expect(kpis.late).toBe(5);
  });

  test('good count is correct', () => {
    // Rows 2,4,6,8,10 are "good" → 5
    expect(kpis.good).toBe(5);
  });

  test('exc count is 0 — all rows are "late" or "good"', () => {
    expect(kpis.exc).toBe(0);
  });

  test('lifeSave count is correct (3 life-saving rows)', () => {
    // Rows 1 (C1), 4 (C2), 7 (C3) have "life-saving"
    expect(kpis.lifeSave).toBe(3);
  });

  test('lifeSavePct is 30%', () => {
    expect(kpis.lifeSavePct).toBe(30);
  });

  test('avgResp is the mean of all ResponseMin values', () => {
    // (64+45+80+55+70+50+90+42+75+60) / 10 = 631/10 = 63.1
    expect(kpis.avgResp).toBe(63.1);
  });

  test('centers array is populated for all 3 centers', () => {
    expect(kpis.centers).toHaveLength(3);
    const ids = kpis.centers.map(c => c.id).sort();
    expect(ids).toEqual(['C1', 'C2', 'C3']);
  });

  test('C1 has the most missions and is ranked first', () => {
    // C1: rows 1,2,5,8 → 4 missions
    expect(kpis.centers[0].id).toBe('C1');
    expect(kpis.centers[0].missions).toBe(4);
  });

  test('topHospitals is sorted with King Faisal first (appears 5 times)', () => {
    // King Faisal: rows 1,2,4,6,9 → 5 appearances
    expect(kpis.topHospitals[0].hospital).toBe('King Faisal');
    expect(kpis.topHospitals[0].count).toBe(5);
  });

  test('monthlyArr[0] (January) counts 2 missions', () => {
    expect(kpis.monthlyArr[0]).toBe(2);
  });

  test('monthlyArr[1] (February) counts 1 mission', () => {
    expect(kpis.monthlyArr[1]).toBe(1);
  });

  test('months with no missions are 0 in monthlyArr', () => {
    // October, November, December have no rows → indices 9, 10, 11 are 0
    expect(kpis.monthlyArr[9]).toBe(0);
    expect(kpis.monthlyArr[10]).toBe(0);
    expect(kpis.monthlyArr[11]).toBe(0);
  });

  test('shiftMap counts missions per shift correctly', () => {
    // Morning: rows 1,3,5,8 → 4; Evening: rows 2,6,9 → 3; Night: rows 4,7,10 → 3
    expect(kpis.shiftMap.Morning).toBe(4);
    expect(kpis.shiftMap.Evening).toBe(3);
    expect(kpis.shiftMap.Night).toBe(3);
  });
});

// ── calcKPIs → detectBreaches ─────────────────────────────────────────────────
describe('integration: calcKPIs → detectBreaches', () => {
  test('detects avgResp breach when threshold is below computed average', () => {
    const kpis = calcKPIs(parseCSV(SAMPLE_CSV));
    // avgResp ≈ 63.1 > threshold 60
    const breaches = detectBreaches(kpis, null, { resp: 60, late: 40, missionsMax: 50 });
    expect(breaches.find(b => b.label === 'وقت الاستجابة الكلي')).toBeDefined();
  });

  test('detects lateRate breach when threshold is below computed lateRate', () => {
    const kpis = calcKPIs(parseCSV(SAMPLE_CSV));
    // lateRate = 50% > threshold 40%
    const breaches = detectBreaches(kpis, null, { resp: 60, late: 40, missionsMax: 50 });
    expect(breaches.find(b => b.label === 'معدل التأخير')).toBeDefined();
  });

  test('returns no breaches when all thresholds are permissive', () => {
    const safeCsv = [
      'ResponseMin,DispatchMin,TravelMin,DurationMin,Status,Center,Severity,Shift,Month,Hospital',
      '30,5,15,60,good,C1,standard,Morning,January,Hospital A',
      '35,6,18,65,good,C1,standard,Morning,January,Hospital A',
    ].join('\n');
    const kpis = calcKPIs(parseCSV(safeCsv));
    const breaches = detectBreaches(kpis, null, { resp: 70, late: 10, missionsMax: 50 });
    expect(breaches).toEqual([]);
  });

  test('detects center-level breach when a center late rate is high', () => {
    // Build CSV where C1 is late 80% of the time
    const lines = [
      'ResponseMin,DispatchMin,TravelMin,DurationMin,Status,Center,Severity,Shift,Month,Hospital',
      ...Array.from({ length: 8 }, () => '80,10,30,100,late,C1,standard,Morning,January,H1'),
      ...Array.from({ length: 2 }, () => '80,10,30,100,good,C1,standard,Morning,January,H1'),
    ];
    const kpis = calcKPIs(parseCSV(lines.join('\n')));
    // C1 late rate = 80%, threshold=10, center breach triggers at >11.5
    const breaches = detectBreaches(kpis, null, { resp: 70, late: 10, missionsMax: 50 });
    expect(breaches.some(b => b.label.includes('C1'))).toBe(true);
  });
});

// ── Full pipeline: parseCSV → calcKPIs → detectBreaches ──────────────────────
describe('integration: full pipeline edge cases', () => {
  test('empty CSV input produces null KPIs and no breaches', () => {
    const rows = parseCSV('');
    const kpis = calcKPIs(rows);
    const breaches = detectBreaches(kpis, null, { resp: 70, late: 10, missionsMax: 50 });
    expect(kpis).toBeNull();
    expect(breaches).toEqual([]);
  });

  test('header-only CSV produces null KPIs and no breaches', () => {
    const rows = parseCSV('ResponseMin,Status,Center');
    const kpis = calcKPIs(rows);
    const breaches = detectBreaches(kpis, null, { resp: 70, late: 10, missionsMax: 50 });
    expect(kpis).toBeNull();
    expect(breaches).toEqual([]);
  });

  test('single-row CSV processes through full pipeline without throwing', () => {
    const csv = 'ResponseMin,Status,Center,Severity,Shift,Month,Hospital\n65,good,C1,standard,Morning,January,H1';
    const kpis = calcKPIs(parseCSV(csv));
    expect(kpis).not.toBeNull();
    expect(kpis.n).toBe(1);
    expect(() => detectBreaches(kpis, null, { resp: 70, late: 10, missionsMax: 50 })).not.toThrow();
  });

  test('Windows CRLF CSV processes correctly end-to-end', () => {
    const csv = 'ResponseMin,Status,Center,Severity,Shift,Month,Hospital\r\n65,good,C1,standard,Morning,January,H1\r\n80,late,C2,standard,Morning,February,H2';
    const kpis = calcKPIs(parseCSV(csv));
    expect(kpis.n).toBe(2);
    expect(kpis.late).toBe(1);
    expect(kpis.good).toBe(1);
  });

  test('alternate column names (TotalResponse, centre) pipe through correctly', () => {
    const csv = 'TotalResponse,Status,centre,Severity,Shift,Month,Hospital\n55,good,C9,standard,Morning,January,H1';
    const kpis = calcKPIs(parseCSV(csv));
    expect(kpis.avgResp).toBe(55);
    expect(kpis.centers[0].id).toBe('C9');
    const breaches = detectBreaches(kpis, null, { resp: 70, late: 10, missionsMax: 50 });
    expect(breaches).toEqual([]);
  });
});
