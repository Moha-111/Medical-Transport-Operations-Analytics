# Analytics Algorithms — Wasl (وصل)

> Detailed documentation of all analytical methods used in the platform

---

## Table of Contents

- [Overview](#overview)
- [KPI Calculation Engine](#kpi-calculation-engine)
- [Alert / Breach Detection](#alert--breach-detection)
- [Prediction Engine](#prediction-engine)
  - [Weighted Moving Average (WMA)](#weighted-moving-average-wma)
  - [Trend Slope](#trend-slope)
  - [Prediction Formula](#prediction-formula)
  - [Confidence Scoring](#confidence-scoring)
- [Center Benchmarking](#center-benchmarking)
- [Monthly Trend Analysis](#monthly-trend-analysis)
- [Column Resolution Algorithm](#column-resolution-algorithm)

---

## Overview

All analytics are implemented as **pure functions** in `src/core.js`. They take data arrays as input and return plain objects — no side effects, no DOM access, fully testable.

```
Input:   rows[] (parsed mission records)
         ↓
Process: calcKPIs() → kpiResult{}
         detectBreaches() → alert[]
         predict() → { value, confidence }
         ↓
Output:  KPI cards, charts, alerts on the dashboard
```

---

## KPI Calculation Engine

**Function:** `calcKPIs(rows)`
**Source:** `src/core.js:33`

### Input

An array of mission row objects, each representing one patient transfer mission.

```javascript
rows = [
  {
    "Response Time (min)": "12.5",
    "Dispatch Time (min)": "4.2",
    "Travel Time (min)":   "8.3",
    "Duration (min)":      "127",
    "Status":              "Good",
    "Center":              "C01",
    "Severity":            "Critical",
    "Shift":               "Morning",
    "Month":               "January",
    "Hospital":            "H1"
  },
  // ... 14,168 more rows
]
```

### KPI Formulas

#### Time Aggregates

```
avgResp   = Σ(Response Time) / n
avgDisp   = Σ(Dispatch Time) / n
avgTravel = Σ(Travel Time)   / n
avgDur    = Σ(Duration)      / n

All values rounded to 1 decimal place.
```

#### Status Counts

The `Status` column is matched case-insensitively:

```
late     = count where Status contains "late"
good     = count where Status contains "good"
exc      = count where Status is neither late nor good  (Excellent)
lifeSave = count where Severity contains "life" OR "saving"
```

#### Rate Percentages

```
lateRate    = (late / n)     × 100   [rounded to 1 decimal]
goodRate    = (good / n)     × 100
excRate     = (exc  / n)     × 100
lifeSavePct = (lifeSave / n) × 100
```

### Output Object Shape

```javascript
{
  n:          14169,       // Total mission count
  late:       13503,       // Late mission count
  good:        450,        // Good mission count
  exc:          216,        // Excellent mission count
  lifeSave:   4977,        // Life-saving missions
  avgResp:    14.5,        // Avg response time (min)
  avgDisp:     5.5,        // Avg dispatch time (min)
  avgTravel:   8.3,        // Avg travel time (min)
  avgDur:    132.9,        // Avg mission duration (min)
  lateRate:   95.3,        // Late rate (%)
  goodRate:    3.2,        // Good rate (%)
  excRate:     1.5,        // Excellent rate (%)
  lifeSavePct: 35.1,       // Life-saving rate (%)
  centers:   [...],        // Per-center breakdown (see below)
  monthlyArr: [1200, 1050, ...],  // 12-element array (Jan–Dec)
  topHospitals: [...],     // Top 5 receiving hospitals
  shiftMap:  { Morning: 5100, Evening: 4900, Night: 4169 },
  ts:        1706745600000 // Unix timestamp (ms)
}
```

### Edge Cases

| Condition | Behavior |
|-----------|----------|
| `rows` is `null` or `undefined` | Returns `null` |
| `rows` is an empty array `[]` | Returns `null` |
| Missing column in row | `col()` resolver returns `null`; `num()` returns `0` |
| Non-numeric time value | `parseFloat()` returns `NaN`; `\|\| 0` fallback used |
| Division by zero (n=0) | `avg()` and `pct()` guard: returns `0` if `n === 0` |

---

## Alert / Breach Detection

**Function:** `detectBreaches(curr, prev, thresholds)`
**Source:** `src/core.js:122`

### Breach Rules

The function checks **4 breach conditions**:

#### Rule 1 — Response Time Breach
```
TRIGGER when: curr.avgResp > thresholds.resp
Alert:
  icon:      "⏱"
  label:     "وقت الاستجابة الكلي"
  unit:      "د" (minutes in Arabic)
  severity:  "critical"
  delta:     curr.avgResp - prev.avgResp  (or 0 if no prev)
```

#### Rule 2 — Late Rate Breach
```
TRIGGER when: curr.lateRate > thresholds.late
Alert:
  icon:      "📊"
  label:     "معدل التأخير"
  unit:      "%"
  severity:  "critical"
```

#### Rule 3 — Mission Volume Breach
```
TRIGGER when: (curr.n / 365) > thresholds.missionsMax
Alert:
  icon:      "📋"
  label:     "المهام اليومية"
  unit:      ""
  severity:  "critical"

Note: Annualised total ÷ 365 = daily average per mission count
```

#### Rule 4 — Center-Level Late Rate Breach
```
For each center in curr.centers:
  TRIGGER when: center.late > thresholds.late + 1.5

Alert:
  icon:      "🏥"
  label:     "مركز {center.id} — معدل تأخير"
  val:       center.late
  threshold: thresholds.late
  delta:     0  (no previous center snapshot available)
  unit:      "%"
  severity:  "critical"
```

### Breach Object Schema

```javascript
{
  icon:      "⏱",           // Display icon
  label:     "وقت الاستجابة الكلي",  // Arabic alert label
  val:       16.2,          // Current value
  threshold: 15,            // Configured threshold
  delta:     1.2,           // Change from previous period
  unit:      "د",           // Unit string
  severity:  "critical"     // Always "critical" in current version
}
```

### Default Thresholds

```javascript
thresholds = {
  resp:         15,   // minutes — max acceptable avg response time
  late:         95,   // percent — max acceptable late rate
  missionsMax:  60,   // per day — max daily missions per center
}
```

---

## Prediction Engine

The prediction engine combines three signals: recency-weighted history, linear trend, and day-of-week seasonality.

### Weighted Moving Average (WMA)

**Function:** `wma(arr, window = 7)`
**Source:** `src/core.js:156`

Unlike a simple moving average (equal weights), WMA assigns higher importance to more recent values.

#### Formula

```
Given slice = arr[last window points]:

WMA = Σ(weight_i × value_i) / Σ(weight_i)

Where:
  weight_i = i + 1   (position in slice, 0-indexed)

Example with window=3, values=[10, 12, 15]:
  weights = [1, 2, 3]
  WMA = (1×10 + 2×12 + 3×15) / (1+2+3)
      = (10 + 24 + 45) / 6
      = 79 / 6
      ≈ 13.2
```

#### Rationale

WMA is preferred over SMA for operational KPIs because:
- Recent performance is more predictive of tomorrow's performance
- It smooths out noise without ignoring current trends
- Simpler than EWMA while still being recency-weighted

---

### Trend Slope

**Function:** `trendSlope(arr, n = 7)`
**Source:** `src/core.js:169`

A simplified linear regression using only the first and last points of the window.

#### Formula

```
slope = (arr[last] - arr[first]) / (n - 1)

Example with n=7, values=[10, 11, 12, 11, 13, 14, 16]:
  first = 10 (arr[-7])
  last  = 16 (arr[-1])
  slope = (16 - 10) / (7 - 1) = 6 / 6 = 1.0

Interpretation: The KPI increases by 1.0 units per day on average.
```

#### Note on Simplification

This is an endpoint-only slope, not a least-squares regression. It is intentionally simple for runtime performance and sufficient accuracy at the daily reporting granularity used.

---

### Prediction Formula

**Function:** `predict(historicalData, dayFactors, targetDayOfWeek, daysAhead = 1)`
**Source:** `src/core.js:182`

#### Formula

```
prediction = (WMA_base + trend_slope × daysAhead) × seasonal_factor

Where:
  WMA_base        = wma(historicalData)        [last 7 points, weighted]
  trend_slope     = trendSlope(historicalData)  [change per day]
  daysAhead       = 1 (default) or more
  seasonal_factor = dayFactors[targetDayOfWeek] [0=Sun … 6=Sat]
```

#### Day Factors (Seasonality)

`dayFactors` is an array of 7 multipliers representing day-of-week patterns:

```javascript
// Example day factors for EMS missions:
dayFactors = [
  1.10,  // Sunday    — higher in Saudi Arabia (start of week)
  1.05,  // Monday
  1.00,  // Tuesday   — baseline
  0.95,  // Wednesday
  0.90,  // Thursday
  0.75,  // Friday    — lower (Juma'a, half day)
  0.85,  // Saturday  — moderate
]
```

#### Worked Example

```
Historical (last 7 days): [48, 52, 55, 53, 58, 60, 62]
Target: Next Sunday (index 0)
Day factor for Sunday: 1.10

WMA_base    = wma([48,52,55,53,58,60,62])
            = (1×48 + 2×52 + 3×55 + 4×53 + 5×58 + 6×60 + 7×62)
              / (1+2+3+4+5+6+7)
            = (48+104+165+212+290+360+434) / 28
            = 1613 / 28 ≈ 57.6

trend_slope = (62 - 48) / (7-1) = 14/6 ≈ 2.3

raw_pred    = (57.6 + 2.3 × 1) × 1.10
            = 59.9 × 1.10
            ≈ 65.9

→ Predicted missions for next Sunday: 65.9 (≈ 66)
```

---

### Confidence Scoring

Confidence reflects how consistent (low-variance) the recent data is.

#### Formula

```
variance = Σ|value_i - WMA_base| / 7   (mean absolute deviation, last 7 points)

confidence = clamp(92 - variance × 2,  min=55,  max=93)
```

#### Confidence Scale

| Confidence | Interpretation |
|------------|----------------|
| 90–93% | Very stable data — high predictability |
| 75–89% | Moderate variance — reliable forecast |
| 60–74% | Notable variance — use with caution |
| 55–59% | High variance — low predictability |

#### Worked Example

```
Historical: [48, 52, 55, 53, 58, 60, 62]
WMA_base:   57.6

Absolute deviations:
  |48 - 57.6| = 9.6
  |52 - 57.6| = 5.6
  |55 - 57.6| = 2.6
  |53 - 57.6| = 4.6
  |58 - 57.6| = 0.4
  |60 - 57.6| = 2.4
  |62 - 57.6| = 4.4

variance    = (9.6+5.6+2.6+4.6+0.4+2.4+4.4) / 7 = 29.6 / 7 ≈ 4.2

confidence  = clamp(92 - 4.2×2, 55, 93)
            = clamp(92 - 8.4, 55, 93)
            = clamp(83.6, 55, 93)
            = 84%
```

---

## Center Benchmarking

Computed inside `calcKPIs()` as part of the `centers` array.

### Per-Center Metrics

For each unique value of the `Center` column:

```
center.missions = count of rows with this center
center.resp     = Σ(response_time) / center.missions   [avg response]
center.disp     = Σ(dispatch_time) / center.missions   [avg dispatch]
center.late     = (late_count / center.missions) × 100 [late rate %]
```

### Ranking

Centers are sorted by `missions` descending — highest-volume centers appear first in all center tables and benchmarks.

### Center Performance Tier Classification (Dashboard UI)

The dashboard applies color coding:

```
late_rate ≤ 90%    → Green  (Excellent)
late_rate ≤ 95%    → Amber  (Acceptable)
late_rate  > 95%   → Red    (Needs attention)
```

---

## Monthly Trend Analysis

The `monthlyArr` output is a **12-element array** ordered January through December:

```javascript
MONTH_ORDER = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
]

monthlyArr[0] = missions in January
monthlyArr[1] = missions in February
...
monthlyArr[11] = missions in December
```

Months with no data return `0`. This array feeds directly into the Chart.js line chart for the monthly trend visualization.

---

## Column Resolution Algorithm

The `col()` helper inside `calcKPIs()` enables flexible column name matching — the dataset's column headers don't need to exactly match expected names.

### How It Works

```
col(...candidates):
  For each candidate string:
    Search all column headers for a key where:
      key.toLowerCase().replace(/[_\s]/g, '')
      includes
      candidate.toLowerCase().replace(/[_\s]/g, '')
    Return first match found, or null if none
```

### Example Matches

| Candidate | Matches | Does Not Match |
|-----------|---------|---------------|
| `"response"` | `"Response Time (min)"`, `"response_min"` | `"resp_tm"` |
| `"dispatch"` | `"Dispatch Time (min)"`, `"dispatch_min"` | `"disp"` |
| `"status"` | `"Status"`, `"Mission Status"` | `"st"` |

This allows the platform to ingest Excel files with slight column name variations without requiring exact header matches.
