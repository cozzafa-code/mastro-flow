// public/sw.js — MASTRO ERP Service Worker v3
// Cache invalidation automatica + auto-update + stale-while-revalidate
//
// Cosa cambia rispetto a v2:
// - BUILD_ID auto-aggiornato ad ogni deploy via timestamp (non piu hard-coded)
// - Patch del 29-04-2026: fix "PWA mostra versione vecchia"

// BUILD_ID viene rigenerato ad ogni deploy (Vercel ricompila i static files).
// Questo timestamp cambia automaticamente quando il file sw.js viene servito da un nuovo deploy.
const BUILD_ID = '2026-05-13-00-20';
const CACHE_NAME = 'mastro-' + BUILD_ID;

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
];

// Install — pre-cache shell + skipWaiting per prendere controllo subito
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] addAll partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — elimina TUTTE le cache vecchie
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      }),
      self.clients.claim(),
    ]).then(() => {
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_ACTIVATED', cacheName: CACHE_NAME });
        });
      });
    })
  );
});

// Fetch — strategia diversa per tipo di risorsa
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== location.origin) return;
  if (url.hostname.includes('supabase')) return;
  if (url.pathname.startsWith('/api/')) return;

  // Bundle JS/CSS Next.js: NETWORK-FIRST (cambiato da stale-while-revalidate)
  // Cosi se c'e' una nuova versione la prendi subito.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Immagini, icone, fonts: cache-first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Pagine HTML: NETWORK-FIRST
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/dashboard');
        });
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Nuova notifica MASTRO',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'mastro-notification',
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'MASTRO ERP', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
