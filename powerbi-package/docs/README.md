# Power BI Package — Medical Transport Operations Analytics

Complete starter kit to build a professional Power BI report on top of `Medical-Transport-Analytics.xlsx`.
Everything below is **plain text** so it works on any Power BI Desktop version (no dependency on `.pbix` binary format).

## Contents

```
powerbi-package/
├── queries/          # Power Query M scripts (data load & transform)
│   ├── 01_FactOperations.m
│   ├── 02_DimDate.m
│   └── 03_DimCenter_DimHospital_DimParamedic.m
├── dax/              # DAX measure library (copy-paste into Power BI)
│   ├── 01_Core_KPIs.dax
│   ├── 02_Time_Intelligence.dax
│   └── 03_Rankings_and_Advanced.dax
├── design/
│   ├── PAGES_LAYOUT.md   # Detailed layout for 3 pages
│   └── theme.json        # Custom theme (import via View > Themes > Browse)
└── docs/
    └── README.md         # This file
```

## Setup — step by step

### 1. Open Power BI Desktop → new report

### 2. Add a parameter for the file path
- Home → Transform data → Manage parameters → New
- Name: `FilePath`
- Type: `Text`
- Current value: full path to your local `Medical-Transport-Analytics.xlsx`
  (e.g. `C:\Users\Mohammad\Documents\Medical-Transport-Analytics.xlsx`)

### 3. Create the queries
For each `.m` file:
- Right-click in the Queries pane → New Query → Blank Query
- Open Advanced Editor
- Paste the entire content of the `.m` file
- Rename the query to match the file name (e.g. `FactOperations`, `DimDate`)

Order matters:
1. `FactOperations` first
2. `DimDate` next
3. Dimensions last (they reference `FactOperations`)

Click **Close & Apply**.

### 4. Mark DimDate as Date Table
- Select `DimDate` in Data view
- Table tools → Mark as date table → choose `Date` column

### 5. Build relationships
Model view — create these relationships (all single-direction, many-to-one from Fact → Dim):

| From (many) | To (one) |
|---|---|
| `FactOperations[Referral Date]` | `DimDate[Date]` |
| `FactOperations[Center Name]` | `DimCenter[Center Name]` |
| `FactOperations[To]` | `DimHospital[Hospital]` |
| `FactOperations[Paramedic]` | `DimParamedic[Paramedic]` |
| `FactOperations[Shift Period]` | `DimShift[Shift Period]` |

### 6. Create the measures table
- Home → Enter data → Table name: `_Measures` → add one dummy column → Load
- Hide the dummy column
- For each `.dax` file, copy each measure and paste as **New measure** on `_Measures`

Tip: measures starting with `_` or `zz` help you keep the table sticky at the top.

### 7. Apply the theme
- View → Themes → Browse for themes → select `design/theme.json`

### 8. Build the pages
Follow `design/PAGES_LAYOUT.md` exactly. Every visual, measure, axis, and slicer is specified there.

## Data-model diagram (star schema)

```
                    ┌──────────────┐
                    │   DimDate    │
                    └──────┬───────┘
                           │
     ┌───────────────┐     │     ┌─────────────────┐
     │  DimCenter    │─────┤─────│  DimParamedic   │
     └───────────────┘     │     └─────────────────┘
                     ┌─────▼─────┐
                     │FactOperat.│
                     └─────┬─────┘
     ┌───────────────┐     │     ┌─────────────────┐
     │ DimHospital   │─────┴─────│    DimShift     │
     └───────────────┘           └─────────────────┘
```

## Refresh strategy

- Development: file lives locally → manual refresh
- Production: move the xlsx to OneDrive/SharePoint and re-point `FilePath` to the SharePoint URL, or migrate to a dataflow/dataset

## Known SLA baseline (from data profile)

| Metric | Value |
|---|---|
| Total missions 2025 | 14,169 |
| Avg total response | 64.3 min |
| P90 total response | ~99 min |
| On-time rate (current) | 4.7% |
| Late rate | 95.3% |
| Life-saving share | 35.1% |

**Note:** the current "On-Time Rate" is unusually low because the Excel file was flagged with a strict definition. The `Target Total Response = 60` measure lets you set your own SLA. Adjust to your operational policy.

## Support

- For DAX debugging use DAX Studio (free)
- For version control, commit the `.pbip` project format (File → Save as → Power BI project) — not the `.pbix` binary
