/**
 * React polyfills for production builds
 * Fixes useLayoutEffect and other SSR-related issues
 */

import React, { useEffect, useLayoutEffect } from 'react';

// Create a safe useLayoutEffect that works in all environments
const safeUseLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Polyfill React hooks globally
if (typeof globalThis !== 'undefined') {
  // Ensure React is available globally
  (globalThis as any).React = React;
  
  // Polyfill useLayoutEffect
  if (!React.useLayoutEffect) {
    React.useLayoutEffect = safeUseLayoutEffect;
  }
  
  // Ensure all hooks are available
  React.useEffect = React.useEffect || useEffect;
  React.useLayoutEffect = React.useLayoutEffect || safeUseLayoutEffect;
}

// Also set on window for browser environments
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).React.useLayoutEffect = safeUseLayoutEffect;
  (window as any).React.useEffect = useEffect;
}

// Export the safe version
export { useEffect };
export { safeUseLayoutEffect as useLayoutEffect };
