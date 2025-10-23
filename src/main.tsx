import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from '@/components/ui/toast-provider';
import { verifyEnvironment } from '@/lib/env-check';
import './lib/react-polyfill'; // Import React polyfills

// Fix for __WS_TOKEN__ undefined error (common in dev environments)
if (typeof window !== 'undefined' && typeof (window as any).__WS_TOKEN__ === 'undefined') {
  (window as any).__WS_TOKEN__ = undefined;
}

// Simple React setup - let Vite handle chunking
import React from 'react';

// Verify environment variables on app initialization
verifyEnvironment();

// Register Service Worker for caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Unregister any existing service workers first
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        if (registration.scope.includes('localhost') || registration.scope.includes('dev')) {
          registration.unregister();
          console.log('Unregistered development service worker');
        }
      });
    }).then(() => {
      // Register new service worker
      return navigator.serviceWorker.register('/sw.js');
    }).then((registration) => {
      console.log('Service Worker registered:', registration);
    }).catch((error) => {
      console.log('Service Worker registration failed:', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
