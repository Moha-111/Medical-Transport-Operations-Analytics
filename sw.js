/**
 * Wasl Service Worker — وصل
 * Medical Transport Intelligence Platform
 * Enables offline capability and asset caching
 * Version: 1.3.0
 */

const CACHE_NAME = 'wasl-v1.3.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap',
];

// ── Install Event ─────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Wasl SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate Event ────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[Wasl SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch Event ───────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Make.com webhook calls and other API calls
  if (url.hostname.includes('make.com') || url.hostname.includes('hook.us')) return;

  // Cache-first strategy for CDN assets
  if (CDN_ASSETS.some(asset => request.url.startsWith(asset.split('/').slice(0, 3).join('/')))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for everything else (ensures fresh data)
  event.respondWith(networkFirst(request));
});

// ── Cache Strategies ──────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — cached version unavailable', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[Wasl SW] Serving from cache (offline):', request.url);
      return cached;
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    return new Response('Network error', { status: 503 });
  }
}

// ── Background Sync (for future use) ─────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-missions') {
    console.log('[Wasl SW] Background sync: missions');
    // Future: sync pending mission data to server
  }
});

// ── Push Notifications (for future use) ──────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'تنبيه جديد من منصة وصل',
    icon: './manifest.json',
    badge: './manifest.json',
    dir: 'rtl',
    lang: 'ar',
    tag: data.tag || 'wasl-alert',
    requireInteraction: data.critical || false,
    data: { url: data.url || './' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'وصل — تنبيه', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || './')
  );
});
