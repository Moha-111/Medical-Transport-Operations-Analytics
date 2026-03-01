'use strict';

/**
 * @file core.js
 * @description Central re-export barrel for the Wasl analytics engine.
 *
 * Provides the complete public API of the analytics engine from a single
 * entry point, maintaining full backward compatibility with all existing
 * callers and tests that import from `../src/core`.
 *
 * Sub-module layout:
 *
 *   src/csv-parser.js       → parseCSV
 *   src/kpi-calculator.js   → calcKPIs
 *   src/breach-detector.js  → detectBreaches
 *   src/prediction.js       → wma, trendSlope, predict
 *   src/config.js           → serialiseCFG, deserialiseCFG
 *
 * Import from the specific sub-module when you only need one function;
 * import from core.js when you need several functions at once.
 */

const { parseCSV }                      = require('./csv-parser');
const { calcKPIs }                      = require('./kpi-calculator');
const { detectBreaches }                = require('./breach-detector');
const { wma, trendSlope, predict }      = require('./prediction');
const { serialiseCFG, deserialiseCFG }  = require('./config');

module.exports = {
  parseCSV,
  calcKPIs,
  detectBreaches,
  wma,
  trendSlope,
  predict,
  serialiseCFG,
  deserialiseCFG,
};
