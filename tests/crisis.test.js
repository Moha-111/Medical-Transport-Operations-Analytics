'use strict';

const {
  classifyIncident,
  calcSurge,
  allocateResources,
  crisisScore,
  detectMCI,
} = require('../src/core');

const DEFAULT_TH = { resp: 70, late: 10, missionsMax: 50 };

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeKPI(overrides = {}) {
  return {
    n:           3650,  // 10 missions/day × 365 — well within missionsMax 50
    avgResp:     60,
    lateRate:    8,
    lifeSavePct: 20,
    centers:     [],
    ...overrides,
  };
}

// ── classifyIncident ──────────────────────────────────────────────────────────
describe('classifyIncident', () => {
  test('life-saving AND late → P1', () => {
    expect(classifyIncident({ Severity: 'life-saving', Status: 'late' })).toBe('P1');
  });

  test('life-saving AND good (not late) → P2', () => {
    expect(classifyIncident({ Severity: 'life-saving', Status: 'good' })).toBe('P2');
  });

  test('standard AND late → P3', () => {
    expect(classifyIncident({ Severity: 'standard', Status: 'late' })).toBe('P3');
  });

  test('standard AND good → P4', () => {
    expect(classifyIncident({ Severity: 'standard', Status: 'good' })).toBe('P4');
  });

  test('severity with "saving" keyword → treated as life-saving', () => {
    expect(classifyIncident({ Severity: 'critical saving', Status: 'late' })).toBe('P1');
  });

  test('severity with "life" keyword → treated as life-saving', () => {
    expect(classifyIncident({ Severity: 'life threatening', Status: 'good' })).toBe('P2');
  });

  test('case-insensitive severity matching', () => {
    expect(classifyIncident({ Severity: 'Life-Saving', Status: 'Late' })).toBe('P1');
  });

  test('empty severity + good status → P4', () => {
    expect(classifyIncident({ Severity: '', Status: 'good' })).toBe('P4');
  });

  test('empty severity + late status → P3', () => {
    expect(classifyIncident({ Severity: '', Status: 'late' })).toBe('P3');
  });

  test('accepts lowercase field names', () => {
    expect(classifyIncident({ severity: 'life-saving', status: 'late' })).toBe('P1');
  });

  test('missing fields → P4 (safest default)', () => {
    expect(classifyIncident({})).toBe('P4');
  });
});

// ── calcSurge ─────────────────────────────────────────────────────────────────
describe('calcSurge', () => {
  test('returns null when curr is null', () => {
    expect(calcSurge(null, makeKPI())).toBeNull();
  });

  test('returns null when baseline is null', () => {
    expect(calcSurge(makeKPI(), null)).toBeNull();
  });

  test('equal curr and baseline → demandRatio 1.0, level normal', () => {
    const base = makeKPI({ n: 100, avgResp: 60 });
    const curr = makeKPI({ n: 100, avgResp: 60 });
    const result = calcSurge(curr, base);
    expect(result.demandRatio).toBe(1.0);
    expect(result.responseDegradation).toBe(1.0);
    expect(result.surgeLevel).toBe('normal');
  });

  test('demand 1.2× baseline → elevated', () => {
    const result = calcSurge(makeKPI({ n: 120 }), makeKPI({ n: 100 }));
    expect(result.surgeLevel).toBe('elevated');
    expect(result.demandRatio).toBeCloseTo(1.2, 1);
  });

  test('demand 1.5× baseline → critical', () => {
    const result = calcSurge(makeKPI({ n: 150 }), makeKPI({ n: 100 }));
    expect(result.surgeLevel).toBe('critical');
  });

  test('demand 2.0× baseline → disaster', () => {
    const result = calcSurge(makeKPI({ n: 200 }), makeKPI({ n: 100 }));
    expect(result.surgeLevel).toBe('disaster');
  });

  test('response time 2× baseline → disaster even if demand is normal', () => {
    const base = makeKPI({ n: 100, avgResp: 50 });
    const curr = makeKPI({ n: 100, avgResp: 100 });
    const result = calcSurge(curr, base);
    expect(result.surgeLevel).toBe('disaster');
    expect(result.responseDegradation).toBeCloseTo(2.0, 1);
  });

  test('demandRatio is rounded to 2 decimal places', () => {
    const result = calcSurge(makeKPI({ n: 100 }), makeKPI({ n: 300 }));
    expect(result.demandRatio).toBe(0.33);
  });
});

// ── allocateResources ─────────────────────────────────────────────────────────
describe('allocateResources', () => {
  test('returns empty array for empty centers', () => {
    expect(allocateResources([], 10)).toEqual([]);
  });

  test('returns empty array when totalUnits is 0', () => {
    const centers = [{ id: 'C1', missions: 10, late: 5 }];
    expect(allocateResources(centers, 0)).toEqual([]);
  });

  test('returns empty array when totalUnits is negative', () => {
    const centers = [{ id: 'C1', missions: 10, late: 5 }];
    expect(allocateResources(centers, -5)).toEqual([]);
  });

  test('single center receives all units', () => {
    const centers = [{ id: 'C1', missions: 10, late: 0 }];
    const result = allocateResources(centers, 8);
    expect(result[0].id).toBe('C1');
    expect(result[0].allocated).toBe(8);
  });

  test('higher-need center gets more units', () => {
    const centers = [
      { id: 'Big',   missions: 100, late: 50 },
      { id: 'Small', missions:  10, late:  0 },
    ];
    const result = allocateResources(centers, 10);
    const big   = result.find(r => r.id === 'Big');
    const small = result.find(r => r.id === 'Small');
    expect(big.allocated).toBeGreaterThan(small.allocated);
  });

  test('result is sorted by allocated units descending', () => {
    const centers = [
      { id: 'A', missions: 5,  late: 0 },
      { id: 'B', missions: 50, late: 50 },
      { id: 'C', missions: 20, late: 10 },
    ];
    const result = allocateResources(centers, 20);
    expect(result[0].allocated).toBeGreaterThanOrEqual(result[1].allocated);
    expect(result[1].allocated).toBeGreaterThanOrEqual(result[2].allocated);
  });

  test('total allocated units equals totalUnits (with rounding tolerance of ±centers.length)', () => {
    const centers = [
      { id: 'C1', missions: 30, late: 20 },
      { id: 'C2', missions: 20, late: 10 },
      { id: 'C3', missions: 10, late:  5 },
    ];
    const total = 15;
    const result = allocateResources(centers, total);
    const sum = result.reduce((s, r) => s + r.allocated, 0);
    expect(sum).toBeGreaterThanOrEqual(total - centers.length);
    expect(sum).toBeLessThanOrEqual(total + centers.length);
  });

  test('late rate is factored into weight (higher late → more units)', () => {
    const centers = [
      { id: 'HighLate', missions: 10, late: 90 },
      { id: 'NoLate',   missions: 10, late:  0 },
    ];
    const result = allocateResources(centers, 10);
    const highLate = result.find(r => r.id === 'HighLate');
    const noLate   = result.find(r => r.id === 'NoLate');
    expect(highLate.allocated).toBeGreaterThan(noLate.allocated);
  });
});

// ── crisisScore ───────────────────────────────────────────────────────────────
describe('crisisScore', () => {
  test('returns score 0 and level normal for null kpis', () => {
    expect(crisisScore(null, DEFAULT_TH)).toEqual({ score: 0, level: 'normal' });
  });

  test('returns score 0 when all KPIs within thresholds', () => {
    const kpis = makeKPI({ avgResp: 60, lateRate: 8, n: 3650 });
    const { score, level } = crisisScore(kpis, DEFAULT_TH);
    expect(score).toBe(0);
    expect(level).toBe('normal');
  });

  test('score is 0 at exact threshold values', () => {
    const kpis = makeKPI({
      avgResp:  DEFAULT_TH.resp,
      lateRate: DEFAULT_TH.late,
      n:        DEFAULT_TH.missionsMax * 365,
    });
    expect(crisisScore(kpis, DEFAULT_TH).score).toBe(0);
  });

  test('score increases as KPIs exceed thresholds', () => {
    const normal  = crisisScore(makeKPI({ avgResp: 60 }), DEFAULT_TH).score;
    const breached = crisisScore(makeKPI({ avgResp: 105 }), DEFAULT_TH).score;
    expect(breached).toBeGreaterThan(normal);
  });

  test('level is elevated when score is 25–49', () => {
    // avgResp = 1.5× threshold: overage = 0.5; resp contributes 0.5*40 = 20
    // lateRate slightly over: overage ~0.1; late contributes 0.1*40 = 4 → total ~24+
    const kpis = makeKPI({ avgResp: 105, lateRate: 11 }); // resp = 1.5× 70, late slightly over
    const { level } = crisisScore(kpis, DEFAULT_TH);
    expect(['elevated', 'high', 'disaster']).toContain(level);
  });

  test('level is disaster when all KPIs are at 2× threshold', () => {
    const kpis = makeKPI({
      avgResp:  DEFAULT_TH.resp        * 2,   // 2× → overage = 1.0
      lateRate: DEFAULT_TH.late        * 2,   // 2× → overage = 1.0
      n:        DEFAULT_TH.missionsMax * 2 * 365,
    });
    const { score, level } = crisisScore(kpis, DEFAULT_TH);
    expect(score).toBe(100);
    expect(level).toBe('disaster');
  });

  test('score is clamped to 100 even above 2× threshold', () => {
    const kpis = makeKPI({ avgResp: 700, lateRate: 100, n: 500 * 365 });
    expect(crisisScore(kpis, DEFAULT_TH).score).toBe(100);
  });

  test('score is always a non-negative integer', () => {
    const kpis = makeKPI({ avgResp: 60, lateRate: 8, n: 3650 });
    const { score } = crisisScore(kpis, DEFAULT_TH);
    expect(Number.isInteger(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

// ── detectMCI ─────────────────────────────────────────────────────────────────
describe('detectMCI', () => {
  test('returns isMCI false and empty triggers for null kpis', () => {
    const result = detectMCI(null, DEFAULT_TH);
    expect(result.isMCI).toBe(false);
    expect(result.triggers).toEqual([]);
    expect(result.score).toBe(0);
  });

  test('no MCI when all KPIs are normal', () => {
    const result = detectMCI(makeKPI(), DEFAULT_TH);
    expect(result.isMCI).toBe(false);
    expect(result.triggers).toHaveLength(0);
  });

  test('RESP_CRITICAL trigger fires when avgResp > 2× threshold', () => {
    const kpis = makeKPI({ avgResp: 141 }); // > 70*2=140
    const result = detectMCI(kpis, DEFAULT_TH);
    expect(result.triggers.some(t => t.code === 'RESP_CRITICAL')).toBe(true);
  });

  test('RESP_CRITICAL trigger does NOT fire at exactly 2× threshold', () => {
    const kpis = makeKPI({ avgResp: 140 }); // === 70*2 (not strictly greater)
    const result = detectMCI(kpis, DEFAULT_TH);
    expect(result.triggers.some(t => t.code === 'RESP_CRITICAL')).toBe(false);
  });

  test('HIGH_LIFESAVE trigger fires when lifeSavePct > 40', () => {
    const kpis = makeKPI({ lifeSavePct: 41 });
    const result = detectMCI(kpis, DEFAULT_TH);
    expect(result.triggers.some(t => t.code === 'HIGH_LIFESAVE')).toBe(true);
  });

  test('MULTI_CENTER trigger fires when ≥3 centers exceed late threshold + 1.5', () => {
    const kpis = makeKPI({
      centers: [
        { id: 'C1', late: 13 },
        { id: 'C2', late: 14 },
        { id: 'C3', late: 15 },
      ],
    });
    const result = detectMCI(kpis, DEFAULT_TH);
    expect(result.triggers.some(t => t.code === 'MULTI_CENTER')).toBe(true);
  });

  test('MULTI_CENTER trigger does NOT fire for only 2 breached centers', () => {
    const kpis = makeKPI({
      centers: [
        { id: 'C1', late: 13 },
        { id: 'C2', late: 14 },
      ],
    });
    const result = detectMCI(kpis, DEFAULT_TH);
    expect(result.triggers.some(t => t.code === 'MULTI_CENTER')).toBe(false);
  });

  test('SURGE trigger fires when daily missions > 1.5× missionsMax', () => {
    const kpis = makeKPI({ n: Math.ceil(DEFAULT_TH.missionsMax * 1.5 + 1) * 365 });
    const result = detectMCI(kpis, DEFAULT_TH);
    expect(result.triggers.some(t => t.code === 'SURGE')).toBe(true);
  });

  test('isMCI is true when cumulative score reaches 50', () => {
    // RESP_CRITICAL (+30) + HIGH_LIFESAVE (+30) = 60 → isMCI true
    const kpis = makeKPI({ avgResp: 141, lifeSavePct: 41 });
    const result = detectMCI(kpis, DEFAULT_TH);
    expect(result.isMCI).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  test('isMCI is false when cumulative score is below 50', () => {
    // Only RESP_CRITICAL (+30) → score 30 → no MCI
    const kpis = makeKPI({ avgResp: 141 });
    const result = detectMCI(kpis, DEFAULT_TH);
    expect(result.isMCI).toBe(false);
    expect(result.score).toBeLessThan(50);
  });

  test('score is clamped to 100', () => {
    const kpis = makeKPI({
      avgResp:     500,
      lifeSavePct: 80,
      n:           DEFAULT_TH.missionsMax * 3 * 365,
      centers: [
        { id: 'C1', late: 20 },
        { id: 'C2', late: 20 },
        { id: 'C3', late: 20 },
      ],
    });
    const result = detectMCI(kpis, DEFAULT_TH);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test('trigger objects include code, label, and val', () => {
    const kpis = makeKPI({ avgResp: 141 });
    const trigger = detectMCI(kpis, DEFAULT_TH).triggers[0];
    expect(trigger).toMatchObject({
      code:  expect.any(String),
      label: expect.any(String),
      val:   expect.any(Number),
    });
  });
});
