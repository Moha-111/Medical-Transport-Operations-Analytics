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

  test('accepts "Response_Min" (underscore variant) as the response column', () => {
    const rows = [{ Response_Min: '75', Status: 'good' }];
    expect(calcKPIs(rows).avgResp).toBe(75);
  });

  test('accepts "response min" (space variant) as the response column', () => {
    const rows = [{ 'response min': '65', Status: 'good' }];
    expect(calcKPIs(rows).avgResp).toBe(65);
  });

  test('accepts "dispatch" (shortened) as the dispatch column', () => {
    const rows = [makeRow({ DispatchMin: undefined, dispatch: '8' })];
    // makeRow already sets DispatchMin, so use a plain object here
    const plain = [{ dispatch: '8', Status: 'good' }];
    expect(calcKPIs(plain).avgDisp).toBe(8);
  });
});

// ── shiftMap ──────────────────────────────────────────────────────────────────
describe('calcKPIs — shiftMap', () => {
  test('counts missions per shift correctly', () => {
    const rows = [
      makeRow({ Shift: 'Morning' }),
      makeRow({ Shift: 'Morning' }),
      makeRow({ Shift: 'Evening' }),
      makeRow({ Shift: 'Night' }),
    ];
    const r = calcKPIs(rows);
    expect(r.shiftMap.Morning).toBe(2);
    expect(r.shiftMap.Evening).toBe(1);
    expect(r.shiftMap.Night).toBe(1);
  });

  test('shiftMap does not include rows with empty Shift value', () => {
    const rows = [makeRow({ Shift: '' }), makeRow({ Shift: 'Morning' })];
    const r = calcKPIs(rows);
    expect(Object.keys(r.shiftMap)).toEqual(['Morning']);
  });

  test('shiftMap is an empty object when all Shift values are empty', () => {
    const rows = makeRows(3, { Shift: '' });
    expect(calcKPIs(rows).shiftMap).toEqual({});
  });

  test('shiftMap total equals the number of rows that have a shift value', () => {
    const rows = [
      makeRow({ Shift: 'Morning' }),
      makeRow({ Shift: '' }),
      makeRow({ Shift: 'Evening' }),
    ];
    const r = calcKPIs(rows);
    const total = Object.values(r.shiftMap).reduce((a, b) => a + b, 0);
    expect(total).toBe(2);
  });
});

// ── Center dispatch time ───────────────────────────────────────────────────────
describe('calcKPIs — center disp (average dispatch time)', () => {
  test('center disp is the average DispatchMin for that center', () => {
    const rows = [
      makeRow({ Center: 'C1', DispatchMin: '10' }),
      makeRow({ Center: 'C1', DispatchMin: '20' }),
    ];
    const c1 = calcKPIs(rows).centers.find(c => c.id === 'C1');
    expect(c1.disp).toBe(15.0);
  });

  test('center disp is 0 when dispatch time is missing from all rows', () => {
    const rows = [{ Center: 'C1', Status: 'good' }];
    expect(calcKPIs(rows).centers[0].disp).toBe(0);
  });

  test('center disp is independent across centers', () => {
    const rows = [
      makeRow({ Center: 'C1', DispatchMin: '10' }),
      makeRow({ Center: 'C2', DispatchMin: '30' }),
    ];
    const r = calcKPIs(rows);
    const c1 = r.centers.find(c => c.id === 'C1');
    const c2 = r.centers.find(c => c.id === 'C2');
    expect(c1.disp).toBe(10.0);
    expect(c2.disp).toBe(30.0);
  });
});

// ── All 12 months ─────────────────────────────────────────────────────────────
describe('calcKPIs — full 12-month coverage', () => {
  const ALL_MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  test('all 12 calendar months are correctly indexed in monthlyArr', () => {
    const rows = ALL_MONTHS.map(m => makeRow({ Month: m }));
    const r = calcKPIs(rows);
    expect(r.monthlyArr).toEqual([1,1,1,1,1,1,1,1,1,1,1,1]);
  });

  test('months with multiple missions accumulate correctly', () => {
    const rows = [
      makeRow({ Month: 'March' }),
      makeRow({ Month: 'March' }),
      makeRow({ Month: 'March' }),
      makeRow({ Month: 'July' }),
    ];
    const r = calcKPIs(rows);
    expect(r.monthlyArr[2]).toBe(3); // March = index 2
    expect(r.monthlyArr[6]).toBe(1); // July  = index 6
    // All others should be 0
    const others = r.monthlyArr.filter((_, i) => i !== 2 && i !== 6);
    expect(others.every(v => v === 0)).toBe(true);
  });

  test('monthlyArr total equals n when all months are valid', () => {
    const rows = ALL_MONTHS.map(m => makeRow({ Month: m }));
    const r = calcKPIs(rows);
    const total = r.monthlyArr.reduce((a, b) => a + b, 0);
    expect(total).toBe(r.n);
  });
});
