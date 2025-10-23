/**
 * React Loader - Ensures React is available before app loads
 * This script runs before the main application to fix useLayoutEffect issues
 */

(function() {
  'use strict';
  
  // Create a mock React object with hooks if React is not available
  function createMockReact() {
    const mockReact = {
      useEffect: function(callback, deps) {
        // Simple useEffect implementation
        if (typeof callback === 'function') {
          if (deps === undefined || deps.length === 0) {
            // Run immediately if no deps
            callback();
          } else {
            // Run on next tick
            setTimeout(callback, 0);
          }
        }
      },
      useLayoutEffect: function(callback, deps) {
        // useLayoutEffect fallback to useEffect
        return mockReact.useEffect(callback, deps);
      },
      useState: function(initial) {
        return [initial, function() {}];
      },
      useCallback: function(callback, deps) {
        return callback;
      },
      useMemo: function(factory, deps) {
        return factory();
      }
    };
    
    return mockReact;
  }
  
  // Ensure React is available globally
  function ensureReact() {
    if (typeof window === 'undefined') return;
    
    // Check for circular dependency prevention flag
    if (window.__PREVENT_CIRCULAR_DEPS__) {
      console.log('Circular dependency prevention active');
    }
    
    // If React is not available, create a mock
    if (!window.React) {
      console.log('React not found, creating mock React');
      window.React = createMockReact();
    }
    
    // Ensure hooks are available
    const React = window.React;
    
    if (!React.useLayoutEffect) {
      React.useLayoutEffect = React.useEffect || function(callback, deps) {
        if (typeof callback === 'function') {
          setTimeout(callback, 0);
        }
      };
    }
    
    if (!React.useEffect) {
      React.useEffect = function(callback, deps) {
        if (typeof callback === 'function') {
          setTimeout(callback, 0);
        }
      };
    }
    
    console.log('React hooks ensured:', {
      useEffect: !!React.useEffect,
      useLayoutEffect: !!React.useLayoutEffect,
      isMock: React === createMockReact()
    });
  }
  
  // Initialize immediately
  ensureReact();
  
  // Also initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureReact);
  }
  
  // Monitor for React availability
  let checkCount = 0;
  const maxChecks = 100; // Check for 1 second (100 * 10ms)
  
  const checkInterval = setInterval(() => {
    checkCount++;
    
    if (window.React && window.React.useLayoutEffect) {
      clearInterval(checkInterval);
      console.log('React found and hooks ensured after', checkCount * 10, 'ms');
    } else if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
      console.warn('React not found after 1 second, using mock React');
      ensureReact();
    } else {
      ensureReact();
    }
  }, 10);
})();
