# Deployment Guide — Wasl Platform (وصل)

## Table of Contents

1. [GitHub Pages (Recommended)](#github-pages)
2. [Local Development](#local-development)
3. [Nginx / Apache Self-Hosted](#self-hosted)
4. [Make.com Automation Setup](#makecom-automation)
5. [Environment Configuration](#configuration)
6. [Monitoring Deployment Health](#monitoring)

---

## GitHub Pages (Recommended) {#github-pages}

GitHub Pages is the recommended hosting method — zero cost, CDN-backed, automatic HTTPS.

### Automatic Deployment (CI/CD)

This repository includes a pre-configured GitHub Actions workflow that automatically deploys on every push to `main`.

```yaml
# .github/workflows/deploy.yml
# Triggers on push to main/master
# Validates HTML → Deploys to GitHub Pages
```

**Setup steps:**

1. Fork or clone this repository
2. Go to **Settings → Pages** in your GitHub repository
3. Set **Source** to `GitHub Actions`
4. Push any change to `main` — deployment is automatic

**Your platform will be live at:**
```
https://YOUR-USERNAME.github.io/Medical-Transport-Operations-Analytics/
```

### Manual Deployment

```bash
# From your repository root
git add -A
git commit -m "deploy: update platform"
git push origin main
# GitHub Actions handles the rest
```

---

## Local Development {#local-development}

No build tools required. The platform runs directly in any browser.

### Option 1: Direct File Open

```bash
git clone https://github.com/Moha-111/Medical-Transport-Operations-Analytics.git
cd Medical-Transport-Operations-Analytics
open index.html              # macOS
xdg-open index.html          # Linux
start index.html             # Windows
```

### Option 2: Local HTTP Server (Recommended for PWA features)

Service Worker and PWA features require HTTPS or localhost. Use a local server:

```bash
# Python (built-in)
python3 -m http.server 8080
# Then open: http://localhost:8080

# Node.js (npx)
npx serve .
# Then open: http://localhost:3000

# VS Code: Use "Live Server" extension
```

### Option 3: Docker

```bash
# Run with nginx
docker run -d -p 8080:80 \
  -v $(pwd):/usr/share/nginx/html:ro \
  nginx:alpine

# Open: http://localhost:8080
```

---

## Self-Hosted (Nginx / Apache) {#self-hosted}

For organizations that need to host Wasl on their own infrastructure.

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name wasl.yourhospital.com;

    root /var/www/wasl;
    index index.html;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/wasl.yourhospital.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wasl.yourhospital.com/privkey.pem;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";

    # Content Security Policy
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src https://fonts.gstatic.com;
        img-src 'self' data: https:;
        connect-src 'self' https://hook.us.make.com;
    ";

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker must be served from root
    location /sw.js {
        add_header Service-Worker-Allowed "/";
        expires 0;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name wasl.yourhospital.com;
    return 301 https://$server_name$request_uri;
}
```

### Apache Configuration (.htaccess)

```apache
# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options SAMEORIGIN
Header always set X-XSS-Protection "1; mode=block"

# Cache control
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$">
    ExpiresActive On
    ExpiresDefault "access plus 30 days"
</FilesMatch>

# Service worker
<Files "sw.js">
    Header set Service-Worker-Allowed "/"
    ExpiresActive On
    ExpiresDefault "access plus 0 seconds"
</Files>

# SPA routing
Options -MultiViews
ErrorDocument 404 /index.html
```

---

## Make.com Automation Setup {#makecom-automation}

The automated daily report requires a Make.com account (free tier works).

### Step 1: Create a Make.com Scenario

1. Sign up at [make.com](https://make.com)
2. Create a new **Scenario**
3. Add modules in this order:

```
[Schedule] → [HTTP: Get KPI Data] → [OpenAI: GPT-4o] → [Gmail: Send Email]
```

### Step 2: Configure the Schedule Module

- **Type:** Every day
- **Time:** 07:00
- **Timezone:** Asia/Riyadh

### Step 3: Configure the HTTP Module

- **Method:** GET or POST
- **URL:** Your Wasl platform URL
- **Response:** KPI summary JSON

### Step 4: Configure OpenAI Module

- **Model:** gpt-4o
- **System prompt:**
```
أنت محلل عمليات نقل المرضى الطبي. قم بتحليل بيانات KPI التالية وإنشاء تقرير يومي احترافي باللغة العربية. يجب أن يتضمن التقرير: ملخص الأداء، أبرز التنبيهات، والتوصيات العملية. استخدم أسلوباً مهنياً مناسباً لمديري المستشفيات.
```
- **Max tokens:** 2000

### Step 5: Configure Gmail Module

- **To:** operations-team@yourhospital.com
- **Subject:** `تقرير وصل اليومي — {{formatDate(now; "DD/MM/YYYY")}}`
- **Body type:** HTML
- **Body:** Output from GPT-4o module

### Step 6: Get Webhook URL

1. Add a **Webhook** trigger to your scenario (optional, for manual triggers)
2. Copy the webhook URL
3. Paste it in **Wasl Settings → Make.com Webhook URL**

---

## Environment Configuration {#configuration}

Wasl uses client-side configuration via the Settings panel. No `.env` files needed.

### Settings Panel Options

| Setting | Description | Default |
|---------|-------------|---------|
| Max Response Time | KPI threshold for alerts (min) | 15 |
| Max Dispatch Time | KPI threshold for alerts (min) | 8 |
| Max Late Rate | KPI threshold for alerts (%) | 95 |
| Make.com Webhook URL | URL for automated report triggers | (empty) |
| Alert Notifications | Enable/disable browser notifications | On |

Settings are persisted in `localStorage` and survive page refreshes.

---

## Monitoring Deployment Health {#monitoring}

### GitHub Actions Dashboard

Monitor deployment status at:
```
https://github.com/YOUR-USERNAME/Medical-Transport-Operations-Analytics/actions
```

### Key Checks

```bash
# Verify the site is live
curl -I https://YOUR-USERNAME.github.io/Medical-Transport-Operations-Analytics/

# Expected response:
# HTTP/2 200
# content-type: text/html

# Verify service worker is accessible
curl -I https://YOUR-USERNAME.github.io/Medical-Transport-Operations-Analytics/sw.js

# Verify manifest is accessible
curl -I https://YOUR-USERNAME.github.io/Medical-Transport-Operations-Analytics/manifest.json
```

### Uptime Monitoring (Recommended Tools)

| Tool | Free Tier | URL |
|------|-----------|-----|
| UptimeRobot | 50 monitors | uptimerobot.com |
| Better Uptime | 10 monitors | betteruptime.com |
| StatusCake | Unlimited | statuscake.com |

---

## Troubleshooting

### Platform doesn't load after deployment

1. Check GitHub Actions logs for deployment errors
2. Ensure GitHub Pages is set to use **GitHub Actions** source (not branch)
3. Wait 5 minutes for CDN propagation

### Charts not rendering

1. Verify Chart.js CDN is accessible: `cdnjs.cloudflare.com`
2. Check browser console for JavaScript errors
3. Test on a different browser

### Arabic fonts not loading

1. Verify Google Fonts CDN is accessible
2. Check for Content Security Policy blocking font loading
3. Consider self-hosting fonts for production

### Service Worker not registering

1. Must be served over HTTPS or localhost
2. Check browser console for SW registration errors
3. Clear browser cache and SW: DevTools → Application → Service Workers → Unregister

---

*Last updated: 2026-02-27*
*Wasl Deployment Guide v1.3.0*
