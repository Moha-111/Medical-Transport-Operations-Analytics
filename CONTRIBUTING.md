# Contributing to Wasl — وصل

Thank you for your interest in contributing to **Wasl**, the Medical Transport Intelligence Platform. Every contribution — from code to documentation to ideas — helps improve healthcare operations across Saudi Arabia.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Ways to Contribute](#ways-to-contribute)
4. [Development Workflow](#development-workflow)
5. [Commit Standards](#commit-standards)
6. [Data Privacy Requirements](#data-privacy-requirements)
7. [Review Process](#review-process)

---

## Code of Conduct

By participating in this project, you agree to our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming, respectful, and professional environment for all contributors.

---

## Getting Started

### Prerequisites

- A modern browser (Chrome, Firefox, Safari, or Edge)
- Git installed on your machine
- Basic understanding of HTML, CSS, and JavaScript (for code contributions)
- Familiarity with Arabic RTL layouts (preferred but not required)

### Local Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/Medical-Transport-Operations-Analytics.git
cd Medical-Transport-Operations-Analytics

# 3. Create your feature branch
git checkout -b feature/your-feature-name

# 4. Open in browser (no build step required)
open index.html
# or on Linux:
xdg-open index.html
```

---

## Ways to Contribute

### 🐛 Bug Reports
Found a bug? [Open a bug report](.github/ISSUE_TEMPLATE/bug_report.yml) with:
- Steps to reproduce
- Expected vs. actual behavior
- Browser and device information
- Screenshots (no real patient data)

### ✨ Feature Requests
Have an idea? [Open a feature request](.github/ISSUE_TEMPLATE/feature_request.yml) with:
- The problem it solves
- The proposed solution
- Success criteria

### 💻 Code Contributions
See [Development Workflow](#development-workflow) below.

### 📝 Documentation
- Fix typos or improve clarity in `README.md` or `docs/`
- Translate documentation to Arabic
- Add usage examples

### 🌍 Translations
The platform is Arabic-first. If you want to add English or other language support, open a feature request first.

### 🧪 Testing
- Test the platform on different devices and browsers
- Report any responsiveness issues
- Verify KPI calculations against the raw data

---

## Development Workflow

### 1. Create a Branch

Use the following naming conventions:

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/whatsapp-alerts` |
| Bug fix | `fix/description` | `fix/chart-rendering-mobile` |
| Documentation | `docs/description` | `docs/api-guide` |
| Performance | `perf/description` | `perf/reduce-html-size` |

### 2. Make Changes

```bash
# Make your changes
# Test in browser
# Verify on mobile (Chrome DevTools responsive mode)
# Test all three user roles (Admin, Manager, Dispatcher)
```

### 3. Commit

Follow our [commit standards](#commit-standards):

```bash
git add index.html  # Stage specific files, not 'git add .'
git commit -m "feat: add WhatsApp instant alert integration"
```

### 4. Push & Create PR

```bash
git push origin feature/your-feature-name
# Then create a PR on GitHub using the PR template
```

---

## Commit Standards

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Use for |
|------|---------|
| `feat` | New features |
| `fix` | Bug fixes |
| `docs` | Documentation changes |
| `style` | CSS/UI changes (no logic change) |
| `perf` | Performance improvements |
| `refactor` | Code restructuring |
| `security` | Security fixes |
| `ci` | CI/CD pipeline changes |
| `chore` | Maintenance tasks |

### Scopes

`dashboard`, `monitoring`, `registry`, `paramedic`, `centers`, `reports`, `alerts`, `auth`, `mobile`, `docs`, `ci`

### Examples

```bash
git commit -m "feat(alerts): add real-time KPI threshold notifications"
git commit -m "fix(dashboard): correct response time calculation for H1 hospital"
git commit -m "style(mobile): improve sidebar responsiveness on small screens"
git commit -m "docs: add Make.com webhook configuration guide"
git commit -m "security: remove console.log statements from auth flow"
```

---

## Data Privacy Requirements

**This is non-negotiable.** All contributors must:

1. **Never** commit real patient data (names, IDs, medical records)
2. **Never** commit real credentials (API keys, webhook URLs, passwords)
3. Use only synthetic/demo data in examples and tests
4. Follow the **minimum data principle** — collect only what's operationally necessary
5. Reference `SECURITY.md` for the PDPL compliance roadmap

### Before Every Commit

Run a quick self-check:
```bash
# Check for common sensitive patterns
grep -E "(password|api_key|webhook|token)" index.html | grep -v "(demo|example|YOUR_|placeholder)"
```

---

## Review Process

### What We Look For

1. **Correctness** — Does the code work as described?
2. **Privacy** — No real patient data or credentials
3. **Arabic RTL** — UI changes must work with Arabic text and RTL layout
4. **Mobile** — Test on mobile viewport (375px width minimum)
5. **Performance** — No significant increase in file size
6. **Simplicity** — Over-engineering is a bug, not a feature

### Timeline

| Step | Timeline |
|------|----------|
| Initial review | Within 3 business days |
| Feedback response | Within 7 business days |
| Merge (if approved) | Within 24 hours of final approval |

### First-Time Contributors

We label beginner-friendly issues with `good first issue`. Look for these if you're new to the project.

---

## Recognition

All contributors are recognized in `CHANGELOG.md`. We believe in crediting the people who make this platform better.

---

## Questions?

- Open a [Discussion](https://github.com/Moha-111/Medical-Transport-Operations-Analytics/discussions) on GitHub
- Connect on [LinkedIn](https://linkedin.com/in/mohammad-alshehri-b0a579388)

---

*Wasl — Connecting Patients to Hospitals, and Decisions to Data*
*Built with ❤️ for Saudi Arabia's healthcare sector*
