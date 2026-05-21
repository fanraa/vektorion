const CACHE_NAME = 'vektorion-cache-v1';
const urlsToCache = [
  '/',
  '/home',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin or non-http requests (like extension schemes or Firebase streams)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle SPA routing: return /index.html for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Allow offline fallback if possible
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

