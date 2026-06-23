const CACHE_NAME = `vektorion-cache-${new Date().getTime()}`; // Always update to bypass old
const urlsToCache = [
  '/'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Don't pre-cache much, just the root if really needed
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete ALL caches except the current one
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // FORCE NETWORK FIRST for all navigation / script / assets
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // Fallback to cache ONLY if offline
        return caches.match(event.request).then(cachedResponse => {
           if (cachedResponse) return cachedResponse;
           if (event.request.mode === 'navigate') return caches.match('/');
        });
      })
  );
});

// Handle notification click to focus or open PWA windows
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const targetUrl = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/home';
    
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Look for open tab and focus it
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              if ('navigate' in client) {
                return client.navigate(targetUrl);
              }
            });
          }
        }
        // If not open, open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

