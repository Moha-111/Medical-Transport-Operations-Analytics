# Deployment Guide — Wasl (وصل)

> Step-by-step instructions for running Wasl locally, on GitHub Pages, and configuring the automation pipeline

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option 1 — Open Innovation Platform Preview (No Setup)](#option-1--open-innovation-platform-preview-no-setup)
- [Option 2 — Run Locally](#option-2--run-locally)
- [Option 3 — Deploy to GitHub Pages](#option-3--deploy-to-github-pages)
- [Option 4 — Run Tests](#option-4--run-tests)
- [Configuring Make.com Automation](#configuring-makecom-automation)
- [Configuring Alert Thresholds](#configuring-alert-thresholds)
- [Importing Your Own Data](#importing-your-own-data)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### For Local Use (No Tests)

- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No Node.js, no server, no installation required

### For Running Tests

- **Node.js** v18 or higher → [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (included with Node.js)

### For Make.com Automation

- Make.com account (free tier works)
- OpenAI API key (GPT-4o access)
- Gmail account (for report delivery)

---

## Option 1 — Open Innovation Platform Preview (No Setup)

The innovation platform preview is deployed on GitHub Pages and requires no installation:

```
https://moha-111.github.io/Medical-Transport-Operations-Analytics/
```

1. Open the URL in any browser
2. Select your role on the login screen
3. Click **Enter System**

> The platform preview includes the full synthetic dataset (14,169 missions) pre-loaded for demonstration.

---

## Option 2 — Run Locally

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Moha-111/Medical-Transport-Operations-Analytics.git
cd Medical-Transport-Operations-Analytics
```

### Step 2 — Open the Dashboard

```bash
# macOS
open index.html

# Windows
start index.html

# Linux
xdg-open index.html

# Or simply drag index.html into your browser
```

### Step 3 — Import the Dataset (Optional)

The local version opens with demo data. To load the full dataset:

1. Click **Data Entry** in the left sidebar
2. Click **Import Excel**
3. Select `Medical-Transport-Analytics.xlsx` from the repository folder
4. The dashboard will automatically update with all 14,169 missions

---

## Option 3 — Deploy to GitHub Pages

### For Your Own Fork

1. **Fork** the repository on GitHub
2. Go to your fork's **Settings → Pages**
3. Set Source to `Deploy from a branch`
4. Select `main` branch and `/ (root)` folder
5. Click **Save**

Your deployment will be live at:
```
https://{your-github-username}.github.io/Medical-Transport-Operations-Analytics/
```

### Deployment Notes

- GitHub Pages deploys automatically when you push to `main`
- The deployment takes 1–3 minutes after each push
- No build step required — `index.html` is served directly
- HTTPS is enforced automatically

---

## Option 4 — Run Tests

### Install Dependencies

```bash
npm install
```

This installs Jest 29 as the only development dependency.

### Run All Tests

```bash
npm test
```

### Run with Coverage Report

```bash
npm run test:coverage
```

Coverage report is saved to `./coverage/` folder. Open `coverage/lcov-report/index.html` in your browser to view detailed coverage.

### Run in Watch Mode

```bash
npm run test:watch
```

Useful during development — re-runs affected tests on every file save.

### Expected Output

```
 PASS  tests/parseCSV.test.js
 PASS  tests/calcKPIs.test.js
 PASS  tests/detectBreaches.test.js
 PASS  tests/prediction.test.js
 PASS  tests/config.test.js
 PASS  tests/integration.test.js

Test Suites: 6 passed, 6 total
Tests:       130 passed, 130 total
Snapshots:   0 total
Time:        ~2s
```

---

## Configuring Make.com Automation

### Overview

The daily automated report requires:
1. A Make.com scenario
2. The Wasl webhook URL (generated in Settings)
3. An OpenAI API key
4. A Gmail connection

### Step-by-Step Setup

#### 1. Generate Your Webhook URL in Wasl

1. Open the dashboard → **Settings**
2. Scroll to **Automation Configuration**
3. Enter your Make.com webhook URL (create one in the next step)
4. Click **Save Settings**

#### 2. Create the Make.com Scenario

1. Log in to [make.com](https://make.com)
2. Click **Create a new scenario**
3. Add the following modules in order:

**Module 1: Schedule**
```
Module: Schedule
Run: Every day
Time: 07:00
Timezone: Asia/Riyadh
```

**Module 2: HTTP (Fetch KPI Data)**
```
Module: HTTP → Make a request
URL: {your-wasl-webhook-url}
Method: GET
```

**Module 3: OpenAI (Generate Report)**
```
Module: OpenAI → Create a completion
Model: gpt-4o
System prompt:
  أنت محلل عمليات خبير في نقل المرضى. مهمتك هي تحليل مؤشرات الأداء اليومية
  وإنشاء تقرير احترافي باللغة العربية. يجب أن يتضمن التقرير:
  1. ملخص تنفيذي
  2. أبرز المؤشرات
  3. التنبيهات والمخاوف
  4. التوصيات

User prompt:
  بيانات اليوم: {{2.body}}
```

**Module 4: Gmail (Send Report)**
```
Module: Gmail → Send an email
To: {operations-team-email}
Subject: تقرير وصل اليومي — {{formatDate(now; "DD/MM/YYYY")}}
Content: {{3.choices[].message.content}}
Content type: HTML
```

#### 3. Test the Scenario

1. Click **Run once** in Make.com
2. Check the Gmail inbox for the test report
3. If successful, turn the scenario **ON** for automatic daily execution

---

## Configuring Alert Thresholds

Thresholds control when the alert system fires. Configure in **Settings → KPI Thresholds**:

| Setting | Default | Description |
|---------|---------|-------------|
| Response Time | 15 min | Alerts when avg exceeds this |
| Late Rate | 95% | Alerts when late % exceeds this |
| Daily Missions | 60 | Alerts when daily volume exceeds this per center |

Changes are saved to `localStorage` and persist across browser sessions.

To reset to defaults: **Settings → Reset to Defaults**

---

## Importing Your Own Data

### Excel Format Requirements

Your `.xlsx` file must:
- Have mission records on the first sheet (or a sheet named `Daily Operations Data`)
- Include a header row as the first row
- Have columns for response time and status (other columns are optional)

**Minimum required columns:**
```
Response Time (min)   — numeric, in minutes
Status                — "Late", "Good", or "Excellent"
```

**Recommended columns for full dashboard:**
```
Dispatch Time (min)
Travel Time (min)
Duration (min)
Center
Month
Hospital
Severity
Shift
```

### Import Steps

1. Open the dashboard → **Data Entry**
2. Click **Import Excel** (or drag-and-drop your file)
3. The platform auto-detects columns using fuzzy name matching
4. Review the KPI update on the dashboard
5. If columns are not recognized, rename them to match the expected names (see [Data Schema](./DATA-SCHEMA.md))

---

## Troubleshooting

### Dashboard shows no data after import

**Check:** Is your Excel file using the correct sheet name?
- The platform looks for `Daily Operations Data` first, then falls back to the first sheet

**Check:** Does your file have a header row?
- Row 1 must contain column names, not data

**Check:** Are numeric columns formatted as numbers (not text)?
- In Excel: select the column → Format Cells → Number

---

### Tests fail with "Cannot find module"

```bash
# Make sure dependencies are installed
npm install

# Then re-run tests
npm test
```

---

### Make.com webhook not receiving data

**Check:** Is the webhook URL correctly pasted in Settings?
- The URL should start with `https://hook.make.com/...`

**Check:** Is the Wasl dashboard open when Make.com triggers?
- The webhook endpoint is served by the browser; the tab must be open

---

### "403 Forbidden" on GitHub Pages

- Ensure the repository is public (not private)
- GitHub Pages requires public repositories on the free plan
- Wait 5 minutes after enabling Pages for DNS propagation

---

### Chart.js not loading (blank chart areas)

The dashboard loads Chart.js from a CDN. If offline:
1. Download Chart.js from [cdn.jsdelivr.net/npm/chart.js](https://cdn.jsdelivr.net/npm/chart.js)
2. Save as `chart.min.js` in the repository root
3. Edit `index.html`: replace the CDN `<script>` with `<script src="./chart.min.js">`
