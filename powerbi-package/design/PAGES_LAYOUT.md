# Power BI Report — Pages Layout Guide

**Report:** Medical Transport Operations Analytics 2025
**Canvas size:** 1280 × 720 (16:9) for all pages
**Theme colors:**
- Primary `#0B5394` (deep blue)
- Success `#2E7D32` (green)
- Warning `#F9A825` (amber)
- Critical `#C62828` (red)
- Neutral `#455A64` (slate)
- Background `#F5F7FA`

---

## Page 1 — Executive Overview

**Purpose:** One-glance snapshot for leadership.

### Header band (top, full width, 60 px)
- Title: "Medical Transport Operations — Executive Overview"
- Subtitle: `[Dynamic Page Title]` measure
- Report refresh timestamp (right-aligned text box: `="Last refresh: " & FORMAT(NOW(),"yyyy-mm-dd HH:mm")`)

### KPI cards row (6 cards, 180 × 110 each)
| # | Card | Measure | Format |
|---|------|---------|--------|
| 1 | Total Missions | `[Total Missions]` | #,0 |
| 2 | Avg Total Response | `[Avg Total Response (min)]` | 0.0 " min" |
| 3 | On-Time Rate | `[On-Time Rate]` | 0.0% |
| 4 | Life-Saving % | `[Life-Saving %]` | 0.0% |
| 5 | Active Paramedics | `[Active Paramedics]` | #,0 |
| 6 | SLA Status | `[SLA Status Label]` | Conditional color via `[SLA Status Color]` |

### Middle row (two visuals, 620 × 280 each)
- **Left — Missions Trend (Line chart)**
  Axis: `DimDate[Date]` · Values: `[Rolling 7d Missions]` and `[Total Missions]`
- **Right — Missions by Department (Bar chart, horizontal)**
  Axis: `FactOperations[Medical Department]` · Values: `[Total Missions]` · Sort desc

### Bottom row (three visuals, 400 × 230 each)
- **Top 5 Centers (Table)** — Center Name, Total Missions, Avg Total Response, On-Time Rate
- **Referral Type donut** — Life-Saving vs Stable share
- **Shift split (100% stacked bar)** — Morning vs Evening by Month

### Slicers (right panel, vertical)
- Month (dropdown), Center, Referral Type, Shift Period

---

## Page 2 — Response-Time Analysis

**Purpose:** Deep-dive into the four response-time components + SLA.

### Header
Title: "Response-Time Analysis"

### KPI cards row (4 cards)
- Avg Dispatch · Avg Response · Avg Travel · Avg Total Response

### Waterfall chart (top, 1200 × 240)
Axis: components (Dispatch, Response, Travel) → Total
Uses individual measures to explain what drives Total Response.

### Middle row (two visuals, 620 × 260)
- **Left — Response-Time Distribution (Histogram / column)**
  Axis: bins on `Total Response (min)` (create binning group in Power BI: 0-30, 30-60, 60-90, 90+)
  Values: `[Total Missions]`
- **Right — Percentiles by Center (Clustered column)**
  Axis: `FactOperations[Center Name]`
  Values: `[P50 Total Response]`, `[P90 Total Response]`, `[P95 Total Response]`

### Bottom row (two visuals, 620 × 220)
- **SLA breach table** — Center · Missions Above SLA · Above SLA % · Avg Total Response · sorted by breach desc
- **Scatter — Travel vs Response by Center**
  X: `[Avg Travel (min)]` · Y: `[Avg Response (min)]` · Size: `[Total Missions]` · Legend: Center Name

### Slicers
- Date range (between-slider), Referral Type, Shift Period, Department

---

## Page 3 — Time Intelligence

**Purpose:** Temporal patterns — trends, seasonality, peak hours.

### Header
Title: "Temporal Patterns & Trends"

### KPI cards row (4 cards)
- Missions YTD · Missions MTD · MoM % · Rolling 30d Missions

### Trend chart (top, 1200 × 260)
Line + column combo:
- Column: `[Total Missions]` by `DimDate[Date]`
- Line: `[Rolling 7d Missions]` (smoothed)
- Secondary line: `[Rolling 7d Avg Total Response]`

### Middle row — Heatmap grid (1200 × 230)
Matrix visual:
- Rows: `DimDate[DayName]` (sort by DayOfWeekNo)
- Columns: `FactOperations[AcceptanceHour]` (0-23)
- Values: `[Total Missions]`
- Conditional formatting: white → primary blue

### Bottom row (two visuals, 620 × 200)
- **Monthly comparison (Clustered column)**
  Axis: `DimDate[Month]` (sort by MonthNo) · Values: `[Total Missions]`, `[Avg Total Response (min)]` (dual axis)
- **Shift × Day (Matrix)**
  Rows: Day of Week · Columns: Shift Period · Values: `[Total Missions]`, `[On-Time Rate]`

### Slicers
- Year (fixed 2025 for now), Quarter, Center, Department

---

## Global settings

- Enable "Sync slicers" across pages for Center + Referral Type
- Add a page navigator on the left rail (Buttons + bookmarks)
- Tooltip page: create a hidden page "Tooltip-CenterDetail" with Center Rank cards
- Report-level filter: `FactOperations[Referral Date]` between 2025-01-01 and 2025-12-31
