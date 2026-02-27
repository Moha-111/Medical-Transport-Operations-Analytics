# Security Policy — Wasl Platform

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| Latest  | ✅ Actively maintained |
| < 1.0   | ❌ Not supported   |

---

## Reporting a Vulnerability

**Do NOT report security vulnerabilities via public GitHub Issues.**

### Private Disclosure (Preferred)

Report vulnerabilities through GitHub's private security advisory system:

1. Go to the [Security Advisories](https://github.com/Moha-111/Medical-Transport-Operations-Analytics/security/advisories/new) page
2. Click **"New draft security advisory"**
3. Provide detailed information about the vulnerability
4. We will respond within **72 hours**

### What to Include

Please provide:
- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** (data exposure, privilege escalation, etc.)
- **Suggested fix** (if known)
- **Your contact information** (for follow-up)

---

## Security Scope

### In Scope

| Area | Description |
|------|-------------|
| `index.html` | Client-side XSS, data injection vulnerabilities |
| Authentication | Role-based access bypass in the login screen |
| Data Handling | Improper exposure of operational data |
| Third-party CDNs | Compromised CDN dependency detection |
| Make.com Webhook | Webhook endpoint security |

### Out of Scope

- Attacks requiring physical access to a device
- Social engineering attacks
- Issues in third-party services (Chart.js, Google Fonts, Make.com)
- Denial of Service (DoS) attacks
- Issues in GitHub's platform itself

---

## Current Security Architecture

### Authentication
- Role-based access control (Admin, Manager, Dispatcher)
- Client-side session management (demo mode)
- Production deployments must use server-side authentication

### Data Protection
- **Demo data only** — no real patient information in this repository
- All data in `Medical-Transport-Analytics.xlsx` is **synthetic**
- No data is transmitted to external servers from the client

### PDPL Compliance Roadmap

This project follows a structured path to comply with Saudi Arabia's **Personal Data Protection Law (PDPL)**:

| Phase | Measure | Status |
|-------|---------|--------|
| 🟡 Data Anonymization | Replace patient identifiers with anonymous IDs | Planned |
| 🟡 Access Control | Server-side role-based access | Planned |
| 🟡 Audit Logging | Timestamped access logs | Planned |
| 🔴 PDPL Compliance | Full regulatory compliance | Roadmap |
| 🔴 Encryption | End-to-end encryption for patient data | Roadmap |
| 🔴 Data Residency | KSA-only data storage | Roadmap |

---

## Security Response Process

```
Report Received → Acknowledge (72h) → Assess Severity → Develop Fix → Release → Notify Reporter
```

| Severity | Response Time | Fix Timeline |
|----------|--------------|--------------|
| 🔴 Critical | 24 hours | 7 days |
| 🟠 High | 48 hours | 14 days |
| 🟡 Medium | 72 hours | 30 days |
| 🟢 Low | 7 days | Next release |

---

## Responsible Disclosure

We follow **Coordinated Vulnerability Disclosure (CVD)**:

1. Reporter discovers and reports vulnerability privately
2. We acknowledge and assess within 72 hours
3. We develop and test a fix
4. We release the fix and notify the reporter
5. Public disclosure after fix is deployed (typically 90 days)

We recognize responsible reporters in our `CHANGELOG.md` (with permission).

---

## Contact

**Primary:** GitHub Security Advisories (above)
**LinkedIn:** [Mohammad Alshehri](https://linkedin.com/in/mohammad-alshehri-b0a579388)

---

*Last updated: 2026-02-27*
*Wasl — Connecting Patients to Hospitals, and Decisions to Data*
