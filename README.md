<div align="center">

![header](https://capsule-render.vercel.app/api?type=waving&color=00C9A7,0098DB&height=200&section=header&text=Wasl%20|%20وصل&fontsize=42&fontColor=ffffff&fontAlignY=38&desc=Smart%20Patient%20Transfer%20Operations%20Platform&descSize=16&descAlignY=58&animation=fadeIn)

# 🚑 Wasl (وصل) — Patient Transfer Intelligence Platform

### *Connecting Patients. Empowering Centers. Saving Lives.*

<br/>

[![Records](https://img.shields.io/badge/Records-14%2C169%20Missions-1B3A6B?style=for-the-badge&logo=database&logoColor=white)](https://moha-111.github.io/Medical-Transport-Operations-Analytics/)
[![Centers](https://img.shields.io/badge/Centers-20%20Active-00C9A7?style=for-the-badge&logo=building&logoColor=white)](https://moha-111.github.io/Medical-Transport-Operations-Analytics/)
[![Staff](https://img.shields.io/badge/Paramedics-219%20Field%20Staff-E67E22?style=for-the-badge&logo=person&logoColor=white)](https://moha-111.github.io/Medical-Transport-Operations-Analytics/)
[![Automation](https://img.shields.io/badge/Automation-LIVE%20🟢-30D158?style=for-the-badge)](https://moha-111.github.io/Medical-Transport-Operations-Analytics/)

<br/>

> **Built at Tuwaiq Hackathon using Vibe Coding — zero traditional programming, 100% AI-powered.**

### 🌐 [Live System](https://moha-111.github.io/Medical-Transport-Operations-Analytics/)

</div>

---

## 📌 Overview

**Wasl (وصل)** is an operational intelligence platform designed for private clinics and hospitals to monitor and analyze patient transfer operations. It consolidates 14,169 transfer missions into a single intelligence layer — covering KPI performance, center benchmarks, paramedic efficiency, and strategic recommendations.

**Wasl** in Arabic means *"to connect"* — connecting patients to hospitals, and decisions to data.

This project demonstrates how **no-code/AI-first** development can produce enterprise-grade healthcare analytics without writing a single line of traditional code.

---

## 🎯 The Problem

Patient transport networks face 3 critical blind spots:

| Challenge | Impact |
|-----------|--------|
| No unified performance visibility across centers | Reactive, not proactive management |
| Manual reports taking days to produce | Delayed decision-making |
| No benchmark for paramedic and vehicle efficiency | Inability to identify improvement areas |

**Wasl solves all three — and now sends automated AI reports every morning.**

---

## 🤖 Automation — LIVE ✅

Wasl is connected to a **fully automated reporting pipeline** powered by Make.com + OpenAI:

| Time | Action |
|------|--------|
| ⏰ **7:00 AM daily** | Make.com triggers automatically |
| 🤖 **GPT-4o analyzes** | KPIs, trends, alerts, recommendations |
| 📧 **Arabic report sent** | Professional HTML email to operations team |

> *The system runs 365 days a year with zero manual intervention.*

![Daily Report](./report-screenshot.png)

---

## 🖥️ System Components

```
🚑 Wasl Integrated Platform
│
├── 📊  Main Dashboard        → KPIs + Charts + Center Performance
├── 📡  Live Monitoring       → Updates every 5s + Live Event Log
├── 🗂️  Mission Registry      → 14,169 missions + Search & Filter
├── ➕  Data Entry            → Manual form + Excel Import
├── 🏢  Center Management     → 20 centers + Progress Bars
├── 👨‍⚕️ Paramedic Management  → 219 paramedics + Individual Status
├── 📄  Auto Reports          → PDF generation + Make.com scheduling
├── 🔔  Alert System          → Instant alerts when KPI thresholds exceeded
└── ⚙️  Settings              → KPI limits + Make.com Webhook config
```

---

## 🔑 Key Findings

| KPI | Value | Target | Status |
|-----|-------|--------|--------|
| Avg Response Time | 14.5 min | ≤15 min | ✅ |
| Avg Dispatch Time | 5.5 min | ≤8 min | ✅ |
| Mission Duration | 132.9 min | — | 📊 |
| Emergency Rate | 35.1% | — | 🚨 |
| Late Rate | 95.3% | ≤95% | ⚠️ |
| H1 Hospital Share | 72.1% | Balanced | ⚠️ |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────┐
│              Data Layer                      │
│   Excel (.xlsx) → 14,169 records × 25 cols  │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│            Analytics Layer                   │
│   KPIs, Aggregations, Trend Analysis         │
└──────────┬──────────────────┬───────────────┘
           │                  │
┌──────────▼──────┐  ┌────────▼──────────────┐
│  Wasl Platform  │  │  Make.com Automation  │
│  (HTML/JS)      │  │  OpenAI + Gmail       │
│  GitHub Pages   │  │  Daily 7AM Report     │
└─────────────────┘  └───────────────────────┘
```

### Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Development** | Claude AI (Vibe Coding) | Full project generation |
| **Data** | Microsoft Excel | Operational data storage |
| **Frontend** | HTML/CSS/JS + Chart.js | Interactive Wasl platform |
| **Automation** ✅ LIVE | Make.com + OpenAI GPT-4o | Daily Arabic reports |
| **Delivery** ✅ LIVE | Gmail API | Automated email to team |
| **Hosting** | GitHub Pages | Free, instant deployment |

---

## 🗺️ Roadmap

```
Now ✅          Phase 1 🔵        Phase 2 🟡         Phase 3 🟠
────────────    ──────────────    ───────────────    ───────────────
MVP Complete    Live Google       WhatsApp Alerts    Multi-Hospital
Daily Reports   Sheets DB         Instant KPI        Cloud Platform
Automated 7AM   Real-time sync    Notifications      Multi-tenant
```

| Phase | Description | Tools | Timeline |
|-------|-------------|-------|----------|
| 🔵 **Phase 1** | Connect Google Sheets as live database | Google Sheets API | Week 1 |
| 🟡 **Phase 2** | WhatsApp instant alerts when KPI exceeded | Make.com + WhatsApp API | Week 2 |
| 🔴 **Phase 3** | Multi-hospital cloud dashboard | Cloud Hosting + Auth | Month 2 |

---

## 🚀 Getting Started

### 1. Try the Live System
```
Open your browser:
https://moha-111.github.io/Medical-Transport-Operations-Analytics/
```

### 2. Run Locally
```bash
git clone https://github.com/Moha-111/Medical-Transport-Operations-Analytics.git
cd Medical-Transport-Operations-Analytics
# Open index.html in any browser
```

### 3. Explore the Data (Python)
```python
import pandas as pd

df = pd.read_excel('Medical-Transport-Analytics.xlsx',
                   sheet_name='Daily Operations Data')

print(f"Total missions: {len(df):,}")
print(f"Avg response time: {df['Response Time (min)'].mean():.1f} min")
print(f"Emergency rate: {(df['Referral Type']=='Life-Saving').mean()*100:.1f}%")
```

---

## 💡 Vibe Coding Methodology

Built entirely with **Vibe Coding** — using AI as the primary developer:

1. **Define** the problem in plain language
2. **Request** Claude AI to generate the solution
3. **Iterate** through natural conversation
4. **Deploy** without touching traditional code editors

> *"The best code is the code you never had to write."*

This approach reduced development time from weeks to hours while maintaining professional quality.

---

## 🏆 Hackathon Context

**Event:** Tuwaiq Hackathon — Healthcare Track
**Challenge:** Build a data-driven operational solution for private healthcare facilities
**Approach:** No-code, AI-driven development (Vibe Coding)
**Output:** Complete analytics platform with automated reports + live monitoring

---

## 🚀 Vision — From Hackathon to Real Product

> **Wasl is not just a hackathon project — it is the foundation of a commercial healthcare SaaS platform targeting Saudi Arabia's growing private healthcare sector.**

### The Market Opportunity

```
🏥  450+  Private hospitals in Saudi Arabia
🏢  2,000+ Specialized clinics
🚑  30+   Medical transport companies
📈  $4.2B  Saudi healthcare IT market by 2030
```

### Business Model

| Plan | Target | Price | Features |
|------|--------|-------|---------|
| 🔵 **Basic** | Small clinics | 500 SAR/month | Dashboard + Reports |
| 🟡 **Pro** | Hospitals | 1,500 SAR/month | + WhatsApp Alerts + AI Reports |
| 🔴 **Enterprise** | Hospital chains | Custom | + Multi-branch + API Access |

> **10 hospitals = 15,000 SAR/month recurring revenue**

### Commercial Roadmap

```
NOW ✅              Q3 2026 🔵           Q1 2027 🟡           Q4 2027 🔴
────────────        ──────────────       ──────────────       ──────────────
Hackathon MVP       Pilot Program        First Paying         Full SaaS
Working System      1 Hospital Free      Customer             Platform
AI Reports Live     Collect Feedback     Prove Value          10+ Clients
```

### Why Wasl Will Win

| Advantage | Wasl | Traditional Systems |
|-----------|------|-------------------|
| Full Arabic UI | ✅ | ❌ Rarely |
| AI-powered Arabic reports | ✅ | ❌ |
| WhatsApp instant alerts | ✅ | ❌ |
| Affordable pricing | ✅ | ❌ Expensive |
| Easy to use | ✅ | ❌ Complex |
| Saudi PDPL compliant | ✅ Roadmap | ⚠️ Varies |

### Funding & Support Targets

We are actively seeking support from Saudi Arabia's leading innovation programs:

[![Monshaat](https://img.shields.io/badge/Monsha'at-SME%20Support-1B3A6B?style=for-the-badge)](https://www.monshaat.gov.sa)
[![STV](https://img.shields.io/badge/STV-Saudi%20Tech%20Ventures-00C9A7?style=for-the-badge)](https://stv.vc)
[![Flat6Labs](https://img.shields.io/badge/Flat6Labs-Accelerator-E67E22?style=for-the-badge)](https://flat6labs.com)
[![Vision2030](https://img.shields.io/badge/Vision%202030-Health%20Sector-30D158?style=for-the-badge)](https://vision2030.gov.sa)

### Next Milestones

- [ ] 🔵 Deploy pilot with 1 hospital (free) — collect real feedback
- [ ] 🔵 Add live Google Sheets database integration
- [ ] 🟡 Launch WhatsApp instant KPI alerts
- [ ] 🟡 Register company & apply for Monsha'at support
- [ ] 🟡 Convert to PWA mobile app
- [ ] 🔴 Multi-hospital SaaS platform
- [ ] 🔴 Saudi Ministry of Health certification

---

## 🔒 Privacy & Security

> **Current Status:** All data in this repository is **synthetic/demo data** generated for hackathon purposes only. No real patient information is included.

### Data Protection Roadmap

| Phase | Measure | Status |
|-------|---------|--------|
| 🟡 **Data Anonymization** | All patient identifiers replaced with anonymous IDs | Planned |
| 🟡 **Access Control** | Role-based access — operators see only their center's data | Planned |
| 🟡 **Audit Logging** | Every data access logged with timestamp and user | Planned |
| 🔴 **PDPL Compliance** | Full compliance with Saudi Personal Data Protection Law | Roadmap |
| 🔴 **Data Encryption** | End-to-end encryption for patient transfer records | Roadmap |
| 🔴 **Data Residency** | Data stored exclusively within Saudi Arabia (KSA servers) | Roadmap |

### Commitment

When deployed in real healthcare environments, **Wasl** is committed to:
- ✅ Full compliance with **Saudi PDPL** (نظام حماية البيانات الشخصية)
- ✅ **Zero storage** of identifiable patient data on public repositories
- ✅ **Encrypted transmission** of all sensitive operational data
- ✅ **Minimum data** principle — collect only what's operationally necessary

---

## 📬 Contact

<div align="center">

[![LinkedIn](https://img.shields.io/badge/Connect%20on%20LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/mohammad-alshehri-b0a579388)
[![GitHub](https://img.shields.io/badge/Follow%20on%20GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Moha-111)

</div>

---

<div align="center">

**Built with ❤️ at Tuwaiq Hackathon · Powered by Vibe Coding + Claude AI**

*Wasl — Connecting Patients to Hospitals, and Decisions to Data*

![footer](https://capsule-render.vercel.app/api?type=waving&color=00C9A7,0098DB&height=100&section=footer)

</div>
