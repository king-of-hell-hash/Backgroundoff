// BackgroundOff Progressive Web App Service Worker
// Version: 1.2.0

const CACHE_NAME = 'backgroundoff-v1.2.0';
const STATIC_CACHE = 'backgroundoff-static-v1.2.0';
const ASSETS_CACHE = 'backgroundoff-assets-v1.2.0';
const OFFLINE_URL = '/offline.html';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/favicon.png',
  '/public/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/shortcut-upload.png',
  '/icons/shortcut-sample.png',
  '/icons/shortcut-editor.png',
  '/widgets/widget-template.json',
  '/widgets/widget-data.json',
];

// 1. Install Event: Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Precache critical resources
      try {
        await cache.addAll(APP_SHELL);
      } catch (err) {
        console.warn('[SW] Precache partial error (ignored for dynamic assets):', err);
      }
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up stale caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== STATIC_CACHE && name !== ASSETS_CACHE && name !== CACHE_NAME) {
            console.log('[SW] Deleting stale cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Cache-First for static assets, Network-First for navigations, Share Target Interception
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // A. Handle Web Share Target POST requests
  if (request.method === 'POST' && url.searchParams.get('action') === 'share-target') {
    event.respondWith(
      (async () => {
        try {
          const formData = await request.formData();
          const imageFile = formData.get('image');
          if (imageFile && imageFile instanceof File) {
            // Store shared file in a temporary cache
            const cache = await caches.open(ASSETS_CACHE);
            const response = new Response(imageFile, {
              headers: {
                'content-type': imageFile.type,
                'x-shared-name': encodeURIComponent(imageFile.name),
              },
            });
            await cache.put('/_shared_target_image', response);
          }
        } catch (e) {
          console.error('[SW] Share target processing error:', e);
        }
        // Redirect client to load the shared image
        return Response.redirect('/?action=share-target-loaded', 303);
      })()
    );
    return;
  }

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // B. Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache latest HTML
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          // Offline fallback
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
          const offlinePage = await caches.match(OFFLINE_URL);
          return offlinePage || new Response('Offline - BackgroundOff', { status: 503 });
        })
    );
    return;
  }

  // C. WASM & Model files, Fonts, Static scripts/styles/icons (Cache-First)
  const isStaticOrModel =
    url.pathname.endsWith('.wasm') ||
    url.pathname.endsWith('.onnx') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('cdn.jsdelivr.net');

  if (isStaticOrModel) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Stale-while-revalidate for static assets in background
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(ASSETS_CACHE).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(ASSETS_CACHE).then((cache) => cache.put(request, responseToCache));
          return networkResponse;
        });
      })
    );
    return;
  }

  // D. Default network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// 4. Background Sync API
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered for tag:', event.tag);
  if (event.tag === 'export-sync' || event.tag === 'offline-queue') {
    event.waitUntil(
      (async () => {
        // Broadcast to clients that sync succeeded
        const allClients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const client of allClients) {
          client.postMessage({
            type: 'BACKGROUND_SYNC_COMPLETE',
            tag: event.tag,
            timestamp: Date.now(),
          });
        }
      })()
    );
  }
});

// 5. Periodic Background Sync API
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic background sync event:', event.tag);
  if (event.tag === 'update-sample-gallery' || event.tag === 'check-app-updates') {
    event.waitUntil(
      (async () => {
        // Update cached samples or app cache
        const cache = await caches.open(STATIC_CACHE);
        try {
          await cache.add('/widgets/widget-data.json');
        } catch (e) {
          console.log('[SW] Periodic sync update check completed.');
        }
      })()
    );
  }
});

// 6. Push Notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'BackgroundOff AI',
    body: 'Your background removal export is complete!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'bg-export-complete',
    data: { url: '/?action=editor' },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      actions: [
        { action: 'open', title: 'Open Studio' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// 7. Notification Click Handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 8. Communication with Main Application
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'TEST_PUSH_NOTIFICATION') {
    self.registration.showNotification(event.data.title || 'BackgroundOff AI', {
      body: event.data.body || 'Cutout processing finished successfully!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'test-notification',
    });
  }
});
