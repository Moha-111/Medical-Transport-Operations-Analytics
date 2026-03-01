# Data Schema — Wasl (وصل)

> Complete data dictionary for the Medical Transport Operations dataset

---

## Table of Contents

- [Dataset Overview](#dataset-overview)
- [Full Column Dictionary](#full-column-dictionary)
- [Field Enumerations](#field-enumerations)
- [KPI Derivation Map](#kpi-derivation-map)
- [Data Quality Notes](#data-quality-notes)
- [CSV Import Format](#csv-import-format)
- [Field Templates](#field-templates)

---

## Dataset Overview

| Property | Value |
|----------|-------|
| File | `Medical-Transport-Analytics.xlsx` |
| Sheet | `Daily Operations Data` |
| Total Records | 14,169 missions |
| Total Columns | 25 |
| Date Range | Jan 2024 – Dec 2024 (12 months) |
| Centers | 20 (C01 – C20) |
| Hospitals | Multiple (H1 is primary at 72.1% share) |
| Paramedics | 219 unique IDs |
| Data Type | Synthetic / Demo (no real patient PII) |

---

## Full Column Dictionary

### Identity Columns

| # | Column Name | Type | Example | Description |
|---|-------------|------|---------|-------------|
| 1 | `Mission ID` | String | `M-00001` | Unique mission identifier. Format: `M-{5-digit-number}` |
| 2 | `Date` | Date | `2024-01-15` | ISO 8601 date of the mission |
| 3 | `Month` | String | `January` | Calendar month name (English). Used for trend grouping |

### Operational Columns

| # | Column Name | Type | Example | Description |
|---|-------------|------|---------|-------------|
| 4 | `Center` | String | `C01` | Originating medical center. Format: `C{01–20}` |
| 5 | `Paramedic ID` | String | `P-042` | Assigned paramedic. Format: `P-{3-digit-number}` |
| 6 | `Vehicle ID` | String | `AMB-07` | Ambulance unit assigned. Format: `AMB-{2-digit-number}` |
| 7 | `Shift` | String | `Morning` | Work shift. Values: `Morning`, `Evening`, `Night` |
| 8 | `Crew Size` | Integer | `2` | Number of crew members on mission |

### Clinical Columns

| # | Column Name | Type | Example | Description |
|---|-------------|------|---------|-------------|
| 9 | `Referral Type` | String | `Life-Saving` | Mission urgency classification |
| 10 | `Severity` | String | `Critical` | Clinical severity level |
| 11 | `Patient Age Group` | String | `Adult` | Patient demographic group |
| 12 | `Gender` | String | `Male` | Patient gender (anonymized for demo) |

### Destination Columns

| # | Column Name | Type | Example | Description |
|---|-------------|------|---------|-------------|
| 13 | `Hospital` | String | `H1` | Receiving hospital identifier |
| 14 | `Department` | String | `Emergency` | Receiving department |
| 15 | `Distance (km)` | Number | `12.4` | Mission travel distance in kilometers |

### Time Performance Columns

| # | Column Name | Type | Example | Description |
|---|-------------|------|---------|-------------|
| 16 | `Response Time (min)` | Number | `12.5` | **Key KPI.** Time from call receipt to paramedic on-scene. Target: ≤15 min |
| 17 | `Dispatch Time (min)` | Number | `4.2` | **Key KPI.** Time from mission assignment to vehicle departure. Target: ≤8 min |
| 18 | `Travel Time (min)` | Number | `8.3` | Time from departure to hospital arrival |
| 19 | `Duration (min)` | Number | `127` | Total mission time from call to mission close |
| 20 | `Waiting Time (min)` | Number | `15` | Wait time at receiving hospital before handover |

### Outcome Columns

| # | Column Name | Type | Example | Description |
|---|-------------|------|---------|-------------|
| 21 | `Status` | String | `Good` | **Key KPI.** Mission outcome classification. Values: `Late`, `Good`, `Excellent` |
| 22 | `Outcome` | String | `Transferred` | Final patient disposition |
| 23 | `Equipment Used` | String | `Stretcher` | Primary equipment used |

### Quality & Flags

| # | Column Name | Type | Example | Description |
|---|-------------|------|---------|-------------|
| 24 | `Incident Notes` | String | `Delayed at scene` | Free-text operational note |
| 25 | `Data Entry User` | String | `OP-003` | ID of the operator who logged the mission |

---

## Field Enumerations

### `Status` — Mission Outcome

| Value | Arabic | Description | KPI Impact |
|-------|--------|-------------|------------|
| `Late` | متأخر | Response time exceeded threshold | Counted in `lateRate` |
| `Good` | جيد | Responded within target | Counted in `goodRate` |
| `Excellent` | ممتاز | Responded well under target | Counted in `excRate` |

### `Shift` — Work Shift

| Value | Arabic | Hours (Approximate) |
|-------|--------|---------------------|
| `Morning` | الصباح | 07:00 – 15:00 |
| `Evening` | المساء | 15:00 – 23:00 |
| `Night` | الليل | 23:00 – 07:00 |

### `Referral Type` — Mission Urgency

| Value | Arabic | Description |
|-------|--------|-------------|
| `Life-Saving` | إنقاذ حياة | Immediate life-threatening emergency |
| `Emergency` | طارئ | Urgent but not immediately life-threatening |
| `Semi-Emergency` | شبه طارئ | Scheduled urgent transfer |
| `Routine` | اعتيادي | Non-urgent patient transfer |

### `Severity` — Clinical Severity

| Value | Arabic | Description |
|-------|--------|-------------|
| `Critical` | حرج | Immediate intervention required |
| `Serious` | خطير | Significant deterioration risk |
| `Moderate` | متوسط | Stable but requires monitoring |
| `Minor` | بسيط | Minor condition, low urgency |

### `Patient Age Group`

| Value | Arabic | Age Range |
|-------|--------|-----------|
| `Pediatric` | أطفال | 0–17 years |
| `Adult` | بالغ | 18–64 years |
| `Geriatric` | مسن | 65+ years |

---

## KPI Derivation Map

Shows which columns are used to compute each dashboard KPI:

```
Dashboard KPI           ← Source Column(s)
───────────────────────────────────────────────────────
avgResp                 ← "Response Time (min)"
avgDisp                 ← "Dispatch Time (min)"
avgTravel               ← "Travel Time (min)"
avgDur                  ← "Duration (min)"
lateRate / goodRate     ← "Status"
lifeSavePct             ← "Severity" (contains "life"/"saving")
centers breakdown       ← "Center" + all time columns + "Status"
monthlyArr              ← "Month"
topHospitals            ← "Hospital"
shiftMap                ← "Shift"
```

---

## Data Quality Notes

### Synthetic Data

All records in `Medical-Transport-Analytics.xlsx` are **synthetically generated** for demonstration purposes:

- No real patient identifiers or medical records
- Names, IDs, and locations are randomized
- Time distributions follow realistic EMS patterns
- KPI values reflect plausible operational scenarios

### Column Name Flexibility

The platform uses fuzzy column name matching (see [`ALGORITHMS.md#column-resolution-algorithm`](./ALGORITHMS.md#column-resolution-algorithm)). Your Excel file does not need to use exact column names, but should contain recognizable variants of:

```
Required for core KPIs:
  "Response Time"   (or "response", "ResponseMin", etc.)
  "Dispatch Time"   (or "dispatch", "DispatchMin", etc.)
  "Status"          (exact or containing "status")
  "Center"          (or "centre")
  "Month"           (exact or containing "month")

Optional (enriches dashboard):
  "Severity", "Shift", "Hospital", "Travel Time", "Duration"
```

### Minimum Data Requirements

For `calcKPIs()` to return non-null results:
- At least **1 data row** (beyond header)
- At least one recognizable time column (`Response Time`, `Dispatch Time`, etc.)

---

## CSV Import Format

If importing via CSV (rather than Excel), use this format:

```csv
Mission ID,Date,Month,Center,Paramedic ID,Vehicle ID,Shift,Response Time (min),Dispatch Time (min),Travel Time (min),Duration (min),Status,Severity,Hospital,Referral Type
M-00001,2024-01-15,January,C01,P-042,AMB-07,Morning,12.5,4.2,8.3,127,Good,Critical,H1,Emergency
M-00002,2024-01-15,January,C02,P-018,AMB-03,Evening,18.2,6.1,12.1,145,Late,Moderate,H2,Routine
M-00003,2024-01-15,January,C01,P-055,AMB-11,Night,9.8,3.5,6.3,98,Excellent,Critical,H1,Life-Saving
```

**Important:**
- Headers must be in row 1
- Comma delimiter (`,`)
- Numeric columns must use `.` as decimal separator
- Text values with commas must be wrapped in double quotes
- No trailing commas

---

## Field Templates

### Paramedic Incident Report (بلاغ المسعف)

For real-world data collection, use the provided field template:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Mission ID | Auto-generated | Yes | Format: M-XXXXX |
| Date/Time | DateTime | Yes | 24hr format |
| Center | Dropdown | Yes | Select from C01–C20 |
| Paramedic ID | Dropdown | Yes | Select from active roster |
| Vehicle ID | Dropdown | Yes | Select from active fleet |
| Patient Severity | Dropdown | Yes | Critical/Serious/Moderate/Minor |
| Dispatch Time | Timer | Yes | Start when vehicle departs |
| Response Time | Timer | Yes | Start when call received |
| Hospital Destination | Dropdown | Yes | Select receiving facility |
| Status | Auto-calculated | Yes | Based on response vs. threshold |
| Notes | Free text | No | Max 500 characters |

> Download the Google Sheets field template: [نماذج الميدان](https://docs.google.com/spreadsheets/d/1-ZUjvnIdeTTqLc3Z-nyYd8Csftds2e6l/edit?usp=sharing)
