/**
 * React polyfills for production builds
 * Fixes useLayoutEffect and other SSR-related issues
 */

import { useEffect, useLayoutEffect } from 'react';

// Polyfill useLayoutEffect for SSR environments
if (typeof window === 'undefined') {
  // Server-side: use useEffect instead of useLayoutEffect
  (global as any).React = (global as any).React || {};
  (global as any).React.useLayoutEffect = useEffect;
}

// Ensure React hooks are available globally
if (typeof window !== 'undefined') {
  // Client-side: ensure hooks are available
  (window as any).React = (window as any).React || {};
  (window as any).React.useLayoutEffect = useLayoutEffect;
  (window as any).React.useEffect = useEffect;
}

// Export for use in other files
export { useEffect, useLayoutEffect };
