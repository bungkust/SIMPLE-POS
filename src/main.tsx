import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from '@/components/ui/toast-provider';
import { verifyEnvironment } from '@/lib/env-check';

// Fix for __WS_TOKEN__ undefined error (common in dev environments)
if (typeof window !== 'undefined' && typeof (window as any).__WS_TOKEN__ === 'undefined') {
  (window as any).__WS_TOKEN__ = undefined;
}

// Fix for React useLayoutEffect in production builds
import React from 'react';
import { createRoot } from 'react-dom/client';

// Ensure React is available globally for all chunks
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = { createRoot };
  
  // Fix for useLayoutEffect in vendor chunks
  if (!React.useLayoutEffect) {
    React.useLayoutEffect = React.useEffect;
  }
}

// Verify environment variables on app initialization
verifyEnvironment();

// Register Service Worker for caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
