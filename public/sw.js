// Service Worker for aggressive caching
const CACHE_NAME = 'simple-pos-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  try {
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
      return;
    }

    // Skip chrome-extension and other unsupported schemes
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
      return;
    }

    // Handle different types of requests
    if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
      // Static assets - cache first
      event.respondWith(cacheFirst(request));
    } else if (url.hostname.includes('supabase.co')) {
      // Supabase API - network first with cache fallback
      event.respondWith(networkFirst(request));
    } else if (url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
      // Font requests - network first, no caching to avoid CSP issues
      event.respondWith(networkOnly(request));
    } else {
      // Other requests - network first
      event.respondWith(networkFirst(request));
    }
  } catch (error) {
    console.log('Service Worker fetch error:', error);
    // Let the browser handle the request normally
    return;
  }
});

// Cache first strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && networkResponse.status !== 206) {
      // Only cache complete responses (not partial/206)
      try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.log('Cache put failed:', cacheError);
        // Continue without caching
      }
    }
    return networkResponse;
  } catch (error) {
    console.log('Network first failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Network only strategy (for fonts to avoid CSP issues)
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('Network only failed:', error);
    return new Response('Network error', { status: 503 });
  }
}
