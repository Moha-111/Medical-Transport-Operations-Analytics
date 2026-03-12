# ──────────────────────────────────────────────────────────────────────────────
# Wasl — Medical Transport Operations Analytics
# Multi-stage image: Python db-tests + Node static server
# ──────────────────────────────────────────────────────────────────────────────

# Stage 1: Python database tests
FROM python:3.12-slim AS db-tests

WORKDIR /app

# Install only what test_database.py needs
RUN pip install --no-cache-dir openpyxl==3.1.5

COPY Medical-Transport-Analytics.xlsx ./
COPY test_database.py ./

# Run tests at build time so a failing build = failing tests
RUN python test_database.py

# Stage 2: Static web server
FROM python:3.12-slim AS web

WORKDIR /app

# Copy only the files needed to serve the dashboard
COPY index.html ./
COPY manifest.json ./
COPY sw.js ./
COPY robots.txt ./
COPY sitemap.xml ./
COPY Medical-Transport-Analytics.xlsx ./
COPY src/ ./src/
COPY report-screenshot.png ./

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/')" || exit 1

CMD ["python", "-m", "http.server", "8080"]
