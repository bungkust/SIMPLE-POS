/**
 * React Loader - Ensures React is available before app loads
 * This script runs before the main application to fix useLayoutEffect issues
 */

(function() {
  'use strict';
  
  // Wait for React to be available
  function waitForReact() {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.React) {
        resolve(window.React);
        return;
      }
      
      // Check every 10ms for React
      const checkInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.React) {
          clearInterval(checkInterval);
          resolve(window.React);
        }
      }, 10);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 5000);
    });
  }
  
  // Ensure React hooks are available
  function ensureReactHooks(React) {
    if (!React) return;
    
    // Import useEffect and useLayoutEffect
    const { useEffect, useLayoutEffect } = React;
    
    // Ensure useLayoutEffect is available
    if (!React.useLayoutEffect && useLayoutEffect) {
      React.useLayoutEffect = useLayoutEffect;
    }
    
    // Fallback: use useEffect if useLayoutEffect is not available
    if (!React.useLayoutEffect && React.useEffect) {
      React.useLayoutEffect = React.useEffect;
    }
    
    // Ensure useEffect is available
    if (!React.useEffect && useEffect) {
      React.useEffect = useEffect;
    }
    
    console.log('React hooks ensured:', {
      useEffect: !!React.useEffect,
      useLayoutEffect: !!React.useLayoutEffect
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    waitForReact().then((React) => {
      if (React) {
        ensureReactHooks(React);
        console.log('React loader: React hooks ensured successfully');
      } else {
        console.warn('React loader: React not found, hooks may not work properly');
      }
    });
  }
})();
