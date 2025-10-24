import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from '@/components/ui/toast-provider';
import { verifyEnvironment } from '@/lib/env-check';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

// Fix for __WS_TOKEN__ undefined error (common in dev environments)
if (typeof window !== 'undefined' && typeof (window as any).__WS_TOKEN__ === 'undefined') {
  (window as any).__WS_TOKEN__ = undefined;
}

// Simple React setup - let Vite handle chunking

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
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <App />
    </ToastProvider>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);
