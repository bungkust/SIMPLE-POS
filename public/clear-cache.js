/**
 * Clear browser cache and development assets
 * Run this in browser console to clear all caches
 */

// Clear all caches
if ('caches' in window) {
  caches.keys().then((cacheNames) => {
    console.log('Found caches:', cacheNames);
    return Promise.all(
      cacheNames.map((cacheName) => {
        console.log('Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(() => {
    console.log('All caches cleared!');
  });
}

// Clear localStorage
localStorage.clear();
console.log('localStorage cleared!');

// Clear sessionStorage
sessionStorage.clear();
console.log('sessionStorage cleared!');

// Unregister service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('Service worker unregistered:', registration);
    });
  });
}

console.log('Cache clearing complete! Please refresh the page.');
