'use strict';

/**
 * @file prediction.js
 * @description Time-series forecasting for operational KPI values.
 *
 * Combines three signals for forward-looking estimates:
 *  1. Recency-weighted baseline  (Weighted Moving Average)
 *  2. Linear trend projection    (endpoint slope × daysAhead)
 *  3. Day-of-week seasonal factor (multiplier for the target weekday)
 */

/**
 * Compute a Weighted Moving Average (WMA) over the last `window` data points.
 *
 * Unlike a Simple Moving Average, WMA assigns higher weight to more recent
 * values: the i-th element in the trailing slice gets weight (i + 1).
 * This makes the average more responsive to recent changes.
 *
 * Formula:
 *   WMA = Σ(weight_i × value_i) / Σ(weight_i)
 *   where weight_i = i + 1  (0-indexed position in the trailing slice)
 *
 * @param {number[]} arr    - Historical data array (at least 1 element)
 * @param {number}   window - Number of trailing points to use (default: 7)
 * @returns {number} Weighted average. Returns NaN if the array is empty.
 *
 * @example
 * wma([1, 2, 3, 4, 5, 6, 7])
 * // weights [1,2,3,4,5,6,7], sum=28, WMA = 140/28 = 5
 *
 * @example
 * wma([10, 50], 2)
 * // weights [1,2], WMA = (10 + 100) / 3 ≈ 36.7  (skews toward recent 50)
 */
function wma(arr, window = 7) {
  const slice = arr.slice(-window);
  let weightSum = 0;
  let valueSum  = 0;

  slice.forEach((value, i) => {
    const weight = i + 1;   // position 0 → weight 1, position 1 → weight 2, …
    weightSum += weight;
    valueSum  += weight * value;
  });

  return valueSum / weightSum;
}

/**
 * Calculate the linear trend slope over the last `n` data points.
 *
 * Uses the endpoint difference method — (last value − first value) / (n − 1) —
 * rather than least-squares regression. This is simpler and sufficient for
 * the daily operational granularity used in Wasl.
 *
 * A positive slope indicates a rising trend; negative indicates falling.
 * Returns 0 (instead of NaN) when fewer than 2 points are available.
 *
 * @param {number[]} arr - Historical data array
 * @param {number}   n   - Number of trailing points to use (default: 7)
 * @returns {number} Slope in units-per-step; 0 if insufficient data.
 *
 * @example
 * trendSlope([10, 12, 14, 16, 18, 20, 22])
 * // (22 − 10) / 6 = 2.0  (increases by 2 per day)
 *
 * @example
 * trendSlope([100, 1, 2, 3], 3)
 * // uses last 3: [1, 2, 3] → (3 − 1) / 2 = 1.0
 */
function trendSlope(arr, n = 7) {
  const slice = arr.slice(-n);

  // Guard: need at least 2 points to compute a meaningful slope
  if (slice.length < 2) return 0;

  return (slice[slice.length - 1] - slice[0]) / (slice.length - 1);
}

/**
 * Predict a KPI value `daysAhead` into the future.
 *
 * Combines three signals:
 *  1. **Recency-weighted baseline** — WMA of last 7 historical points
 *  2. **Linear trend projection**   — trendSlope × daysAhead
 *  3. **Seasonal adjustment**       — day-of-week multiplier
 *
 * Prediction formula:
 *   raw = (WMA_base + slope × daysAhead) × dayFactors[targetDayOfWeek]
 *
 * Confidence is derived from the mean absolute deviation of the last 7 points:
 *   variance   = Σ|value_i − WMA_base| / 7
 *   confidence = clamp(92 − variance × 2,  min=55,  max=93)
 * Lower variance → higher confidence.
 *
 * @param {number[]} historicalData   - Historical KPI values (≥7 recommended)
 * @param {number[]} dayFactors       - 7-element seasonal multipliers, indexed
 *                                     by day-of-week (0 = Sunday, 6 = Saturday)
 * @param {number}   targetDayOfWeek  - Day of week for the prediction target (0–6)
 * @param {number}   daysAhead        - Forecast horizon in days (default: 1)
 * @returns {{ value: number, confidence: number }}
 *   - `value`:      Predicted KPI value, rounded to 1 decimal place
 *   - `confidence`: Integer confidence score in the range [55, 93]
 *
 * @example
 * predict([60,60,60,60,60,60,60], [1,1,1,1,1,1,1], 0, 1)
 * // → { value: 60.0, confidence: 92 }  (flat history = high confidence)
 *
 * @example
 * predict([48,52,55,53,58,60,62], [1.1,1,1,1,1,0.75,0.85], 0, 1)
 * // → { value: ~65.9, confidence: ~84 }  (rising trend + Sunday factor)
 */
function predict(historicalData, dayFactors, targetDayOfWeek, daysAhead = 1) {
  const base     = wma(historicalData);
  const slope    = trendSlope(historicalData);
  const seasonal = dayFactors[targetDayOfWeek];

  // Project forward: baseline + trend, then apply day-of-week multiplier
  const raw = (base + slope * daysAhead) * seasonal;

  // Confidence: lower variance → higher confidence (clamped 55–93)
  const last7    = historicalData.slice(-7);
  const variance = last7.reduce((sum, v) => sum + Math.abs(v - base), 0) / last7.length;
  const confidence = Math.round(Math.max(55, Math.min(93, 92 - variance * 2)));

  return { value: +raw.toFixed(1), confidence };
}

module.exports = { wma, trendSlope, predict };
