# API Reference — core.js

> Complete function reference for the Wasl analytics engine

**Source file:** `src/core.js`
**Module format:** CommonJS (`module.exports`)
**Environment:** Browser + Node.js compatible

---

## Table of Contents

- [Importing the Module](#importing-the-module)
- [parseCSV](#parsecsvtxt)
- [calcKPIs](#calckpisrows)
- [detectBreaches](#detectbreachescurr-prev-thresholds)
- [wma](#wmaarr-window)
- [trendSlope](#trendslopearr-n)
- [predict](#predicthistoricaldata-dayfactors-targetdayofweek-daysahead)
- [serialiseCFG](#serialisecfgsyncstate)
- [deserialiseCFG](#deserialisecfgraw-syncstate)
- [Type Definitions](#type-definitions)

---

## Importing the Module

```javascript
// Node.js / Jest tests
const {
  parseCSV,
  calcKPIs,
  detectBreaches,
  wma,
  trendSlope,
  predict,
  serialiseCFG,
  deserialiseCFG,
} = require('./src/core.js');

// Browser (index.html already includes all functions globally)
// No import needed — functions are available in global scope
```

---

## `parseCSV(txt)`

Parses a comma-delimited CSV string into an array of plain objects.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `txt` | `string` | Yes | Raw CSV text. First line must be the header row. |

### Returns

`Object[]` — Array of row objects keyed by header names. Returns `[]` if fewer than 2 lines.

### Example

```javascript
const csv = `Mission ID,Status,Response Time (min)
M-00001,Good,12.5
M-00002,Late,18.2
M-00003,Excellent,9.1`;

const rows = parseCSV(csv);
// Returns:
// [
//   { "Mission ID": "M-00001", "Status": "Good", "Response Time (min)": "12.5" },
//   { "Mission ID": "M-00002", "Status": "Late", "Response Time (min)": "18.2" },
//   { "Mission ID": "M-00003", "Status": "Excellent", "Response Time (min)": "9.1" }
// ]

console.log(rows.length);          // 3
console.log(rows[0]["Status"]);    // "Good"
```

### Notes

- All values are returned as **strings** — numeric conversion happens in `calcKPIs()`
- Values wrapped in double quotes have the quotes stripped
- Missing values at end of line are returned as `''` (empty string)
- Handles both `\n` and `\r\n` line endings

---

## `calcKPIs(rows)`

Computes all dashboard KPIs from an array of mission rows.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rows` | `Object[]` or `null` | Yes | Parsed mission data from `parseCSV()` |

### Returns

`KPIResult` object or `null` if input is empty/null. See [Type Definitions](#type-definitions).

### Example

```javascript
const rows = parseCSV(csvText);
const kpis = calcKPIs(rows);

if (kpis === null) {
  console.log('No data — upload a file to begin');
} else {
  console.log(`Total missions: ${kpis.n}`);
  console.log(`Avg response:   ${kpis.avgResp} min`);
  console.log(`Late rate:      ${kpis.lateRate}%`);
  console.log(`Top center:     ${kpis.centers[0].id} (${kpis.centers[0].missions} missions)`);
}
```

### Column Resolution

`calcKPIs` uses fuzzy column name matching — your column names don't need to be exact:

```javascript
// All of these will be recognized as the response time column:
"Response Time (min)"   ✅
"response_min"          ✅
"ResponseTime"          ✅
"RESPONSE TIME"         ✅
"resp"                  ❌  (too short to match "response")
```

See [ALGORITHMS.md#column-resolution-algorithm](./ALGORITHMS.md#column-resolution-algorithm) for details.

---

## `detectBreaches(curr, prev, thresholds)`

Checks current KPIs against configured thresholds and returns any breached alerts.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `curr` | `KPIResult` or `null` | Yes | Current KPI result from `calcKPIs()` |
| `prev` | `KPIResult` or `null` | No | Previous KPI result for delta calculation |
| `thresholds` | `Thresholds` | Yes | Threshold configuration object |

### Returns

`Breach[]` — Array of breach objects. Empty array `[]` if no breaches detected.

### Example

```javascript
const thresholds = {
  resp: 15,          // max 15 minutes response time
  late: 95,          // max 95% late rate
  missionsMax: 60,   // max 60 missions per day
};

const current = calcKPIs(todayRows);
const previous = calcKPIs(yesterdayRows);

const alerts = detectBreaches(current, previous, thresholds);

if (alerts.length > 0) {
  alerts.forEach(alert => {
    console.log(`${alert.icon} ${alert.label}: ${alert.val}${alert.unit} (threshold: ${alert.threshold}${alert.unit})`);
  });
}

// Example output:
// ⏱ وقت الاستجابة الكلي: 16.2د (threshold: 15د)
// 🏥 مركز C05 — معدل تأخير: 97.8% (threshold: 95%)
```

### Breach Rules Summary

| KPI | Condition | Label (Arabic) |
|-----|-----------|----------------|
| Response Time | `curr.avgResp > thresholds.resp` | وقت الاستجابة الكلي |
| Late Rate | `curr.lateRate > thresholds.late` | معدل التأخير |
| Mission Volume | `curr.n/365 > thresholds.missionsMax` | المهام اليومية |
| Center Late Rate | `center.late > thresholds.late + 1.5` | مركز {id} — معدل تأخير |

---

## `wma(arr, window)`

Computes a Weighted Moving Average where more recent values have higher weight.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `arr` | `number[]` | Yes | — | Array of historical values |
| `window` | `number` | No | `7` | Number of trailing points to use |

### Returns

`number` — The weighted average.

### Example

```javascript
const dailyMissions = [48, 52, 55, 53, 58, 60, 62];

const avg = wma(dailyMissions);
// Weight distribution: [1, 2, 3, 4, 5, 6, 7]
// = (1×48 + 2×52 + 3×55 + 4×53 + 5×58 + 6×60 + 7×62) / 28
// = 57.6

console.log(avg); // 57.6

// Custom window (last 3 points only):
const avg3 = wma(dailyMissions, 3);
// Slice = [58, 60, 62], weights = [1, 2, 3]
// = (1×58 + 2×60 + 3×62) / 6 = 60.7
console.log(avg3); // 60.7
```

---

## `trendSlope(arr, n)`

Computes the linear trend (slope) over the last `n` data points.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `arr` | `number[]` | Yes | — | Array of historical values |
| `n` | `number` | No | `7` | Number of trailing points to use |

### Returns

`number` — The slope (change per step). Positive = increasing trend, negative = decreasing.

### Example

```javascript
const data = [10, 11, 12, 11, 13, 14, 16];

const slope = trendSlope(data);
// Slice = all 7 points (default n=7)
// slope = (16 - 10) / (7 - 1) = 6/6 = 1.0

console.log(slope); // 1.0 (increasing by ~1 unit per day)

// Shorter window:
const slope3 = trendSlope(data, 3);
// Slice = [13, 14, 16]
// slope = (16 - 13) / (3 - 1) = 3/2 = 1.5
console.log(slope3); // 1.5
```

---

## `predict(historicalData, dayFactors, targetDayOfWeek, daysAhead)`

Forecasts a KPI value using Weighted Moving Average + trend + seasonal adjustment.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `historicalData` | `number[]` | Yes | — | Historical KPI values (at least 7 recommended) |
| `dayFactors` | `number[]` | Yes | — | Array of 7 seasonal multipliers indexed by day-of-week (0=Sun, 6=Sat) |
| `targetDayOfWeek` | `number` | Yes | — | Day of week for prediction target (0–6) |
| `daysAhead` | `number` | No | `1` | How many days ahead to forecast |

### Returns

`PredictionResult` object: `{ value: number, confidence: number }`

- `value` — Predicted KPI value (1 decimal place)
- `confidence` — Prediction confidence score (55–93)

### Example

```javascript
const missionHistory = [48, 52, 55, 53, 58, 60, 62];

// Day factors (Saudi EMS pattern):
// Higher on Sunday (start of work week), lower on Friday
const dayFactors = [1.10, 1.05, 1.00, 0.95, 0.90, 0.75, 0.85];
//                  Sun   Mon   Tue   Wed   Thu   Fri   Sat

// Predict missions for next Sunday (0), 1 day ahead
const result = predict(missionHistory, dayFactors, 0, 1);

console.log(`Predicted: ${result.value} missions`);
// → "Predicted: 65.9 missions"

console.log(`Confidence: ${result.confidence}%`);
// → "Confidence: 84%"
```

### Confidence Interpretation

```
93%   Very high — extremely stable data
80-92% High — reliable forecast
65-79% Moderate — some variability
55-64% Low — high variability, treat as rough estimate
```

---

## `serialiseCFG(syncState)`

Serializes the application configuration state into a JSON string for storage.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `syncState` | `SyncState` | Yes | The SYNC configuration object to persist |

### Returns

`string` — JSON string ready for `localStorage.setItem()`.

### Example

```javascript
const SYNC = {
  gsUrl:        'https://docs.google.com/...',
  webhookUrl:   'https://hook.make.com/abc123',
  alertEmail:   'ops@hospital.sa',
  intervalMin:  5,
  thresholds:   { resp: 15, late: 95, missionsMax: 60 },
  alertLog:     [...],   // Up to 100 recent alerts
  alertsToday:  3,
};

const stored = serialiseCFG(SYNC);
localStorage.setItem('wasl-config', stored);

// stored is a JSON string containing all SYNC properties
// alertLog is truncated to the last 100 entries
```

### Serialized Fields

Only these fields are persisted (others are runtime-only):

| Field | Type | Description |
|-------|------|-------------|
| `gsUrl` | string | Google Sheets URL |
| `webhookUrl` | string | Make.com webhook URL |
| `alertEmail` | string | Report recipient email |
| `intervalMin` | number | Live refresh interval |
| `thresholds` | object | KPI threshold values |
| `alertLog` | array | Last 100 alert entries |
| `alertsToday` | number | Alert count for current day |

---

## `deserialiseCFG(raw, syncState)`

Parses a stored config string and merges it into an existing SYNC state object.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raw` | `string` or `null` | Yes | JSON string from storage (null/undefined safe) |
| `syncState` | `SyncState` | Yes | Existing SYNC state to merge into |

### Returns

`SyncState` — Updated state object with stored values merged in.

### Example

```javascript
const DEFAULT_SYNC = {
  gsUrl:        '',
  webhookUrl:   '',
  alertEmail:   '',
  intervalMin:  5,
  thresholds:   { resp: 15, late: 95, missionsMax: 60 },
  alertLog:     [],
  alertsToday:  0,
};

// On app startup:
const stored = localStorage.getItem('wasl-config');
const SYNC = deserialiseCFG(stored, DEFAULT_SYNC);

// If stored is null (first run): returns DEFAULT_SYNC unchanged
// If stored is valid JSON: merges stored values into DEFAULT_SYNC
// If stored is invalid JSON: returns DEFAULT_SYNC unchanged (safe fallback)
```

### Merge Behavior

Only non-empty/non-falsy stored values overwrite the defaults:

```javascript
// Stored: { webhookUrl: 'https://hook.make.com/xyz', intervalMin: 0 }
// Default: { webhookUrl: '', intervalMin: 5, gsUrl: '' }

// Result:
// { webhookUrl: 'https://hook.make.com/xyz',  ← stored (truthy)
//   intervalMin: 5,                            ← default (stored 0 is falsy)
//   gsUrl: '' }                                ← default (not in stored)
```

---

## Type Definitions

### `KPIResult`

```typescript
interface KPIResult {
  n:           number;        // Total mission count
  late:        number;        // Late mission count
  good:        number;        // Good mission count
  exc:         number;        // Excellent mission count
  lifeSave:    number;        // Life-saving mission count
  avgResp:     number;        // Avg response time (min), 1 decimal
  avgDisp:     number;        // Avg dispatch time (min), 1 decimal
  avgTravel:   number;        // Avg travel time (min), 1 decimal
  avgDur:      number;        // Avg mission duration (min), 1 decimal
  lateRate:    number;        // Late rate (%), 1 decimal
  goodRate:    number;        // Good rate (%), 1 decimal
  excRate:     number;        // Excellent rate (%), 1 decimal
  lifeSavePct: number;        // Life-saving rate (%), 1 decimal
  centers:     CenterStat[];  // Per-center breakdown, sorted by missions desc
  monthlyArr:  number[];      // 12-element array [Jan, Feb, ..., Dec]
  topHospitals: HospitalStat[]; // Top 5 receiving hospitals
  shiftMap:    Record<string, number>; // { "Morning": 5100, ... }
  ts:          number;        // Unix timestamp (ms) when computed
}
```

### `CenterStat`

```typescript
interface CenterStat {
  id:       string;  // Center ID (e.g., "C01")
  missions: number;  // Total missions
  resp:     number;  // Avg response time (min)
  disp:     number;  // Avg dispatch time (min)
  late:     number;  // Late rate (%)
}
```

### `HospitalStat`

```typescript
interface HospitalStat {
  hospital: string;  // Hospital ID (e.g., "H1")
  count:    number;  // Mission count
  pct:      number;  // Share of total (%)
}
```

### `Breach`

```typescript
interface Breach {
  icon:      string;  // Display icon emoji
  label:     string;  // Arabic alert label
  val:       number;  // Current value that breached threshold
  threshold: number;  // The configured threshold
  delta:     number;  // Change from previous period (0 if no prev)
  unit:      string;  // Display unit ("د", "%", "")
  severity:  "critical";  // Always "critical" in current version
}
```

### `Thresholds`

```typescript
interface Thresholds {
  resp:         number;  // Max avg response time (min)
  late:         number;  // Max late rate (%)
  missionsMax:  number;  // Max avg daily missions per center
}
```

### `PredictionResult`

```typescript
interface PredictionResult {
  value:      number;  // Predicted value (1 decimal place)
  confidence: number;  // Confidence score (integer, 55–93)
}
```

### `SyncState`

```typescript
interface SyncState {
  gsUrl:        string;      // Google Sheets URL
  webhookUrl:   string;      // Make.com webhook URL
  alertEmail:   string;      // Report recipient email
  intervalMin:  number;      // Live refresh interval (minutes)
  thresholds:   Thresholds;  // KPI threshold values
  alertLog:     object[];    // Recent alert entries (max 100)
  alertsToday:  number;      // Alert count for current day
}
```
