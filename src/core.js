/**
 * core.js — Pure business logic extracted from index.html for testability.
 * These functions are intentionally kept identical to their counterparts in
 * index.html so that tests directly validate production code paths.
 */

'use strict';

// ── CSV Parser ────────────────────────────────────────────────────────────────
/**
 * Parse CSV text into an array of plain objects keyed by header row.
 * @param {string} txt - Raw CSV text (comma-delimited, optional quote wrapping)
 * @returns {Object[]} Array of row objects; empty array if fewer than 2 lines.
 */
function parseCSV(txt) {
  const lines = txt.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const hdr = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
    const row = {};
    hdr.forEach((h, i) => row[h] = vals[i] || '');
    return row;
  });
}

// ── KPI Calculator ────────────────────────────────────────────────────────────
/**
 * Compute all dashboard KPIs from an array of mission rows.
 * @param {Object[]|null} rows - Parsed mission data from parseCSV()
 * @returns {Object|null} KPI result object, or null for empty/null input.
 */
function calcKPIs(rows) {
  if (!rows || rows.length === 0) return null;
  const n = rows.length;
  const sample = rows[0];
  const keys = Object.keys(sample);

  const col = (...cands) => {
    for (const c of cands) {
      const k = keys.find(k => k.toLowerCase().replace(/[_\s]/g, '').includes(c.toLowerCase().replace(/[_\s]/g, '')));
      if (k) return k;
    }
    return null;
  };

  const C = {
    resp:     col('ResponseMin', 'TotalResponse', 'response'),
    disp:     col('DispatchMin', 'dispatch'),
    travel:   col('TravelMin', 'travel'),
    dur:      col('DurationMin', 'Duration', 'duration'),
    status:   col('Status', 'status'),
    center:   col('Center', 'centre'),
    severity: col('Severity', 'severity'),
    shift:    col('Shift', 'shift'),
    month:    col('Month', 'month'),
    hospital: col('Hospital', 'hospital'),
  };

  const num = (r, k) => k ? parseFloat(r[k]) || 0 : 0;
  const str = (r, k) => k ? (r[k] || '') : '';

  let sumR = 0, sumD = 0, sumT = 0, sumDur = 0;
  let late = 0, good = 0, exc = 0, lifeSave = 0;
  const centerMap = {}, monthMap = {}, hospitalMap = {}, shiftMap = {};

  for (const row of rows) {
    const r = num(row, C.resp), d = num(row, C.disp), t = num(row, C.travel), dur = num(row, C.dur);
    const st = str(row, C.status).toLowerCase();
    const ct = str(row, C.center);
    const sv = str(row, C.severity).toLowerCase();
    const sh = str(row, C.shift);
    const mo = str(row, C.month);
    const ho = str(row, C.hospital);

    sumR += r; sumD += d; sumT += t; sumDur += dur;
    if (st.includes('late')) late++;
    else if (st.includes('good')) good++;
    else exc++;
    if (sv.includes('life') || sv.includes('saving')) lifeSave++;

    if (ct) { if (!centerMap[ct]) centerMap[ct] = { n: 0, sumR: 0, late: 0, disp: 0 }; centerMap[ct].n++; centerMap[ct].sumR += r; centerMap[ct].disp += d; if (st.includes('late')) centerMap[ct].late++; }
    if (mo) { monthMap[mo] = (monthMap[mo] || 0) + 1; }
    if (ho) { hospitalMap[ho] = (hospitalMap[ho] || 0) + 1; }
    if (sh) { shiftMap[sh] = (shiftMap[sh] || 0) + 1; }
  }

  const avg = (s) => n > 0 ? +(s / n).toFixed(1) : 0;
  const pct = (k) => n > 0 ? +((k / n) * 100).toFixed(1) : 0;

  const centers = Object.entries(centerMap).map(([id, d]) => ({
    id, missions: d.n,
    resp:  d.n > 0 ? +(d.sumR / d.n).toFixed(1) : 0,
    disp:  d.n > 0 ? +(d.disp / d.n).toFixed(1) : 0,
    late:  d.n > 0 ? +((d.late / d.n) * 100).toFixed(1) : 0,
  })).sort((a, b) => b.missions - a.missions);

  const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthlyArr = MONTH_ORDER.map(m => monthMap[m] || 0);

  const topHospitals = Object.entries(hospitalMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([h, c]) => ({ hospital: h, count: c, pct: +(c / n * 100).toFixed(1) }));

  return {
    n, late, good, exc, lifeSave,
    avgResp: avg(sumR), avgDisp: avg(sumD), avgTravel: avg(sumT), avgDur: avg(sumDur),
    lateRate: pct(late), goodRate: pct(good), excRate: pct(exc), lifeSavePct: pct(lifeSave),
    centers, monthlyArr, topHospitals, shiftMap,
    ts: Date.now(),
  };
}

// ── Breach Detector ───────────────────────────────────────────────────────────
/**
 * Check KPIs against thresholds and return any breached alerts.
 * @param {Object|null} curr   - Current KPI result from calcKPIs()
 * @param {Object|null} prev   - Previous KPI result (used for delta calculation)
 * @param {Object}      thresholds - Threshold config: { resp, late, missionsMax }
 * @returns {Object[]} Array of breach objects (empty if none).
 */
function detectBreaches(curr, prev, thresholds) {
  if (!curr) return [];
  const th = thresholds;
  const breaches = [];

  const check = (icon, label, val, threshold, dir, unit) => {
    const breached = dir === 'up' ? val > threshold : val < threshold;
    if (!breached) return;
    const delta = prev ? +(val - (dir === 'up' ? prev.avgResp || 0 : 0)).toFixed(1) : 0;
    breaches.push({ icon, label, val, threshold, delta, unit, severity: 'critical' });
  };

  check('⏱', 'وقت الاستجابة الكلي', curr.avgResp,  th.resp,        'up', 'د');
  check('📊', 'معدل التأخير',         curr.lateRate, th.late,        'up', '%');
  check('📋', 'المهام اليومية',        curr.n / 365,  th.missionsMax, 'up', '');

  if (curr.centers) {
    for (const c of curr.centers) {
      if (c.late > th.late + 1.5) {
        breaches.push({ icon: '🏥', label: `مركز ${c.id} — معدل تأخير`, val: c.late, threshold: th.late, delta: 0, unit: '%', severity: 'critical' });
      }
    }
  }

  return breaches;
}

// ── Prediction Engine ─────────────────────────────────────────────────────────
/**
 * Weighted moving average — later values have higher weight.
 * @param {number[]} arr    - Historical data array
 * @param {number}   window - How many trailing points to use (default 7)
 * @returns {number}
 */
function wma(arr, window = 7) {
  const slice = arr.slice(-window);
  let sumW = 0, sumV = 0;
  slice.forEach((v, i) => { const w = i + 1; sumW += w; sumV += w * v; });
  return sumV / sumW;
}

/**
 * Simple linear trend slope over the last n points.
 * @param {number[]} arr
 * @param {number}   n   - Number of trailing points (default 7)
 * @returns {number} slope (change per step)
 */
function trendSlope(arr, n = 7) {
  const s = arr.slice(-n);
  return (s[s.length - 1] - s[0]) / (s.length - 1);
}

/**
 * Predict a KPI value daysAhead into the future.
 * @param {number[]} historicalData - Array of historical values for the KPI
 * @param {number[]} dayFactors     - Seasonal multipliers indexed by day-of-week (0=Sun)
 * @param {number}   targetDayOfWeek - Day of week for the prediction target (0–6)
 * @param {number}   daysAhead       - How many days ahead (default 1)
 * @returns {{ value: number, confidence: number }}
 */
function predict(historicalData, dayFactors, targetDayOfWeek, daysAhead = 1) {
  const base = wma(historicalData);
  const t = trendSlope(historicalData);
  const seasonal = dayFactors[targetDayOfWeek];
  const raw = (base + t * daysAhead) * seasonal;
  const variance = historicalData.slice(-7).reduce((a, v) => a + Math.abs(v - wma(historicalData)), 0) / 7;
  const confidence = Math.round(Math.max(55, Math.min(93, 92 - variance * 2)));
  return { value: +raw.toFixed(1), confidence };
}

// ── Config Persistence (localStorage) ────────────────────────────────────────
/**
 * Serialise SYNC config state into a storage key.
 * Returns the serialised string (for testability — callers persist it).
 * @param {Object} syncState - The SYNC object to persist
 * @returns {string} JSON string ready for storage
 */
function serialiseCFG(syncState) {
  return JSON.stringify({
    gsUrl:       syncState.gsUrl,
    webhookUrl:  syncState.webhookUrl,
    alertEmail:  syncState.alertEmail,
    intervalMin: syncState.intervalMin,
    thresholds:  syncState.thresholds,
    alertLog:    (syncState.alertLog || []).slice(0, 100),
    alertsToday: syncState.alertsToday,
  });
}

/**
 * Deserialise a stored config string and merge into a target SYNC object.
 * Returns the merged state (for testability — callers write it back).
 * @param {string} raw        - JSON string from storage (or null/undefined)
 * @param {Object} syncState  - Existing SYNC state to merge into
 * @returns {Object} Updated SYNC state
 */
function deserialiseCFG(raw, syncState) {
  try {
    const c = JSON.parse(raw || '{}');
    const out = { ...syncState };
    if (c.gsUrl)       out.gsUrl       = c.gsUrl;
    if (c.webhookUrl)  out.webhookUrl  = c.webhookUrl;
    if (c.alertEmail)  out.alertEmail  = c.alertEmail;
    if (c.intervalMin) out.intervalMin = c.intervalMin;
    if (c.thresholds)  out.thresholds  = { ...syncState.thresholds, ...c.thresholds };
    if (c.alertLog)    out.alertLog    = c.alertLog;
    if (c.alertsToday) out.alertsToday = c.alertsToday;
    return out;
  } catch (e) {
    return { ...syncState };
  }
}

// ── Crisis & Disaster Management ──────────────────────────────────────────────

/**
 * Classify a single mission row into a triage priority level.
 * P1 = highest urgency (life-saving AND delayed), P4 = lowest.
 * @param {Object} row - A parsed mission row from parseCSV()
 * @returns {'P1'|'P2'|'P3'|'P4'}
 */
function classifyIncident(row) {
  const sv = (row.Severity || row.severity || '').toLowerCase();
  const st = (row.Status   || row.status   || '').toLowerCase();
  const isLifeSaving = sv.includes('life') || sv.includes('saving');
  const isLate       = st.includes('late');
  if (isLifeSaving && isLate)  return 'P1'; // critical & delayed
  if (isLifeSaving)            return 'P2'; // critical & on time
  if (isLate)                  return 'P3'; // routine & delayed
  return 'P4';                              // routine & on time
}

/**
 * Measure how much current demand exceeds a historical baseline.
 * @param {Object} currKPIs     - Current KPI result from calcKPIs()
 * @param {Object} baselineKPIs - Baseline (e.g. 30-day average) KPI result
 * @returns {{ demandRatio: number, responseDegradation: number, surgeLevel: string }|null}
 */
function calcSurge(currKPIs, baselineKPIs) {
  if (!currKPIs || !baselineKPIs) return null;
  const demandRatio          = baselineKPIs.n       > 0 ? +(currKPIs.n       / baselineKPIs.n).toFixed(2)       : 1;
  const responseDegradation  = baselineKPIs.avgResp > 0 ? +(currKPIs.avgResp / baselineKPIs.avgResp).toFixed(2) : 1;
  let surgeLevel;
  if      (demandRatio >= 2.0 || responseDegradation >= 2.0) surgeLevel = 'disaster';
  else if (demandRatio >= 1.5 || responseDegradation >= 1.5) surgeLevel = 'critical';
  else if (demandRatio >= 1.2 || responseDegradation >= 1.2) surgeLevel = 'elevated';
  else                                                        surgeLevel = 'normal';
  return { demandRatio, responseDegradation, surgeLevel };
}

/**
 * Distribute available response units across centers weighted by need.
 * Weight = mission volume × (1 + late-rate as fraction).
 * @param {Object[]} centers    - centers array from calcKPIs() result
 * @param {number}   totalUnits - Total available units to distribute
 * @returns {Object[]} Array of { id, allocated } sorted by allocation desc
 */
function allocateResources(centers, totalUnits) {
  if (!centers || centers.length === 0 || totalUnits <= 0) return [];
  const weighted    = centers.map(c => ({ id: c.id, weight: c.missions * (1 + c.late / 100) }));
  const totalWeight = weighted.reduce((s, c) => s + c.weight, 0);
  return weighted
    .map(c => ({
      id:        c.id,
      allocated: totalWeight > 0 ? Math.round((c.weight / totalWeight) * totalUnits) : 0,
    }))
    .sort((a, b) => b.allocated - a.allocated);
}

/**
 * Compute a composite 0–100 crisis severity score from current KPIs vs thresholds.
 * Score 0 = all within threshold; 100 = all at 2× threshold or worse.
 * @param {Object} kpis       - KPI result from calcKPIs()
 * @param {Object} thresholds - { resp, late, missionsMax }
 * @returns {{ score: number, level: 'normal'|'elevated'|'high'|'disaster' }}
 */
function crisisScore(kpis, thresholds) {
  if (!kpis) return { score: 0, level: 'normal' };
  const respOverage = Math.max(0, (kpis.avgResp        - thresholds.resp)        / thresholds.resp);
  const lateOverage = Math.max(0, (kpis.lateRate       - thresholds.late)        / thresholds.late);
  const msnOverage  = Math.max(0, (kpis.n / 365        - thresholds.missionsMax) / thresholds.missionsMax);
  const raw   = respOverage * 40 + lateOverage * 40 + msnOverage * 20;
  const score = Math.round(Math.max(0, Math.min(100, raw)));
  let level;
  if      (score >= 75) level = 'disaster';
  else if (score >= 50) level = 'high';
  else if (score >= 25) level = 'elevated';
  else                  level = 'normal';
  return { score, level };
}

/**
 * Detect a Mass Casualty Incident (MCI) from aggregated KPIs.
 * Returns a score 0–100 and the specific triggers that fired.
 * @param {Object} kpis       - KPI result from calcKPIs()
 * @param {Object} thresholds - { resp, late, missionsMax }
 * @returns {{ isMCI: boolean, score: number, triggers: Object[] }}
 */
function detectMCI(kpis, thresholds) {
  if (!kpis) return { isMCI: false, score: 0, triggers: [] };
  const triggers = [];
  let score = 0;

  if (kpis.avgResp > thresholds.resp * 2) {
    triggers.push({ code: 'RESP_CRITICAL', label: 'وقت استجابة بالغ الخطورة', val: kpis.avgResp });
    score += 30;
  }
  if (kpis.lifeSavePct > 40) {
    triggers.push({ code: 'HIGH_LIFESAVE', label: 'نسبة إنقاذ حياة مرتفعة', val: kpis.lifeSavePct });
    score += 30;
  }
  const breachedCenters = (kpis.centers || []).filter(c => c.late > thresholds.late + 1.5);
  if (breachedCenters.length >= 3) {
    triggers.push({ code: 'MULTI_CENTER', label: 'تجاوز متعدد المراكز', val: breachedCenters.length });
    score += 25;
  }
  if (kpis.n / 365 > thresholds.missionsMax * 1.5) {
    triggers.push({ code: 'SURGE', label: 'ارتفاع حاد في المهام', val: +(kpis.n / 365).toFixed(1) });
    score += 15;
  }

  return { isMCI: score >= 50, score: Math.min(100, score), triggers };
}

module.exports = {
  parseCSV,
  calcKPIs,
  detectBreaches,
  wma,
  trendSlope,
  predict,
  serialiseCFG,
  deserialiseCFG,
  classifyIncident,
  calcSurge,
  allocateResources,
  crisisScore,
  detectMCI,
};
