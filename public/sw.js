// Zebulon Service Worker
// Enables offline functionality and app-like behavior on Chromebooks

const CACHE_NAME = 'zebulon-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const STATIC_CACHE_FILES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('Zebulon Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching essential files');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => {
        console.log('Zebulon Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Zebulon Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Zebulon Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip requests to other origins
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If online, update cache and return response
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // If offline, try to serve from cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If not in cache and this is a navigation request, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // For other requests, return a generic offline response
            return new Response('Offline - Zebulon requires internet connection', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered - connection restored');
    event.waitUntil(
      // Notify all clients that connection is restored
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CONNECTION_RESTORED',
            timestamp: Date.now()
          });
        });
      })
    );
  }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from Zebulon',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open Zebulon'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Zebulon', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        // If Zebulon is already open, focus it
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        return self.clients.openWindow('/');
      })
    );
  }
});