'use strict';

/**
 * @file kpi-calculator.js
 * @description Aggregate patient-transfer mission records into operational KPIs.
 *
 * Accepts an array of parsed mission rows (from csv-parser.js) and produces
 * a flat KPI result object containing:
 *  - Global time averages (response, dispatch, travel, duration)
 *  - Mission status counts and rates (late, good, excellent, life-saving)
 *  - Per-center performance breakdowns
 *  - Monthly mission distribution (12-element array, Jan–Dec)
 *  - Top-5 receiving hospitals by volume
 *  - Shift distribution map
 */

// Month order for the fixed-position 12-element monthly array
const MONTH_ORDER = Object.freeze([
  'January', 'February', 'March',     'April',
  'May',     'June',     'July',      'August',
  'September','October', 'November',  'December',
]);

// ── Column resolution ─────────────────────────────────────────────────────────

/**
 * Resolve a column header key using fuzzy substring matching.
 *
 * Strips underscores, spaces, and case differences before comparing.
 * Returns the first header key whose normalised form contains any of
 * the candidate substrings. Returns null when no match is found.
 *
 * This allows the platform to ingest Excel files whose column names differ
 * slightly from expected names (e.g. "Response Time (min)" vs "response_min").
 *
 * @param {string[]} keys       - All column header keys from the dataset
 * @param {...string} candidates - Candidate substrings to match, in priority order
 * @returns {string|null}
 *
 * @example
 * resolveColumn(['Response Time (min)', 'Status'], 'response')
 * // → 'Response Time (min)'
 *
 * @example
 * resolveColumn(['Centre', 'Status'], 'center', 'centre')
 * // → 'Centre'  (British spelling matched by second candidate)
 */
function resolveColumn(keys, ...candidates) {
  const normalise = s => s.toLowerCase().replace(/[_\s]/g, '');
  for (const candidate of candidates) {
    const normCand = normalise(candidate);
    const match = keys.find(k => normalise(k).includes(normCand));
    if (match) return match;
  }
  return null;
}

// ── Safe cell accessors ───────────────────────────────────────────────────────

/**
 * Safely read a numeric value from a row cell.
 * Returns 0 for null column keys, missing values, or non-numeric strings.
 *
 * @param {Object}      row - Mission row object
 * @param {string|null} key - Column key resolved by resolveColumn (null-safe)
 * @returns {number}
 */
function getNum(row, key) {
  return key ? parseFloat(row[key]) || 0 : 0;
}

/**
 * Safely read a string value from a row cell.
 * Returns '' for null column keys or missing/falsy cell values.
 *
 * @param {Object}      row - Mission row object
 * @param {string|null} key - Column key resolved by resolveColumn (null-safe)
 * @returns {string}
 */
function getStr(row, key) {
  return key ? (row[key] || '') : '';
}

// ── Per-row accumulation ──────────────────────────────────────────────────────

/**
 * Accumulate a single mission row into the grouped aggregation maps.
 * Modifies `ctx.centerMap`, `ctx.monthMap`, `ctx.hospitalMap`, and
 * `ctx.shiftMap` in-place as part of the single-pass main loop.
 *
 * @param {Object} ctx - Shared accumulation context (maps modified in-place)
 * @param {string} ct  - Center ID (empty string → skip center accumulation)
 * @param {string} mo  - Month name (empty string → skip month accumulation)
 * @param {string} ho  - Hospital ID (empty string → skip hospital accumulation)
 * @param {string} sh  - Shift name (empty string → skip shift accumulation)
 * @param {number} r   - Response time for this mission (minutes)
 * @param {number} d   - Dispatch time for this mission (minutes)
 * @param {string} st  - Status string, already lowercased
 */
function accumulateRow(ctx, ct, mo, ho, sh, r, d, st) {
  // Center: track mission count, sum of response times, dispatch times, late count
  if (ct) {
    if (!ctx.centerMap[ct]) {
      ctx.centerMap[ct] = { n: 0, sumR: 0, late: 0, disp: 0 };
    }
    const entry = ctx.centerMap[ct];
    entry.n++;
    entry.sumR += r;
    entry.disp += d;
    if (st.includes('late')) entry.late++;
  }

  // Month: simple occurrence count used for the monthly trend array
  if (mo) ctx.monthMap[mo] = (ctx.monthMap[mo] || 0) + 1;

  // Hospital: simple occurrence count used for the top-hospitals leaderboard
  if (ho) ctx.hospitalMap[ho] = (ctx.hospitalMap[ho] || 0) + 1;

  // Shift: simple occurrence count used for the shift-distribution chart
  if (sh) ctx.shiftMap[sh] = (ctx.shiftMap[sh] || 0) + 1;
}

// ── Main KPI function ─────────────────────────────────────────────────────────

/**
 * Compute all dashboard KPIs from an array of mission records.
 *
 * Performs a single O(n) pass over the data to accumulate time sums,
 * status counts, and grouped lookup maps. Derived metrics (averages,
 * percentages, sorted lists) are then computed from the accumulated totals.
 *
 * Column names are resolved by fuzzy matching so the dataset does not need
 * exact header names. See `resolveColumn` for matching rules.
 *
 * @param {Object[]|null|undefined} rows - Parsed mission data from parseCSV()
 * @returns {Object|null} KPI result object; null for empty or null input.
 *
 * The returned object has the following shape:
 * ```
 * {
 *   n, late, good, exc, lifeSave,           // raw counts
 *   avgResp, avgDisp, avgTravel, avgDur,     // time averages (min, 1dp)
 *   lateRate, goodRate, excRate, lifeSavePct,// rates (%, 1dp)
 *   centers[],      // per-center: { id, missions, resp, disp, late }
 *   monthlyArr[],   // 12-element mission count by month [Jan … Dec]
 *   topHospitals[], // top-5: { hospital, count, pct }
 *   shiftMap,       // { "Morning": n, "Evening": n, "Night": n }
 *   ts,             // Unix timestamp (ms) when this result was computed
 * }
 * ```
 *
 * @example
 * const kpis = calcKPIs(parseCSV(csvText));
 * if (kpis) console.log(`Avg response: ${kpis.avgResp} min — Late rate: ${kpis.lateRate}%`);
 */
function calcKPIs(rows) {
  if (!rows || rows.length === 0) return null;

  const n    = rows.length;
  const keys = Object.keys(rows[0]);

  // ── Resolve column names once (O(k) cost, k = number of columns) ───────────
  const cols = {
    resp:     resolveColumn(keys, 'ResponseMin', 'TotalResponse', 'response'),
    disp:     resolveColumn(keys, 'DispatchMin', 'dispatch'),
    travel:   resolveColumn(keys, 'TravelMin', 'travel'),
    dur:      resolveColumn(keys, 'DurationMin', 'Duration', 'duration'),
    status:   resolveColumn(keys, 'Status', 'status'),
    center:   resolveColumn(keys, 'Center', 'centre'),
    severity: resolveColumn(keys, 'Severity', 'severity'),
    shift:    resolveColumn(keys, 'Shift', 'shift'),
    month:    resolveColumn(keys, 'Month', 'month'),
    hospital: resolveColumn(keys, 'Hospital', 'hospital'),
  };

  // ── Running totals ─────────────────────────────────────────────────────────
  let sumR = 0, sumD = 0, sumT = 0, sumDur = 0;
  let late = 0, good = 0, exc = 0, lifeSave = 0;

  // Shared context object passed to accumulateRow on each iteration
  const ctx = {
    centerMap:   {},
    monthMap:    {},
    hospitalMap: {},
    shiftMap:    {},
  };

  // ── Single-pass aggregation loop ───────────────────────────────────────────
  for (const row of rows) {
    const r   = getNum(row, cols.resp);
    const d   = getNum(row, cols.disp);
    const t   = getNum(row, cols.travel);
    const dur = getNum(row, cols.dur);
    const st  = getStr(row, cols.status).toLowerCase();
    const sv  = getStr(row, cols.severity).toLowerCase();

    // Accumulate time sums for global averages
    sumR   += r;
    sumD   += d;
    sumT   += t;
    sumDur += dur;

    // Classify mission outcome
    if      (st.includes('late')) late++;
    else if (st.includes('good')) good++;
    else                          exc++;  // anything else counts as Excellent

    // Flag life-saving/life-threatening missions by severity keyword
    if (sv.includes('life') || sv.includes('saving')) lifeSave++;

    // Accumulate into the grouped lookup maps
    accumulateRow(
      ctx,
      getStr(row, cols.center),
      getStr(row, cols.month),
      getStr(row, cols.hospital),
      getStr(row, cols.shift),
      r, d, st,
    );
  }

  // ── Derived metric helpers ─────────────────────────────────────────────────

  /** Average of a running sum over n rows, rounded to 1 decimal place. */
  const avg = s => n > 0 ? +(s / n).toFixed(1) : 0;

  /** Percentage of a count over n rows, rounded to 1 decimal place. */
  const pct = k => n > 0 ? +((k / n) * 100).toFixed(1) : 0;

  // ── Build output structures ────────────────────────────────────────────────

  // Per-center stats, sorted by mission volume (highest first)
  const centers = Object.entries(ctx.centerMap)
    .map(([id, c]) => ({
      id,
      missions: c.n,
      resp:  c.n > 0 ? +(c.sumR / c.n).toFixed(1) : 0,
      disp:  c.n > 0 ? +(c.disp / c.n).toFixed(1) : 0,
      late:  c.n > 0 ? +((c.late / c.n) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.missions - a.missions);

  // Monthly distribution as a fixed-order 12-element array (Jan=0 … Dec=11)
  const monthlyArr = MONTH_ORDER.map(month => ctx.monthMap[month] || 0);

  // Top-5 receiving hospitals by mission count
  const topHospitals = Object.entries(ctx.hospitalMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([hospital, count]) => ({
      hospital,
      count,
      pct: +(count / n * 100).toFixed(1),
    }));

  return {
    n, late, good, exc, lifeSave,
    avgResp:     avg(sumR),
    avgDisp:     avg(sumD),
    avgTravel:   avg(sumT),
    avgDur:      avg(sumDur),
    lateRate:    pct(late),
    goodRate:    pct(good),
    excRate:     pct(exc),
    lifeSavePct: pct(lifeSave),
    centers,
    monthlyArr,
    topHospitals,
    shiftMap:    ctx.shiftMap,
    ts:          Date.now(),
  };
}

module.exports = { calcKPIs };
