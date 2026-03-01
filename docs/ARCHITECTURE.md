# System Architecture — Wasl Platform (وصل)

## Overview

Wasl is a client-side, single-page application (SPA) built as a **zero-backend, AI-first healthcare intelligence platform**. It is intentionally serverless in its MVP form to enable rapid deployment and zero infrastructure cost.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  Wasl SPA (index.html)                        │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │   │
│  │  │   Dashboard  │  │  Monitoring  │  │  Mission Registry  │ │   │
│  │  │   KPIs+Charts│  │  Live Feed   │  │  14,169 Records    │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘ │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │   │
│  │  │   Centers    │  │  Paramedics  │  │   Auto Reports     │ │   │
│  │  │   20 Centers │  │  219 Staff   │  │   PDF + Webhook    │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐   │
│  │   Chart.js 4.4.0    │  │   Cairo Font + JetBrains Mono       │   │
│  │   (CDN)             │  │   (Google Fonts CDN)                │   │
│  └─────────────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │                              │
         │ HTTPS                        │ Webhook (POST)
         ▼                              ▼
┌─────────────────┐          ┌─────────────────────────────────────┐
│  GitHub Pages   │          │         Make.com Automation         │
│  Static Hosting │          │                                     │
│  CDN-backed     │          │  1. Trigger: 7:00 AM (Riyadh time)  │
│  Free tier      │          │  2. GPT-4o analyzes KPI data        │
└─────────────────┘          │  3. Generates Arabic HTML report    │
                             │  4. Sends via Gmail API             │
                             └─────────────────────────────────────┘
```

---

## Component Architecture

### Module Map

```
index.html (~4,000 lines)
│
├── <head>
│   ├── Meta tags (SEO, PWA, OG)
│   ├── Chart.js CDN
│   └── Google Fonts (Cairo, JetBrains Mono)
│
├── <style> (CSS, ~600 lines)
│   ├── CSS Variables (design tokens)
│   ├── Login screen styles
│   ├── Sidebar & navigation
│   ├── Topbar & clock
│   ├── KPI cards
│   ├── Charts & cards
│   ├── Tables & forms
│   ├── Alert feed
│   └── Responsive breakpoints
│
├── <body>
│   ├── #loginScreen
│   │   ├── Role selector (Admin/Manager/Dispatcher)
│   │   └── Credentials form
│   │
│   ├── .sidebar
│   │   ├── Logo mark
│   │   ├── Navigation items
│   │   └── User card
│   │
│   ├── .main
│   │   ├── .topbar (clock, live indicator, notifications)
│   │   └── .content
│   │       ├── #page-dashboard    (KPIs, charts, alerts)
│   │       ├── #page-monitoring   (live feed, metrics)
│   │       ├── #page-registry     (mission table, search)
│   │       ├── #page-entry        (form + Excel import)
│   │       ├── #page-centers      (20 centers)
│   │       ├── #page-paramedics   (219 staff)
│   │       ├── #page-reports      (PDF + webhook)
│   │       ├── #page-alerts       (threshold config)
│   │       ├── #page-impact       (ROI analysis)
│   │       └── #page-settings     (KPI limits + webhook)
│   │
│   └── #notifPanel
│
└── <script> (JS, ~2,400 lines)
    ├── DATA constants (MISSIONS, CENTERS, PARAMEDICS)
    ├── Authentication functions
    ├── Navigation & routing
    ├── Dashboard rendering
    ├── Chart.js initialization
    ├── Live monitoring simulation
    ├── Alert generation
    ├── Report generation (jsPDF)
    ├── Make.com webhook integration
    └── Service Worker registration
```

---

## Data Architecture

### Current (MVP)

```
Excel File (.xlsx)
    └── "Daily Operations Data" sheet
        └── 14,169 rows × 25 columns
            ├── Mission ID
            ├── Center Name (20 centers)
            ├── Paramedic Name (219 staff)
            ├── Referral Type (Emergency/Routine)
            ├── Response Time (min)
            ├── Dispatch Time (min)
            ├── Mission Duration (min)
            ├── Destination Hospital
            ├── Mission Status
            └── Timestamps
```

Data is embedded directly in JavaScript constants within `index.html` for zero-latency access.

### Phase 1 Target Architecture

```
Google Sheets (Live DB)
    └── Apps Script API endpoint
        └── Real-time data sync
            └── Wasl platform (polls every 60s)
```

### Phase 3 Target Architecture

```
Cloud Database (PostgreSQL / Supabase)
    └── REST API (Node.js / FastAPI)
        └── Multi-tenant auth (JWT)
            └── Wasl SaaS platform
                └── Hospital A | Hospital B | Hospital C
```

---

## Authentication Architecture

### Current (Demo Mode)

```
Client-side role selection
    └── 3 roles: Admin | Manager | Dispatcher
        └── No real validation (demo only)
            └── Session stored in localStorage
```

### Production Target

```
Identity Provider (Auth0 / Cognito / Azure AD)
    └── JWT tokens
        └── Role-based access control (RBAC)
            ├── Admin: Full access
            ├── Manager: Center-level data only
            └── Dispatcher: Own center + missions only
```

---

## Automation Architecture

```
Make.com Scenario
│
├── Trigger: Schedule (7:00 AM Asia/Riyadh)
│
├── Step 1: HTTP Request (GET Wasl webhook data)
│   └── Reads KPI summary from platform
│
├── Step 2: OpenAI GPT-4o
│   ├── Input: KPI data + Arabic system prompt
│   ├── Analysis: Trends, alerts, recommendations
│   └── Output: Professional Arabic HTML report
│
├── Step 3: Gmail (Send email)
│   ├── To: Operations team
│   ├── Subject: "تقرير وصل اليومي — [date]"
│   └── Body: GPT-4o generated HTML
│
└── Error handling: Retry × 3, alert on failure
```

---

## Security Architecture

### Current Threat Model

| Threat | Mitigation |
|--------|-----------|
| XSS | No user-generated HTML rendered, no innerHTML from untrusted sources |
| Data exposure | Only synthetic data in repository |
| API key exposure | No API keys in client code (webhook URL in settings only) |
| CDN tampering | SRI hashes recommended for production (future) |

### Production Security Checklist

- [ ] Subresource Integrity (SRI) for all CDN assets
- [ ] Content Security Policy (CSP) headers
- [ ] HTTPS enforced
- [ ] Server-side authentication
- [ ] Role-based API endpoints
- [ ] Audit logging for all data access
- [ ] PDPL compliance review

---

## Performance Profile

| Metric | Current | Target |
|--------|---------|--------|
| HTML file size | ~400KB | < 200KB (split into modules) |
| First Contentful Paint | ~1.2s | < 0.8s |
| Chart render time | ~300ms | < 200ms |
| Data load time | Instant (embedded) | < 500ms (API) |
| Offline support | ✅ (Service Worker) | ✅ |
| Mobile performance | Good | Excellent |

---

## Deployment Architecture

```
Developer Machine
    └── git push origin main
        └── GitHub Actions (deploy.yml)
            ├── validate job (HTML check, security scan)
            └── deploy job → GitHub Pages
                └── CDN Edge (GitHub's global CDN)
                    └── https://moha-111.github.io/Medical-Transport-Operations-Analytics/
```

---

*Last updated: 2026-02-27*
*Wasl Architecture Documentation v1.3.0*
