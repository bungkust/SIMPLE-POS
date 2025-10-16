import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from '@/components/ui/toast-provider';
import { verifyEnvironment } from '@/lib/env-check';

// Verify environment variables on app initialization
verifyEnvironment();

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
