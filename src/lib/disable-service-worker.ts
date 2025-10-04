// Disable service worker that might interfere with OAuth
if ('serviceWorker' in navigator && window.location.hostname === 'localhost') {
  console.log('🧹 Disabling service workers for local development...');
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(function(boolean) {
        console.log('✅ Service worker unregistered:', boolean);
      });
    }
  }).catch(function(error) {
    console.log('❌ Service worker unregister failed:', error);
  });
}
