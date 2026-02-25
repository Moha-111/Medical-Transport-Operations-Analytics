<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0D7377,1B3A6B&height=200&section=header&text=Medical%20Transport%20Analytics&fontSize=40&fontColor=ffffff&fontAlignY=38&desc=AI-Powered%20Operations%20Intelligence%20for%20Healthcare&descSize=16&descAlignY=58&animation=fadeIn" width="100%"/>

# 🏥 Medical Transport Operations Analytics

### *Evidence-Based Decision Intelligence for Healthcare Leadership*

<br/>

[![Data](https://img.shields.io/badge/Records-14%2C169%20Missions-1B3A6B?style=for-the-badge&logo=database&logoColor=white)](.)
[![Centers](https://img.shields.io/badge/Centers-20%20Active-0D7377?style=for-the-badge&logo=building&logoColor=white)](.)
[![Staff](https://img.shields.io/badge/Paramedics-219%20Field%20Staff-E67E22?style=for-the-badge&logo=person&logoColor=white)](.)
[![Year](https://img.shields.io/badge/Period-Jan–Dec%202025-27AE60?style=for-the-badge&logo=calendar&logoColor=white)](.)
[![Live Demo](https://img.shields.io/badge/Live%20Dashboard-View%20Now-E74C3C?style=for-the-badge&logo=github&logoColor=white)](https://moha-111.github.io/Medical-Transport-Operations-Analytics/)

<br/>

> **Built at [Tuwaiq Hackathon](https://tuwaiq.edu.sa/) using Vibe Coding methodology — no traditional programming, fully AI-powered development.**

</div>

---

## 🌐 Live Dashboard

**👉 [View Interactive Dashboard](https://moha-111.github.io/Medical-Transport-Operations-Analytics/)**

The live dashboard includes:
- Real-time KPI cards across 6 performance dimensions
- Interactive charts: Monthly Volume, Referral Reasons, Center Benchmarking, Mission Type Split
- Full center performance comparison table with color-coded alerts
- Strategic insights and recommendations panel

---

## 📌 Project Overview

A comprehensive **data analytics and reporting system** designed for private clinics and hospital networks to track, analyze, and act on medical transport operations. The solution consolidates 14,169 patient transfer missions into a single intelligence layer — covering performance KPIs, center benchmarking, paramedic efficiency, and strategic recommendations.

This project demonstrates how **no-code/AI-first development** can produce enterprise-grade healthcare analytics without writing a single line of traditional backend code.

---

## 🎯 Problem Statement

Medical transport networks face three critical blind spots:

| Challenge | Impact |
|-----------|--------|
| No unified performance visibility across centers | Reactive rather than proactive management |
| Manual monthly reporting taking days to produce | Delayed decision-making |
| No benchmark system for paramedic/ambulance efficiency | Inability to identify improvement areas |

**This solution solves all three.**

---

## 📊 Dataset Overview

```
📁 Medical-Transport-Analytics.xlsx
├── 📋 Daily Operations Data    → 14,169 rows × 25 columns (full mission log)
├── 📈 KPI Dashboard            → Aggregated performance metrics
├── 🏢 Center Performance       → 20 centers benchmarked
├── 🏥 Hospital Analysis        → 4 receiving hospitals analyzed
├── 👨‍⚕️ Paramedic Performance   → 219 individual paramedics tracked
├── 🚑 Ambulance Utilization    → 96 ambulances across the fleet
├── 🕐 Time Analysis            → Hourly, daily, monthly patterns
└── 📝 Executive Summary        → Leadership-ready digest
```

### Key Fields

| Field | Description |
|-------|-------------|
| `Referral Date / Time` | Full timestamp chain: Acceptance → Ops Report → Departure → Arrival → Return |
| `Medical Department` | 10 departments: Cardiac, Neuro, Ortho, Pediatric, ICU, ER, Oncology, Pulmonary, Gastro, General |
| `Referral Type` | `Life-Saving` (35.1%) vs `Stable` (64.9%) |
| `Referral Reason` | Cath Lab · Specialty Shortage · Equipment Shortage |
| `Dispatch Time (min)` | Time from ops report to ambulance departure |
| `Response Time (min)` | Time from acceptance to departure |
| `Total Response (min)` | Full response window |
| `Mission Duration (min)` | End-to-end mission time |
| `Performance Rating` | `Excellent` / `Good` / `Late` |

---

## 🔑 Key Findings

<table>
<tr>
<td width="50%">

### ⚡ Performance Metrics
- **Avg Response Time:** 14.5 min
- **Avg Dispatch Time:** 5.5 min  
- **Avg Travel Time:** 49.8 min
- **Avg Mission Duration:** 132.9 min
- **Emergency (Life-Saving) Rate:** 35.1%

</td>
<td width="50%">

### 🚨 Critical Insights
- **95.3% of missions rated Late** → benchmarks need recalibration
- **H1 absorbs 72.1%** of all referrals → concentration risk
- **Morning shift = 60.1%** of volume → capacity gap evenings
- **Zero Excellent-rated missions** across all 20 centers
- Stable monthly demand (±12% variance year-round)

</td>
</tr>
</table>

---

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                 │
│   Excel (.xlsx)  →  14,169 records  ×  25 dimensions         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                ANALYTICS LAYER                               │
│   Python (pandas)  →  KPIs, aggregations, trend analysis    │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼──────┐  ┌───────▼────────┐
│  Word Report │  │  HTML Dashboard│  │  AI Integration │
│  (docx-js)   │  │  (Vanilla JS)  │  │  ChatGPT API   │
│              │  │  GitHub Pages  │  │  via Make.com  │
└──────────────┘  └────────────────┘  └────────────────┘
```

### Tools Used

| Layer | Tool | Purpose |
|-------|------|---------|
| **Development** | Claude AI (Vibe Coding) | Full project generation — no manual coding |
| **Data** | Microsoft Excel | Operational data storage & initial analysis |
| **Reporting** | `docx-js` / Python | Automated Word report generation |
| **Automation** | Make.com | Workflow automation & scheduling |
| **AI Reports** | ChatGPT API | Arabic weekly report generation |
| **Visualization** | HTML/CSS/JS + GitHub Pages | Interactive live dashboard |

---

## 📁 Repository Structure

```
Medical-Transport-Operations-Analytics/
│
├── 📊 Medical-Transport-Analytics.xlsx        # Full operational dataset
├── 📄 Medical_Transport_Weekly_Report.docx    # Auto-generated weekly report
├── 🌐 index.html                              # Interactive dashboard (GitHub Pages)
├── 📘 README.md
└── LICENSE
```

---

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/Moha-111/Medical-Transport-Operations-Analytics.git
cd Medical-Transport-Operations-Analytics
```

### 2. View the Dashboard
Open `index.html` in any browser — or visit the **[live version](https://moha-111.github.io/Medical-Transport-Operations-Analytics/)**.

### 3. Explore the data (Python)
```python
pip install pandas openpyxl

import pandas as pd
df = pd.read_excel('Medical-Transport-Analytics.xlsx',
                   sheet_name='Daily Operations Data')

# Quick KPIs
print(f"Total Missions: {len(df):,}")
print(f"Avg Response Time: {df['Response Time (min)'].mean():.1f} min")
print(f"Emergency Rate: {(df['Referral Type']=='Life-Saving').mean()*100:.1f}%")

# Center efficiency comparison
center_perf = df.groupby('Center Name').agg({
    'Response Time (min)': 'mean',
    'Mission Duration (min)': 'mean',
    'Referral #': 'count'
}).round(1)
print(center_perf)
```

---

## 💡 Vibe Coding Methodology

This project was built entirely using **Vibe Coding** — a methodology where AI is the primary developer:

1. **Define** the problem in plain language
2. **Prompt** Claude AI to generate the solution
3. **Iterate** through natural conversation
4. **Deploy** without touching traditional code editors

> *"The best code is the code you didn't have to write."*

This approach reduced development time from weeks to hours while maintaining professional, enterprise-grade output quality.

---

## 🏆 Hackathon Context

**Event:** Tuwaiq Hackathon — Healthcare Track  
**Challenge:** Build a data-driven operations management solution for private healthcare facilities  
**Approach:** No-code AI-first development (Vibe Coding)  
**Output:** End-to-end analytics system with automated reporting + live dashboard

---

## 📬 Contact & Connect

<div align="center">

[![LinkedIn](https://img.shields.io/badge/Connect%20on%20LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/mohammad-alshehri-b0a579388)
[![GitHub](https://img.shields.io/badge/Follow%20on%20GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Moha-111)

</div>

---

<div align="center">

**Built with ❤️ at Tuwaiq Hackathon · Powered by Vibe Coding + Claude AI**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0D7377,1B3A6B&height=100&section=footer" width="100%"/>

</div>
