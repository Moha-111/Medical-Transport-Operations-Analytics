# Changelog — Wasl Platform (وصل)

All notable changes to the Wasl Medical Transport Intelligence Platform are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned (Phase 1 — Q3 2026)
- 🔵 Google Sheets live database integration
- 🔵 Real-time data sync via Google Sheets API
- 🔵 First hospital pilot program

### Planned (Phase 2 — Q1 2027)
- 🟡 WhatsApp instant KPI alerts via Make.com
- 🟡 Mobile PWA packaging
- 🟡 Company registration + Monsha'at application

### Planned (Phase 3 — Q4 2027)
- 🔴 Multi-hospital SaaS platform
- 🔴 Saudi Ministry of Health certification
- 🔴 Full PDPL compliance

---

## [1.3.0] — 2026-02-27

### Added — Professional Infrastructure
- ✅ GitHub Actions CI/CD pipeline (`deploy.yml`, `quality.yml`)
- ✅ Automated GitHub Pages deployment on push to main
- ✅ Security scanning workflow for secrets and PII detection
- ✅ Professional issue templates (bug reports, feature requests)
- ✅ Pull request template with data privacy checklist
- ✅ `SECURITY.md` — responsible disclosure policy
- ✅ `CONTRIBUTING.md` — contributor guidelines with commit standards
- ✅ `CODE_OF_CONDUCT.md` — professional community standards
- ✅ `CHANGELOG.md` — version history tracking
- ✅ PWA manifest (`manifest.json`) for mobile app installation
- ✅ Service worker (`sw.js`) for offline capability
- ✅ SEO meta tags and Open Graph social sharing tags
- ✅ `docs/` directory with architecture, API, and deployment guides
- ✅ `.gitignore` — proper file exclusion patterns
- ✅ `package.json` — project metadata and scripts
- ✅ `robots.txt` and `sitemap.xml` — search engine optimization

### Enhanced
- Enhanced README with project status badge and deployment info
- Added structured data for Google search rich results

---

## [1.2.0] — 2026-01-15

### Added
- 🤖 Automated daily AI reports via Make.com + OpenAI GPT-4o
- 📧 Gmail API integration for 7:00 AM Arabic email reports
- 📊 ROI Impact Analysis section with before/after KPI comparison
- 💡 Savings calculator (2,847 hours saved annually)
- 🏢 Deployment scenarios for 5 market segments

### Fixed
- Dashboard chart rendering on Firefox
- Mobile sidebar toggle behavior

---

## [1.1.0] — 2025-12-20

### Added
- 🏥 Center management module (20 centers with progress bars)
- 👨‍⚕️ Paramedic management module (219 field staff)
- 🔔 Real-time alert system with configurable KPI thresholds
- ⚙️ Settings panel with Make.com webhook configuration
- 📱 Mobile-responsive sidebar

### Enhanced
- Live monitoring with 5-second refresh interval
- Mission registry with search and filter

---

## [1.0.0] — 2025-12-10 — Tuwaiq Hackathon MVP

### Initial Release
- 🚑 Core Wasl platform built at Tuwaiq Hackathon
- 📊 Main dashboard with 5 KPI cards
- 📡 Live monitoring module
- 🗂️ Mission registry with 14,169 records
- ➕ Data entry form with Excel import
- 🔐 Role-based login (Admin, Manager, Dispatcher)
- 📊 Chart.js visualizations (line, bar, doughnut, radar)
- 🌙 Dark theme with Arabic RTL layout
- 🏆 Built using Vibe Coding methodology (AI-first development)

### Data
- 14,169 synthetic patient transfer missions
- 25 operational variables per mission
- 20 medical centers
- 219 paramedic profiles

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Completed |
| 🔵 | Phase 1 target |
| 🟡 | Phase 2 target |
| 🔴 | Phase 3 target |
| 🐛 | Bug fix |
| ✨ | New feature |
| ⚡ | Performance |
| 🔒 | Security |

---

[Unreleased]: https://github.com/Moha-111/Medical-Transport-Operations-Analytics/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/Moha-111/Medical-Transport-Operations-Analytics/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Moha-111/Medical-Transport-Operations-Analytics/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Moha-111/Medical-Transport-Operations-Analytics/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Moha-111/Medical-Transport-Operations-Analytics/releases/tag/v1.0.0
