'use strict';

/**
 * @file breach-detector.js
 * @description KPI threshold monitoring and alert generation.
 *
 * Compares the current KPI snapshot against configured limits and produces
 * structured breach objects for any KPI that exceeds its threshold.
 * Supports both global KPIs and per-center late-rate monitoring.
 */

/**
 * Check KPI values against configured thresholds and return breach alerts.
 *
 * Four breach conditions are evaluated in order:
 *  1. Global average response time  vs. `thresholds.resp`
 *  2. Global late mission rate       vs. `thresholds.late`
 *  3. Annualised daily volume        vs. `thresholds.missionsMax`
 *     (calculated as `curr.n / 365` to normalise the total to a daily figure)
 *  4. Per-center late rate           vs. `thresholds.late + 1.5`
 *     (a 1.5-point buffer above the global threshold for center-level alerts)
 *
 * @param {Object|null} curr       - Current KPI snapshot from calcKPIs()
 * @param {Object|null} prev       - Previous KPI snapshot for delta calculation
 *                                   (pass null when no prior data is available)
 * @param {Object}      thresholds - Threshold config object
 * @param {number}      thresholds.resp         - Max avg response time (minutes)
 * @param {number}      thresholds.late         - Max late rate (%)
 * @param {number}      thresholds.missionsMax  - Max avg daily missions per center
 * @returns {Object[]} Array of breach objects; empty array if all KPIs are within limits.
 *
 * Each breach object has the shape:
 *   { icon, label, val, threshold, delta, unit, severity: 'critical' }
 *
 * @example
 * const alerts = detectBreaches(kpis, prevKpis, { resp: 15, late: 95, missionsMax: 60 });
 * alerts.forEach(a => console.log(`${a.icon} ${a.label}: ${a.val}${a.unit}`));
 */
function detectBreaches(curr, prev, thresholds) {
  if (!curr) return [];

  const breaches = [];

  /**
   * Evaluate a single KPI against a threshold and push a breach object if exceeded.
   *
   * @param {string}        icon      - Display icon (emoji)
   * @param {string}        label     - Arabic alert label shown in the UI
   * @param {number}        val       - Current KPI value
   * @param {number}        prevVal   - Corresponding value from the previous snapshot
   *                                   (used to compute the delta; 0 when no prev)
   * @param {number}        threshold - Numeric threshold to compare against
   * @param {'up'|'down'}   dir       - Breach direction: 'up' fires when val > threshold
   * @param {string}        unit      - Display unit string (e.g. 'د', '%', '')
   */
  const check = (icon, label, val, prevVal, threshold, dir, unit) => {
    const isBreached = dir === 'up' ? val > threshold : val < threshold;
    if (!isBreached) return;

    // Delta: how much did this specific KPI change since the previous snapshot?
    const delta = prev ? +(val - prevVal).toFixed(1) : 0;
    breaches.push({ icon, label, val, threshold, delta, unit, severity: 'critical' });
  };

  // ── Global KPI checks ──────────────────────────────────────────────────────
  const dailyMissions     = curr.n / 365;
  const prevDailyMissions = prev ? (prev.n || 0) / 365 : 0;

  check('⏱', 'وقت الاستجابة الكلي', curr.avgResp,    prev ? prev.avgResp  || 0 : 0, thresholds.resp,        'up', 'د');
  check('📊', 'معدل التأخير',         curr.lateRate,   prev ? prev.lateRate || 0 : 0, thresholds.late,        'up', '%');
  check('📋', 'المهام اليومية',        dailyMissions,   prevDailyMissions,             thresholds.missionsMax, 'up', '');

  // ── Per-center checks ──────────────────────────────────────────────────────
  // Flag individual centers whose late rate exceeds the global threshold by
  // more than 1.5 percentage points (a tighter criterion than the global check).
  if (curr.centers) {
    for (const center of curr.centers) {
      if (center.late > thresholds.late + 1.5) {
        breaches.push({
          icon:      '🏥',
          label:     `مركز ${center.id} — معدل تأخير`,
          val:       center.late,
          threshold: thresholds.late,
          delta:     0,         // No per-center historical snapshot available
          unit:      '%',
          severity:  'critical',
        });
      }
    }
  }

  return breaches;
}

module.exports = { detectBreaches };
