/**
 * SERVICE WORKER — TRADES & FIELD SERVICES AVAILABILITY FORM
 * Offline-first, safe caching, and graceful degradation.
 */

'use strict';

// ─────────────────────────────────────────────────────────────
// VERSIONING & CACHE NAMES
// ─────────────────────────────────────────────────────────────

const VERSION = '1';

const CACHE_STATIC   = `static-v${VERSION}-trades`;
const CACHE_FONTS    = `font-v${VERSION}-trades`;
const CACHE_EXTERNAL = `external-v${VERSION}-trades`;

// Assets to precache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.json'
];

// Third-party domains allowed for caching (Google Fonts)
const EXTERNAL_WHITELIST = [
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// ─────────────────────────────────────────────────────────────
// INSTALL — PRECACHE CORE ASSETS
// ─────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log(`[SW] Installing Trades service worker v${VERSION}`);

  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .catch((err) => {
        console.warn('[SW] Precache failed (possibly offline):', err);
      })
  );

  self.skipWaiting();
});

// ─────────────────────────────────────────────────────────────
// ACTIVATE — CLEAN OLD CACHES
// ─────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Trades service worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(`v${VERSION}-trades`)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return /^https?:/.test(u.protocol);
  } catch {
    return false;
  }
}

function isWhitelistedDomain(url) {
  try {
    const u = new URL(url);
    return EXTERNAL_WHITELIST.some(domain => u.hostname === domain);
  } catch {
    return false;
  }
}

function getCacheName(url) {
  try {
    const u = new URL(url);
    const pathname = u.pathname;

    if (isWhitelistedDomain(url) || pathname.includes('/css/fonts')) {
      return CACHE_FONTS;
    }

    if (u.hostname !== self.location.hostname) {
      return CACHE_EXTERNAL;
    }

    return CACHE_STATIC;
  } catch {
    return CACHE_STATIC;
  }
}

// ─────────────────────────────────────────────────────────────
// FETCH — CACHE-FIRST WITH OFFLINE FALLBACK
// ─────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;
  if (!isValidUrl(request.url)) return;

  const url = request.url;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW] Cache hit:', url);
        return cachedResponse;
      }

      console.log('[SW] Network request:', url);

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          const cacheName = getCacheName(url);

          caches.open(cacheName).then((cache) => {
            console.log('[SW] Caching:', url, 'in', cacheName);
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch((err) => {
          console.warn('[SW] Fetch failed, offline fallback for:', url, err);

          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }

          return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
    })
  );
});

// ─────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  if (!self.registration.showNotification) return;

  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Trades & Field Services Roster';
    const options = {
      body: data.body || 'You have a new site roster message',
      icon: './icon-192x192.png',
      badge: './icon-192x192.png',
      tag: data.tag || 'notification',
      requireInteraction: false
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[SW] Push notification error:', err);
  }
});

// ─────────────────────────────────────────────────────────────
// NOTIFICATION CLICK
// ─────────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/trades-field-services-roster-pwa/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});

console.log(`[SW] Trades & Field Services service worker v${VERSION} loaded`);
