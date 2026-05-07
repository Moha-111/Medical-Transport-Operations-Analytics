# System Architecture — Wasl (وصل)

> Patient Transfer Intelligence Platform

---

## Table of Contents

- [High-Level Overview](#high-level-overview)
- [Component Map](#component-map)
- [Data Flow](#data-flow)
- [Frontend Architecture](#frontend-architecture)
- [Analytics Engine (core.js)](#analytics-engine-corejs)
- [Automation Pipeline](#automation-pipeline)
- [Hosting & Deployment](#hosting--deployment)
- [Security Architecture](#security-architecture)
- [Scalability Notes](#scalability-notes)

---

## High-Level Overview

Wasl is a **client-side Single Page Application (SPA)** with no backend server. All computation happens in the browser. The only external integrations are:

1. **Make.com** — automation trigger for daily reports
2. **OpenAI GPT-4o** — Arabic narrative generation
3. **Gmail API** — email delivery
4. **GitHub Pages** — static file hosting

```
╔══════════════════════════════════════════════════════════════╗
║                    WASL PLATFORM OVERVIEW                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   [User's Browser]         [External Services]               ║
║   ┌─────────────────┐      ┌──────────────────────────┐      ║
║   │  index.html     │      │  Make.com Automation     │      ║
║   │  (SPA)          │◄────►│  → OpenAI GPT-4o         │      ║
║   │                 │      │  → Gmail API             │      ║
║   │  core.js        │      └──────────────────────────┘      ║
║   │  (engine)       │                                        ║
║   └────────┬────────┘      ┌──────────────────────────┐      ║
║            │               │  GitHub Pages            │      ║
║            │               │  (Static File Host)      │      ║
║   [Local Storage]          └──────────────────────────┘      ║
║   (config, thresholds)                                       ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Component Map

```
Medical-Transport-Operations-Analytics/
│
├── index.html              ← Main SPA (3,879 lines)
│   ├── HTML Structure      ← 9 views (login, dashboard, monitoring…)
│   ├── CSS Styles          ← Dark theme, RTL Arabic, Chart.js
│   └── JavaScript          ← UI logic, event handlers, chart rendering
│
├── src/
│   └── core.js             ← Pure business logic (testable)
│       ├── parseCSV()
│       ├── calcKPIs()
│       ├── detectBreaches()
│       ├── wma()
│       ├── trendSlope()
│       ├── predict()
│       ├── serialiseCFG()
│       └── deserialiseCFG()
│
├── tests/                  ← Jest test suite (130 tests)
│   ├── calcKPIs.test.js
│   ├── config.test.js
│   ├── detectBreaches.test.js
│   ├── parseCSV.test.js
│   ├── prediction.test.js
│   └── integration.test.js
│
├── Medical-Transport-Analytics.xlsx   ← Dataset (14,169 rows × 25 cols)
├── package.json            ← Jest config + npm scripts
└── docs/                   ← Technical documentation (this folder)
```

---

## Data Flow

### 1. Initial Data Load

```
User opens index.html
       │
       ▼
Login screen (role selection)
       │
       ▼
Main Dashboard loads
       │
       ├── [If Excel imported previously]
       │       localStorage → deserialiseCFG() → SYNC state
       │       Stored CSV   → parseCSV() → rows array
       │
       └── [If new session]
               Demo data shown (no import needed)
```

### 2. Excel Import Flow

```
User clicks "Import Excel"
       │
       ▼
File input → FileReader API (browser)
       │
       ▼
SheetJS (xlsx.js) parses .xlsx binary
       │
       ▼
Extracts "Daily Operations Data" sheet
       │
       ▼
Converts to CSV string
       │
       ▼
parseCSV(csvString) → rows[]
       │
       ▼
calcKPIs(rows) → kpiResult{}
       │
       ├── Update all KPI cards
       ├── Redraw Chart.js charts
       ├── detectBreaches() → show alerts
       └── Store rows in sessionStorage
```

### 3. Live Monitoring Loop (every 5 seconds)

```
setInterval(5000ms)
       │
       ▼
Fetch latest KPI snapshot
       │
       ▼
Compare to previous snapshot
       │
       ├── detectBreaches(curr, prev, thresholds)
       │       │
       │       └── New breach? → Add to alert log → Flash badge
       │
       └── Update live event log panel
```

### 4. Automated Report Flow

```
07:00 AM Riyadh Time
       │
       ▼
Make.com scheduled trigger
       │
       ▼
HTTP GET to Wasl Webhook endpoint
       │
       ▼
Wasl responds with JSON KPI snapshot
       │
       ▼
Make.com sends to OpenAI GPT-4o:
  - System: "You are an Arabic EMS operations analyst…"
  - User:   KPI data + thresholds + trends
       │
       ▼
GPT-4o returns Arabic HTML report:
  - Executive summary
  - KPI performance cards
  - Alert highlights
  - Recommendations
       │
       ▼
Make.com Gmail module sends email
  - To: operations team
  - Subject: "تقرير وصل اليومي — {date}"
  - Body: Professional HTML template
       │
       ▼
Operations team inbox ✅
```

---

## Frontend Architecture

### View System

The SPA has **9 views** toggled by CSS class switching (no routing library):

```
Views:
  #view-login       ← Authentication (role selection)
  #view-dashboard   ← Main KPI dashboard
  #view-monitoring  ← Live monitoring (5s refresh)
  #view-missions    ← Mission registry (14,169 records)
  #view-entry       ← Manual data entry form
  #view-centers     ← Center management
  #view-paramedics  ← Paramedic tracking
  #view-reports     ← Auto report configuration
  #view-settings    ← Threshold + webhook config
```

### Design System

```
Color Palette:
  Primary Teal:    #00C9A7   ← KPI positive / headers
  Primary Blue:    #0098DB   ← Links / accents
  Alert Amber:     #F6A623   ← Warning breaches
  Alert Red:       #FF5252   ← Critical breaches
  Success Green:   #30D158   ← Met targets
  Background Dark: #060A14   ← Main background
  Card Background: #1A263D   ← Panel backgrounds

Typography:
  Arabic text:     'Cairo' (Google Fonts)
  Monospace/code:  'JetBrains Mono'
  Direction:       RTL (dir="rtl" on <html>)

Layout:
  Sidebar:         240px fixed width
  Content:         calc(100vw - 240px)
  Charts:          Chart.js 4.4.0
  Grid:            CSS Grid + Flexbox
```

### State Management

No framework — plain JavaScript with a global `SYNC` object:

```javascript
SYNC = {
  gsUrl:        '',      // Google Sheets URL (future)
  webhookUrl:   '',      // Make.com webhook
  alertEmail:   '',      // Report recipient
  intervalMin:  5,       // Live refresh interval
  thresholds: {
    resp:         15,    // Max response time (min)
    late:         95,    // Max late rate (%)
    missionsMax:  60,    // Max daily missions per center
  },
  alertLog:     [],      // Last 100 alerts
  alertsToday:  0,
}
```

Config is persisted to `localStorage` via `serialiseCFG()` / `deserialiseCFG()`.

---

## Analytics Engine (core.js)

The business logic is isolated in `src/core.js` as pure functions with zero side effects. This separation enables:

- **Testability**: 130 Jest unit tests run without a browser
- **Portability**: Functions can be used in Node.js scripts or future API servers
- **Maintainability**: UI code and business logic are decoupled

```
core.js exports:
  ┌─────────────────────────────────────────────────────┐
  │  Data Ingestion                                     │
  │    parseCSV(txt) → rows[]                           │
  ├─────────────────────────────────────────────────────┤
  │  KPI Computation                                    │
  │    calcKPIs(rows) → kpiResult{}                     │
  ├─────────────────────────────────────────────────────┤
  │  Alert System                                       │
  │    detectBreaches(curr, prev, thresholds) → alert[] │
  ├─────────────────────────────────────────────────────┤
  │  Prediction Engine                                  │
  │    wma(arr, window) → number                        │
  │    trendSlope(arr, n) → number                      │
  │    predict(historical, factors, day, ahead) → {}    │
  ├─────────────────────────────────────────────────────┤
  │  Config Persistence                                 │
  │    serialiseCFG(syncState) → string                 │
  │    deserialiseCFG(raw, syncState) → syncState       │
  └─────────────────────────────────────────────────────┘
```

See [`API-REFERENCE.md`](./API-REFERENCE.md) for full function signatures.

---

## Automation Pipeline

### Make.com Scenario Structure

```
Scenario: "Wasl Daily Report"
  ┌─────────────────────────────────────────┐
  │  1. Schedule Module                     │
  │     Run: Daily at 07:00 (Asia/Riyadh)  │
  └──────────────────┬──────────────────────┘
                     │
  ┌──────────────────▼──────────────────────┐
  │  2. HTTP Module (Webhook)               │
  │     GET {webhookUrl}/kpi-snapshot       │
  │     Response: JSON KPI data             │
  └──────────────────┬──────────────────────┘
                     │
  ┌──────────────────▼──────────────────────┐
  │  3. OpenAI Module                       │
  │     Model: gpt-4o                       │
  │     System: Arabic EMS analyst prompt  │
  │     User: KPI JSON + context           │
  │     Output: HTML report string          │
  └──────────────────┬──────────────────────┘
                     │
  ┌──────────────────▼──────────────────────┐
  │  4. Gmail Module                        │
  │     To: {alertEmail}                    │
  │     Subject: تقرير وصل اليومي          │
  │     Body: HTML from step 3              │
  └─────────────────────────────────────────┘
```

---

## Hosting & Deployment

```
Repository: github.com/Moha-111/Medical-Transport-Operations-Analytics
Branch:     main (or gh-pages)
Hosting:    GitHub Pages (free tier)
URL:        https://moha-111.github.io/Medical-Transport-Operations-Analytics/

File served: index.html (root)
Assets:      All relative paths resolve from root
HTTPS:       Enforced by GitHub Pages
CDN:         Chart.js loaded from cdn.jsdelivr.net
```

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for step-by-step setup instructions.

---

## Security Architecture

### Current (Innovation MVP)

- No authentication server — login is purely role-based UI
- No patient PII in the dataset (synthetic data only)
- Config stored in `localStorage` (client-side only)
- HTTPS enforced via GitHub Pages

### Production Roadmap

```
Phase 1: Auth
  → Server-side session tokens
  → Role-based API access control
  → Center-scoped data isolation

Phase 2: Data Protection
  → Patient ID anonymization (hash-based)
  → Field-level encryption for sensitive columns
  → Audit log for every data access

Phase 3: Compliance
  → Saudi PDPL (Personal Data Protection Law) audit
  → Data residency: KSA servers only
  → Penetration testing + security certification
```

---

## Scalability Notes

The current architecture is intentionally simple for innovation validation and pilot-readiness review:

| Constraint | Current | Production Path |
|------------|---------|-----------------|
| Data storage | Excel file / browser | PostgreSQL / Google Sheets API |
| Data volume | 14,169 rows | No limit with server-side pagination |
| Concurrent users | 1 (browser session) | Multi-tenant SaaS with auth |
| Real-time updates | Simulated (5s poll) | WebSockets / Server-Sent Events |
| Report generation | Make.com (1 webhook) | Dedicated report microservice |
| Hosting | GitHub Pages | AWS / Azure KSA region |

The analytics logic in `core.js` is designed to run identically in Node.js, making it portable to a backend API without modification.
