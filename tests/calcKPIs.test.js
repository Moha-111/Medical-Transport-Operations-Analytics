'use strict';

const { calcKPIs } = require('../src/core');

// ── Fixtures ──────────────────────────────────────────────────────────────────
function makeRow(overrides = {}) {
  return {
    ResponseMin: '64',
    DispatchMin: '12',
    TravelMin:   '38',
    DurationMin: '110',
    Status:      'good',
    Center:      'C1',
    Severity:    'standard',
    Shift:       'Morning',
    Month:       'January',
    Hospital:    'King Faisal',
    ...overrides,
  };
}

function makeRows(count, overrides = {}) {
  return Array.from({ length: count }, () => makeRow(overrides));
}

// ── Null / empty input ────────────────────────────────────────────────────────
describe('calcKPIs — null / empty input', () => {
  test('returns null for null', () => expect(calcKPIs(null)).toBeNull());
  test('returns null for undefined', () => expect(calcKPIs(undefined)).toBeNull());
  test('returns null for empty array', () => expect(calcKPIs([])).toBeNull());
});

// ── Shape of result object ────────────────────────────────────────────────────
describe('calcKPIs — result shape', () => {
  test('returns an object with all expected top-level keys', () => {
    const result = calcKPIs([makeRow()]);
    const expectedKeys = [
      'n', 'late', 'good', 'exc', 'lifeSave',
      'avgResp', 'avgDisp', 'avgTravel', 'avgDur',
      'lateRate', 'goodRate', 'excRate', 'lifeSavePct',
      'centers', 'monthlyArr', 'topHospitals', 'shiftMap', 'ts',
    ];
    expectedKeys.forEach(k => expect(result).toHaveProperty(k));
  });

  test('monthlyArr has exactly 12 elements', () => {
    const result = calcKPIs([makeRow()]);
    expect(result.monthlyArr).toHaveLength(12);
  });

  test('ts is a recent Unix timestamp', () => {
    const before = Date.now();
    const result = calcKPIs([makeRow()]);
    const after = Date.now();
    expect(result.ts).toBeGreaterThanOrEqual(before);
    expect(result.ts).toBeLessThanOrEqual(after);
  });
});

// ── Mission counts ────────────────────────────────────────────────────────────
describe('calcKPIs — mission counts', () => {
  test('n equals number of input rows', () => {
    expect(calcKPIs(makeRows(5)).n).toBe(5);
    expect(calcKPIs(makeRows(1)).n).toBe(1);
  });

  test('counts "late" status correctly', () => {
    const rows = [makeRow({ Status: 'late' }), makeRow({ Status: 'late' }), makeRow({ Status: 'good' })];
    const r = calcKPIs(rows);
    expect(r.late).toBe(2);
    expect(r.good).toBe(1);
    expect(r.exc).toBe(0);
  });

  test('counts "good" status correctly', () => {
    const rows = makeRows(4, { Status: 'good' });
    const r = calcKPIs(rows);
    expect(r.good).toBe(4);
    expect(r.late).toBe(0);
  });

  test('non-late, non-good status is counted as exc', () => {
    const rows = [makeRow({ Status: 'excellent' }), makeRow({ Status: 'Excellent' })];
    expect(calcKPIs(rows).exc).toBe(2);
  });

  test('all missions late — lateRate is 100', () => {
    const rows = makeRows(3, { Status: 'late' });
    expect(calcKPIs(rows).lateRate).toBe(100);
    expect(calcKPIs(rows).goodRate).toBe(0);
  });

  test('all missions good — goodRate is 100', () => {
    const rows = makeRows(3, { Status: 'good' });
    expect(calcKPIs(rows).goodRate).toBe(100);
    expect(calcKPIs(rows).lateRate).toBe(0);
  });

  test('single row — rates are 0 or 100', () => {
    const r = calcKPIs([makeRow({ Status: 'late' })]);
    expect(r.lateRate).toBe(100);
    expect(r.n).toBe(1);
  });
});

// ── Numeric averages ──────────────────────────────────────────────────────────
describe('calcKPIs — numeric averages', () => {
  test('avgResp is mean of ResponseMin values, rounded to 1dp', () => {
    const rows = [makeRow({ ResponseMin: '60' }), makeRow({ ResponseMin: '80' })];
    expect(calcKPIs(rows).avgResp).toBe(70.0);
  });

  test('avgDisp reflects DispatchMin values', () => {
    const rows = [makeRow({ DispatchMin: '10' }), makeRow({ DispatchMin: '20' })];
    expect(calcKPIs(rows).avgDisp).toBe(15.0);
  });

  test('avgTravel reflects TravelMin values', () => {
    const rows = [makeRow({ TravelMin: '30' }), makeRow({ TravelMin: '50' })];
    expect(calcKPIs(rows).avgTravel).toBe(40.0);
  });

  test('avgDur reflects DurationMin values', () => {
    const rows = [makeRow({ DurationMin: '100' }), makeRow({ DurationMin: '200' })];
    expect(calcKPIs(rows).avgDur).toBe(150.0);
  });

  test('non-numeric ResponseMin is treated as 0', () => {
    const rows = [makeRow({ ResponseMin: 'N/A' }), makeRow({ ResponseMin: '100' })];
    expect(calcKPIs(rows).avgResp).toBe(50.0);
  });

  test('missing ResponseMin field is treated as 0', () => {
    const rows = [{ Status: 'good' }];
    const r = calcKPIs(rows);
    expect(r.avgResp).toBe(0);
  });
});

// ── Life-saving detection ─────────────────────────────────────────────────────
describe('calcKPIs — life-saving severity', () => {
  test('counts "life-saving" severity', () => {
    const rows = [makeRow({ Severity: 'life-saving' }), makeRow({ Severity: 'standard' })];
    expect(calcKPIs(rows).lifeSave).toBe(1);
    expect(calcKPIs(rows).lifeSavePct).toBe(50);
  });

  test('counts "life saving" (space variant) severity', () => {
    const rows = [makeRow({ Severity: 'life saving' })];
    expect(calcKPIs(rows).lifeSave).toBe(1);
  });

  test('counts "saving" anywhere in severity string', () => {
    const rows = [makeRow({ Severity: 'critical saving' })];
    expect(calcKPIs(rows).lifeSave).toBe(1);
  });

  test('lifeSavePct is 0 when no life-saving missions', () => {
    const rows = makeRows(5, { Severity: 'standard' });
    expect(calcKPIs(rows).lifeSavePct).toBe(0);
  });
});

// ── Center breakdown ──────────────────────────────────────────────────────────
describe('calcKPIs — center breakdown', () => {
  test('aggregates missions per center', () => {
    const rows = [
      makeRow({ Center: 'C1' }), makeRow({ Center: 'C1' }),
      makeRow({ Center: 'C2' }),
    ];
    const r = calcKPIs(rows);
    const c1 = r.centers.find(c => c.id === 'C1');
    const c2 = r.centers.find(c => c.id === 'C2');
    expect(c1.missions).toBe(2);
    expect(c2.missions).toBe(1);
  });

  test('centers are sorted by missions descending', () => {
    const rows = [
      makeRow({ Center: 'Small' }),
      makeRow({ Center: 'Big' }), makeRow({ Center: 'Big' }), makeRow({ Center: 'Big' }),
    ];
    const r = calcKPIs(rows);
    expect(r.centers[0].id).toBe('Big');
  });

  test('center late rate is 0 when no missions are late', () => {
    const rows = makeRows(3, { Center: 'C1', Status: 'good' });
    const r = calcKPIs(rows);
    expect(r.centers[0].late).toBe(0);
  });

  test('center late rate is 100 when all missions are late', () => {
    const rows = makeRows(3, { Center: 'C1', Status: 'late' });
    const r = calcKPIs(rows);
    expect(r.centers[0].late).toBe(100);
  });

  test('rows without a Center value are not included in centers array', () => {
    const rows = [makeRow({ Center: '' }), makeRow({ Center: 'C1' })];
    const r = calcKPIs(rows);
    expect(r.centers).toHaveLength(1);
    expect(r.centers[0].id).toBe('C1');
  });
});

// ── Monthly distribution ──────────────────────────────────────────────────────
describe('calcKPIs — monthly distribution', () => {
  test('monthlyArr index 0 is January', () => {
    const rows = [makeRow({ Month: 'January' }), makeRow({ Month: 'January' })];
    expect(calcKPIs(rows).monthlyArr[0]).toBe(2);
  });

  test('monthlyArr index 11 is December', () => {
    const rows = [makeRow({ Month: 'December' })];
    expect(calcKPIs(rows).monthlyArr[11]).toBe(1);
  });

  test('unknown month values do not appear in monthlyArr totals', () => {
    const rows = [makeRow({ Month: 'Thermidor' })];
    const total = calcKPIs(rows).monthlyArr.reduce((a, b) => a + b, 0);
    expect(total).toBe(0);
  });
});

// ── Hospital leaderboard ──────────────────────────────────────────────────────
describe('calcKPIs — top hospitals', () => {
  test('topHospitals contains at most 5 entries', () => {
    const hospitals = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    const rows = hospitals.flatMap(h => makeRows(2, { Hospital: h }));
    expect(calcKPIs(rows).topHospitals).toHaveLength(5);
  });

  test('topHospitals is sorted by count descending', () => {
    const rows = [
      ...makeRows(3, { Hospital: 'Big' }),
      ...makeRows(1, { Hospital: 'Small' }),
    ];
    const top = calcKPIs(rows).topHospitals;
    expect(top[0].hospital).toBe('Big');
    expect(top[0].count).toBe(3);
  });

  test('hospital pct sums approximately to 100 when only one hospital', () => {
    const rows = makeRows(4, { Hospital: 'Only' });
    expect(calcKPIs(rows).topHospitals[0].pct).toBe(100);
  });
});

// ── Flexible column detection ─────────────────────────────────────────────────
describe('calcKPIs — flexible column name matching', () => {
  test('accepts "TotalResponse" as the response column', () => {
    const rows = [{ TotalResponse: '80', Status: 'good' }];
    expect(calcKPIs(rows).avgResp).toBe(80);
  });

  test('accepts "response" (lowercase) as the response column', () => {
    const rows = [{ response: '55', Status: 'late' }];
    expect(calcKPIs(rows).avgResp).toBe(55);
  });

  test('accepts "centre" (British spelling) as the center column', () => {
    const rows = [{ centre: 'C99', Status: 'good', response: '60' }];
    const r = calcKPIs(rows);
    expect(r.centers[0].id).toBe('C99');
  });
});
