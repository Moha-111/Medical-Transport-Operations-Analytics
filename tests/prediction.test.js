'use strict';

const { wma, trendSlope, predict } = require('../src/core');

// ── wma — Weighted Moving Average ─────────────────────────────────────────────
describe('wma', () => {
  test('returns correct WMA for a known series', () => {
    // weights: 1,2,3,4,5,6,7 → sum=28
    // values:  1,2,3,4,5,6,7 → weighted sum = 1+4+9+16+25+36+49 = 140
    // WMA = 140/28 = 5
    expect(wma([1, 2, 3, 4, 5, 6, 7])).toBeCloseTo(5, 5);
  });

  test('uses only the last `window` elements', () => {
    // With window=3, only [5,6,7] are used: (1*5 + 2*6 + 3*7) / (1+2+3) = (5+12+21)/6 = 38/6 ≈ 6.33
    expect(wma([1, 2, 3, 4, 5, 6, 7], 3)).toBeCloseTo(6.333, 2);
  });

  test('returns the single value for a one-element array', () => {
    expect(wma([42])).toBe(42);
  });

  test('returns the single value when window > array length', () => {
    // Array has 3 elements, window=10 → uses all 3
    // (1*1 + 2*2 + 3*3) / 6 = 14/6 ≈ 2.33
    expect(wma([1, 2, 3], 10)).toBeCloseTo(2.333, 2);
  });

  test('returns the same value for a flat (constant) series', () => {
    expect(wma([7, 7, 7, 7, 7])).toBe(7);
  });

  test('later values have more weight than earlier values', () => {
    // [1,10] → (1*1 + 2*10)/(1+2) = 21/3 = 7 — closer to 10 than 1
    const result = wma([1, 10]);
    expect(result).toBeGreaterThan(5.5);
  });

  test('default window is 7', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    // Last 7: [4,5,6,7,8,9,10] → (1*4+2*5+3*6+4*7+5*8+6*9+7*10)/(1+2+3+4+5+6+7)
    // = (4+10+18+28+40+54+70)/28 = 224/28 = 8
    expect(wma(arr)).toBeCloseTo(8, 5);
  });
});

// ── trendSlope ────────────────────────────────────────────────────────────────
describe('trendSlope', () => {
  test('returns positive slope for an increasing series', () => {
    expect(trendSlope([1, 2, 3, 4, 5, 6, 7])).toBeGreaterThan(0);
  });

  test('returns negative slope for a decreasing series', () => {
    expect(trendSlope([7, 6, 5, 4, 3, 2, 1])).toBeLessThan(0);
  });

  test('returns 0 for a flat series', () => {
    expect(trendSlope([5, 5, 5, 5, 5, 5, 5])).toBe(0);
  });

  test('slope of a perfectly linear series equals the step size', () => {
    // [10, 12, 14, 16, 18, 20, 22] — step = 2
    // slope = (last - first) / (n-1) = (22-10)/6 = 2
    expect(trendSlope([10, 12, 14, 16, 18, 20, 22])).toBeCloseTo(2, 10);
  });

  test('uses only the last n elements', () => {
    // Last 3 of [100, 1, 2, 3]: slope = (3-1)/(3-1) = 1
    expect(trendSlope([100, 1, 2, 3], 3)).toBeCloseTo(1, 10);
  });

  test('handles a two-element array', () => {
    // slope = (20-10)/(2-1) = 10
    expect(trendSlope([10, 20], 2)).toBeCloseTo(10, 10);
  });

  test('default n is 7', () => {
    const arr = [0, 0, 1, 2, 3, 4, 5, 6, 7]; // last 7: [1,2,3,4,5,6,7]
    expect(trendSlope(arr)).toBeCloseTo(1, 10);
  });
});

// ── predict ───────────────────────────────────────────────────────────────────
describe('predict', () => {
  // Flat historical data + neutral seasonal factors simplify expected outputs
  const FLAT_HISTORY = [60, 60, 60, 60, 60, 60, 60, 60];
  const NEUTRAL_FACTORS = [1, 1, 1, 1, 1, 1, 1]; // no seasonal adjustment

  test('returns an object with value and confidence', () => {
    const result = predict(FLAT_HISTORY, NEUTRAL_FACTORS, 0, 1);
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('confidence');
  });

  test('value is a number rounded to 1 decimal place', () => {
    const result = predict(FLAT_HISTORY, NEUTRAL_FACTORS, 0, 1);
    expect(typeof result.value).toBe('number');
    // Check it has at most one decimal place
    expect(result.value).toBe(parseFloat(result.value.toFixed(1)));
  });

  test('confidence is between 55 and 93 inclusive', () => {
    for (let day = 0; day < 7; day++) {
      const { confidence } = predict(FLAT_HISTORY, NEUTRAL_FACTORS, day, 1);
      expect(confidence).toBeGreaterThanOrEqual(55);
      expect(confidence).toBeLessThanOrEqual(93);
    }
  });

  test('confidence is an integer', () => {
    const { confidence } = predict(FLAT_HISTORY, NEUTRAL_FACTORS, 0, 1);
    expect(Number.isInteger(confidence)).toBe(true);
  });

  test('flat history with neutral seasonal factor predicts ≈ baseline', () => {
    const { value } = predict(FLAT_HISTORY, NEUTRAL_FACTORS, 0, 1);
    expect(value).toBeCloseTo(60, 0);
  });

  test('flat history yields maximum confidence (low variance)', () => {
    // Variance is 0 → confidence = min(93, 92 - 0*2) = 92
    const { confidence } = predict(FLAT_HISTORY, NEUTRAL_FACTORS, 0, 1);
    expect(confidence).toBe(92);
  });

  test('high-variance history yields lower confidence', () => {
    const volatile = [10, 90, 10, 90, 10, 90, 10, 90];
    const { confidence: highConf } = predict(FLAT_HISTORY, NEUTRAL_FACTORS, 0, 1);
    const { confidence: lowConf }  = predict(volatile,     NEUTRAL_FACTORS, 0, 1);
    expect(lowConf).toBeLessThan(highConf);
  });

  test('seasonal factor scales the predicted value proportionally', () => {
    const factorDouble = [2, 2, 2, 2, 2, 2, 2];
    const factorHalf   = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const { value: doubled } = predict(FLAT_HISTORY, factorDouble, 0, 1);
    const { value: halved }  = predict(FLAT_HISTORY, factorHalf,   0, 1);
    expect(doubled).toBeCloseTo(halved * 4, 0);
  });

  test('predicting further ahead increases influence of trend', () => {
    // Increasing trend — daysAhead=7 should predict higher than daysAhead=1
    const rising = [50, 52, 54, 56, 58, 60, 62, 64];
    const near = predict(rising, NEUTRAL_FACTORS, 0, 1).value;
    const far  = predict(rising, NEUTRAL_FACTORS, 0, 7).value;
    expect(far).toBeGreaterThan(near);
  });

  test('confidence is clamped to 55 even for extreme variance', () => {
    // Extremely volatile data to push variance very high
    const extreme = [0, 1000, 0, 1000, 0, 1000, 0, 1000];
    const { confidence } = predict(extreme, NEUTRAL_FACTORS, 0, 1);
    expect(confidence).toBeGreaterThanOrEqual(55);
  });
});

// ── predict — edge cases ───────────────────────────────────────────────────────
describe('predict — edge cases', () => {
  const NEUTRAL_FACTORS = [1, 1, 1, 1, 1, 1, 1];

  test('does not throw with a single-element historical array', () => {
    expect(() => predict([60], NEUTRAL_FACTORS, 0, 1)).not.toThrow();
  });

  test('returns an object with value and confidence for a single-element array', () => {
    const result = predict([60], NEUTRAL_FACTORS, 0, 1);
    expect(typeof result.value).toBe('number');
    expect(typeof result.confidence).toBe('number');
  });

  test('confidence is within bounds [55, 93] for a single-element array', () => {
    const { confidence } = predict([60], NEUTRAL_FACTORS, 0, 1);
    expect(confidence).toBeGreaterThanOrEqual(55);
    expect(confidence).toBeLessThanOrEqual(93);
  });

  test('does not throw with negative historical values', () => {
    const negData = [-10, -5, -8, -3, -6, -4, -7];
    expect(() => predict(negData, NEUTRAL_FACTORS, 0, 1)).not.toThrow();
  });

  test('returns a finite value for negative historical data', () => {
    const { value } = predict([-10, -5, -8, -3, -6, -4, -7], NEUTRAL_FACTORS, 0, 1);
    expect(Number.isFinite(value)).toBe(true);
  });

  test('returns a finite result for a very large daysAhead (365)', () => {
    const history = [60, 60, 60, 60, 60, 60, 60];
    const { value } = predict(history, NEUTRAL_FACTORS, 0, 365);
    expect(Number.isFinite(value)).toBe(true);
  });

  test('flat history + large daysAhead still predicts near baseline (no trend)', () => {
    const history = [60, 60, 60, 60, 60, 60, 60];
    // Trend slope is 0 for flat data, so value ≈ 60 regardless of daysAhead
    const { value } = predict(history, NEUTRAL_FACTORS, 0, 365);
    expect(value).toBeCloseTo(60, 0);
  });

  test('target day-of-week 6 (Saturday) applies the correct seasonal factor', () => {
    const history = [60, 60, 60, 60, 60, 60, 60];
    const factors = [1, 1, 1, 1, 1, 1, 0.5]; // Saturday factor = 0.5
    const { value } = predict(history, factors, 6, 1);
    expect(value).toBeCloseTo(30, 0); // 60 * 0.5
  });
});
