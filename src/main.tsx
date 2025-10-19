import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from '@/components/ui/toast-provider';
import { verifyEnvironment } from '@/lib/env-check';

// Fix for __WS_TOKEN__ undefined error (common in dev environments)
if (typeof window !== 'undefined' && typeof (window as any).__WS_TOKEN__ === 'undefined') {
  (window as any).__WS_TOKEN__ = undefined;
}

// Verify environment variables on app initialization
verifyEnvironment();

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
