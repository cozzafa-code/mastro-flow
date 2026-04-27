// public/sw.js — MASTRO ERP Service Worker v2
// Cache invalidation automatica + auto-update + stale-while-revalidate
//
// Cosa cambia rispetto a v1:
// - CACHE_NAME contiene timestamp build (cambia ad ogni deploy)
// - Vecchie cache eliminate automaticamente all'activate
// - JS/CSS bundle: stale-while-revalidate (serve veloce ma aggiorna in background)
// - Notifica client quando nuova versione disponibile (waiting -> activated)

// ⚠️ IMPORTANTE: questo numero/stringa va incrementato ad ogni release significativa
// per forzare l'invalidazione totale. Vercel sostituirà __BUILD_ID__ se configurato,
// altrimenti usa il timestamp del file (cambia ad ogni deploy).
const BUILD_ID = '2026-04-27-v2'; // bump manuale quando serve hard reset
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
        // Se uno degli asset non è raggiungibile, non bloccare install
        console.warn('[SW] addAll partial fail:', err);
      });
    })
  );
  // skipWaiting forza l'attivazione del nuovo SW immediatamente,
  // saltando lo stato 'waiting'
  self.skipWaiting();
});

// Activate — elimina TUTTE le cache vecchie (qualsiasi nome diverso da CACHE_NAME corrente)
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
      // Prende controllo di tutte le tab/PWA aperte subito
      self.clients.claim(),
    ]).then(() => {
      // Notifica i client: c'è una nuova versione attiva
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

  // Skip non-GET e cross-origin
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // Skip API calls (Supabase + /api/*)
  if (url.hostname.includes('supabase')) return;
  if (url.pathname.startsWith('/api/')) return;

  // Bundle JS/CSS Next.js: STALE-WHILE-REVALIDATE
  // Serve subito dalla cache (veloce), ma fetcha in background per la prossima volta.
  // Questo risolve il problema "PWA mostra versione vecchia per giorni".
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
          // Fetch in background, aggiorna cache
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached); // se network fail, fallback al cached

          // Se ho cache, restituisco subito; altrimenti aspetto network
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Immagini, icone, fonts: cache-first (cambiano poco)
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

  // Pagine HTML: NETWORK-FIRST, cache fallback
  // Per le pagine vogliamo sempre l'ultima versione se possibile.
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

// Click su notifica → apri/focus tab MASTRO
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

// Messaggio dal client: comando per skipWaiting (usato dal banner aggiornamento)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
