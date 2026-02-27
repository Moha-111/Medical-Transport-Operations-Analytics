'use strict';

const { serialiseCFG, deserialiseCFG } = require('../src/core');

// ── Default SYNC state used across tests ──────────────────────────────────────
function makeSYNC(overrides = {}) {
  return {
    gsUrl:       '',
    webhookUrl:  '',
    alertEmail:  '',
    intervalMin: 5,
    thresholds:  { resp: 70, late: 10, missionsMax: 50 },
    alertLog:    [],
    alertsToday: 0,
    ...overrides,
  };
}

// ── serialiseCFG ──────────────────────────────────────────────────────────────
describe('serialiseCFG', () => {
  test('returns a valid JSON string', () => {
    const json = serialiseCFG(makeSYNC());
    expect(() => JSON.parse(json)).not.toThrow();
  });

  test('serialised object contains all expected keys', () => {
    const obj = JSON.parse(serialiseCFG(makeSYNC()));
    expect(obj).toHaveProperty('gsUrl');
    expect(obj).toHaveProperty('webhookUrl');
    expect(obj).toHaveProperty('alertEmail');
    expect(obj).toHaveProperty('intervalMin');
    expect(obj).toHaveProperty('thresholds');
    expect(obj).toHaveProperty('alertLog');
    expect(obj).toHaveProperty('alertsToday');
  });

  test('preserves string values correctly', () => {
    const sync = makeSYNC({ gsUrl: 'https://example.com/sheet', alertEmail: 'a@b.com' });
    const obj = JSON.parse(serialiseCFG(sync));
    expect(obj.gsUrl).toBe('https://example.com/sheet');
    expect(obj.alertEmail).toBe('a@b.com');
  });

  test('preserves threshold values', () => {
    const sync = makeSYNC({ thresholds: { resp: 90, late: 15, missionsMax: 60 } });
    const obj = JSON.parse(serialiseCFG(sync));
    expect(obj.thresholds).toEqual({ resp: 90, late: 15, missionsMax: 60 });
  });

  test('truncates alertLog to 100 entries', () => {
    const alerts = Array.from({ length: 150 }, (_, i) => ({ id: i }));
    const sync = makeSYNC({ alertLog: alerts });
    const obj = JSON.parse(serialiseCFG(sync));
    expect(obj.alertLog).toHaveLength(100);
  });

  test('handles empty alertLog', () => {
    const obj = JSON.parse(serialiseCFG(makeSYNC({ alertLog: [] })));
    expect(obj.alertLog).toEqual([]);
  });

  test('preserves alertsToday counter', () => {
    const obj = JSON.parse(serialiseCFG(makeSYNC({ alertsToday: 7 })));
    expect(obj.alertsToday).toBe(7);
  });
});

// ── deserialiseCFG ────────────────────────────────────────────────────────────
describe('deserialiseCFG', () => {
  test('merges stored values into SYNC state', () => {
    const stored = JSON.stringify({
      gsUrl:       'https://sheet.example.com',
      webhookUrl:  'https://hook.example.com',
      alertEmail:  'test@example.com',
      intervalMin: 10,
      thresholds:  { resp: 80, late: 12, missionsMax: 55 },
      alertLog:    [{ id: 1 }],
      alertsToday: 3,
    });
    const result = deserialiseCFG(stored, makeSYNC());
    expect(result.gsUrl).toBe('https://sheet.example.com');
    expect(result.webhookUrl).toBe('https://hook.example.com');
    expect(result.alertEmail).toBe('test@example.com');
    expect(result.intervalMin).toBe(10);
    expect(result.thresholds.resp).toBe(80);
    expect(result.alertLog).toHaveLength(1);
    expect(result.alertsToday).toBe(3);
  });

  test('preserves existing SYNC values for keys absent in storage', () => {
    const stored = JSON.stringify({ gsUrl: 'https://example.com' });
    const base = makeSYNC({ intervalMin: 15, alertEmail: 'keep@me.com' });
    const result = deserialiseCFG(stored, base);
    expect(result.intervalMin).toBe(15);  // unchanged
    expect(result.alertEmail).toBe('keep@me.com'); // unchanged
    expect(result.gsUrl).toBe('https://example.com'); // updated
  });

  test('partial thresholds are merged, not replaced', () => {
    const stored = JSON.stringify({ thresholds: { resp: 99 } });
    const base = makeSYNC({ thresholds: { resp: 70, late: 10, missionsMax: 50 } });
    const result = deserialiseCFG(stored, base);
    expect(result.thresholds.resp).toBe(99);
    expect(result.thresholds.late).toBe(10);       // original preserved
    expect(result.thresholds.missionsMax).toBe(50); // original preserved
  });

  test('returns base state unchanged for null input', () => {
    const base = makeSYNC();
    const result = deserialiseCFG(null, base);
    expect(result.gsUrl).toBe(base.gsUrl);
    expect(result.intervalMin).toBe(base.intervalMin);
  });

  test('returns base state unchanged for undefined input', () => {
    const base = makeSYNC({ alertsToday: 5 });
    const result = deserialiseCFG(undefined, base);
    expect(result.alertsToday).toBe(5);
  });

  test('returns base state unchanged for empty string input', () => {
    const base = makeSYNC();
    expect(() => deserialiseCFG('', base)).not.toThrow();
    const result = deserialiseCFG('', base);
    expect(result.intervalMin).toBe(base.intervalMin);
  });

  test('returns base state unchanged for malformed JSON', () => {
    const base = makeSYNC({ intervalMin: 99 });
    const result = deserialiseCFG('{ not valid json !!!', base);
    expect(result.intervalMin).toBe(99);
  });

  test('does not mutate the original SYNC object', () => {
    const base = makeSYNC({ gsUrl: 'original' });
    const stored = JSON.stringify({ gsUrl: 'modified' });
    deserialiseCFG(stored, base);
    expect(base.gsUrl).toBe('original'); // original must not be mutated
  });

  test('round-trips through serialiseCFG → deserialiseCFG correctly', () => {
    const original = makeSYNC({
      gsUrl:       'https://roundtrip.test',
      intervalMin: 15,
      alertsToday: 3,
      thresholds:  { resp: 85, late: 12, missionsMax: 55 },
    });
    const serialised = serialiseCFG(original);
    const restored   = deserialiseCFG(serialised, makeSYNC());
    expect(restored.gsUrl).toBe(original.gsUrl);
    expect(restored.intervalMin).toBe(original.intervalMin);
    expect(restored.alertsToday).toBe(original.alertsToday);
    expect(restored.thresholds).toEqual(original.thresholds);
  });
});
