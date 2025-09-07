// LunaDine Service Worker
// Provides offline functionality and caching for the PWA

const CACHE_NAME = 'lunadine-v1.1.5';
const STATIC_CACHE = 'lunadine-static-v1.1.5';
const DYNAMIC_CACHE = 'lunadine-dynamic-v1.1.5';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.php',
  '/assets/css/main.css',
  '/assets/css/components.css',
  '/assets/js/app.js',
  '/assets/js/cart.js',
  '/assets/js/orders.js',
  '/assets/js/menu.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Network-first strategy URLs (always try to fetch fresh data)
const NETWORK_FIRST_URLS = [
  '/api/',
  '/api/branches',
  '/api/menu',
  '/api/orders',
  '/api/order_status'
];

// Cache-first strategy URLs (use cache if available)
const CACHE_FIRST_URLS = [
  '/assets/',
  'https://fonts.googleapis.com/',
  'https://cdnjs.cloudflare.com/'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle different URL patterns with appropriate strategies
  if (isNetworkFirstUrl(url.pathname)) {
    event.respondWith(networkFirst(event.request));
  } else if (isCacheFirstUrl(url.href)) {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

// Network-first strategy - for API calls
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page or error response
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'You are offline. Please check your internet connection.' 
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Cache-first strategy - for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in the background
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, response);
        });
      }
    }).catch(() => {
      // Ignore network errors for background updates
    });
    
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch', request.url, error);
    throw error;
  }
}

// Stale-while-revalidate strategy - for general content
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const responseClone = response.clone(); // Clone before using
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then((c) => c.put(request, responseClone));
    }
    return response;
  }).catch(() => {
    // Return cached response if network fails
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Helper functions
function isNetworkFirstUrl(pathname) {
  return NETWORK_FIRST_URLS.some(pattern => pathname.startsWith(pattern));
}

function isCacheFirstUrl(url) {
  return CACHE_FIRST_URLS.some(pattern => url.includes(pattern));
}

// Background sync for offline orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-order') {
    event.waitUntil(syncOfflineOrders());
  }
});

async function syncOfflineOrders() {
  try {
    const offlineOrders = await getOfflineOrders();
    
    for (const order of offlineOrders) {
      try {
        const response = await fetch('/api/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order.data)
        });
        
        if (response.ok) {
          await removeOfflineOrder(order.id);
          console.log('Service Worker: Offline order synced successfully');
          
          // Notify the client about successful sync
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'ORDER_SYNCED',
              orderId: order.id,
              success: true
            });
          });
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync offline order', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Error during background sync', error);
  }
}

// IndexedDB helpers for offline orders
async function getOfflineOrders() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LunaDineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineOrders'], 'readonly');
      const store = transaction.objectStore('offlineOrders');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offlineOrders')) {
        db.createObjectStore('offlineOrders', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function removeOfflineOrder(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LunaDineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineOrders'], 'readwrite');
      const store = transaction.objectStore('offlineOrders');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification from LunaDine',
      icon: '/assets/images/icon-192x192.png',
      badge: '/assets/images/icon-72x72.png',
      image: data.image,
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/assets/images/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      requireInteraction: true,
      renotify: true,
      tag: data.tag || 'lunadine-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'LunaDine', options)
    );
  } catch (error) {
    console.error('Service Worker: Error handling push notification', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    // Open the app or focus existing window
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) {
            return clientList[0].focus();
          }
          return clients.openWindow('/');
        })
    );
  }
});

// Message handling from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'STORE_OFFLINE_ORDER') {
    storeOfflineOrder(event.data.order);
  }
});

async function storeOfflineOrder(orderData) {
  try {
    const request = indexedDB.open('LunaDineDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineOrders'], 'readwrite');
      const store = transaction.objectStore('offlineOrders');
      
      store.add({
        data: orderData,
        timestamp: Date.now()
      });
      
      console.log('Service Worker: Offline order stored');
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offlineOrders')) {
        db.createObjectStore('offlineOrders', { keyPath: 'id', autoIncrement: true });
      }
    };
  } catch (error) {
    console.error('Service Worker: Error storing offline order', error);
  }
}
