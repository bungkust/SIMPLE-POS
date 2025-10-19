/**
 * Performance monitoring utilities for tracking Core Web Vitals and other metrics
 */

export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  imageLoadTimes?: Record<string, number>;
  customMetrics?: Record<string, number>;
}

export interface PerformanceConfig {
  enableLogging?: boolean;
  enableAnalytics?: boolean;
  analyticsEndpoint?: string;
  sampleRate?: number; // 0-1, percentage of users to track
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics = {};
  private imageLoadTimes: Record<string, number> = {};
  private customMetrics: Record<string, number> = {};

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enableLogging: true,
      enableAnalytics: false,
      sampleRate: 0.1, // Track 10% of users by default
      ...config
    };

    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // Only track a sample of users
    if (Math.random() > this.config.sampleRate) return;

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Monitor image load times
    this.monitorImageLoadTimes();
    
    // Monitor custom metrics
    this.monitorCustomMetrics();
  }

  private monitorCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
          this.logMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        this.logError('Failed to observe LCP:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.logMetric('FID', this.metrics.fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        this.logError('Failed to observe FID:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
          this.logMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        this.logError('Failed to observe CLS:', error);
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              this.logMetric('FCP', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (error) {
        this.logError('Failed to observe FCP:', error);
      }
    }

    // Time to First Byte (TTFB)
    if ('performance' in window && 'timing' in window.performance) {
      const timing = window.performance.timing;
      const ttfb = timing.responseStart - timing.navigationStart;
      this.metrics.ttfb = ttfb;
      this.logMetric('TTFB', ttfb);
    }
  }

  private monitorImageLoadTimes() {
    if (typeof window === 'undefined') return;

    // Monitor all images on the page
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      const startTime = performance.now();
      
      img.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        const src = img.src || img.getAttribute('data-src') || 'unknown';
        this.imageLoadTimes[src] = loadTime;
        this.logMetric(`Image Load: ${src}`, loadTime);
      });

      img.addEventListener('error', () => {
        const loadTime = performance.now() - startTime;
        const src = img.src || img.getAttribute('data-src') || 'unknown';
        this.imageLoadTimes[src] = -1; // -1 indicates error
        this.logMetric(`Image Error: ${src}`, loadTime);
      });
    });
  }

  private monitorCustomMetrics() {
    // Monitor page load time
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        this.customMetrics['pageLoadTime'] = loadTime;
        this.logMetric('Page Load Time', loadTime);
      });
    }
  }

  // Public methods for tracking custom metrics
  public trackCustomMetric(name: string, value: number) {
    this.customMetrics[name] = value;
    this.logMetric(`Custom: ${name}`, value);
  }

  public trackImageLoad(src: string, loadTime: number, success: boolean = true) {
    this.imageLoadTimes[src] = success ? loadTime : -1;
    this.logMetric(`Image ${success ? 'Load' : 'Error'}: ${src}`, loadTime);
  }

  public trackAsyncOperation(name: string, startTime: number, endTime?: number) {
    const duration = endTime ? endTime - startTime : performance.now() - startTime;
    this.trackCustomMetric(name, duration);
    return duration;
  }

  public getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      imageLoadTimes: this.imageLoadTimes,
      customMetrics: this.customMetrics
    };
  }

  public getImageLoadTimes(): Record<string, number> {
    return { ...this.imageLoadTimes };
  }

  public getCustomMetrics(): Record<string, number> {
    return { ...this.customMetrics };
  }

  public getCoreWebVitals() {
    return {
      lcp: this.metrics.lcp,
      fid: this.metrics.fid,
      cls: this.metrics.cls,
      fcp: this.metrics.fcp,
      ttfb: this.metrics.ttfb
    };
  }

  public sendToAnalytics() {
    if (!this.config.enableAnalytics || !this.config.analyticsEndpoint) {
      return;
    }

    const metrics = this.getMetrics();
    
    // Send to analytics endpoint
    fetch(this.config.analyticsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        metrics
      })
    }).catch(error => {
      this.logError('Failed to send analytics:', error);
    });
  }

  private logMetric(name: string, value: number) {
    if (this.config.enableLogging && process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance: ${name} = ${value.toFixed(2)}ms`);
    }
  }

  private logError(message: string, error: any) {
    if (this.config.enableLogging) {
      console.error(`❌ Performance Monitor: ${message}`, error);
    }
  }
}

// Global instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initializePerformanceMonitoring(config?: PerformanceConfig) {
  if (typeof window === 'undefined') return null;
  
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(config);
  }
  
  return performanceMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

// Utility functions for easy use
export function trackImageLoad(src: string, loadTime: number, success: boolean = true) {
  performanceMonitor?.trackImageLoad(src, loadTime, success);
}

export function trackCustomMetric(name: string, value: number) {
  performanceMonitor?.trackCustomMetric(name, value);
}

export function trackAsyncOperation(name: string, startTime: number, endTime?: number) {
  return performanceMonitor?.trackAsyncOperation(name, startTime, endTime);
}

export function getPerformanceMetrics(): PerformanceMetrics {
  return performanceMonitor?.getMetrics() || {};
}

export function getCoreWebVitals() {
  return performanceMonitor?.getCoreWebVitals() || {};
}

// React hook for performance monitoring
export function usePerformanceTracking() {
  const trackMetric = (name: string, value: number) => {
    trackCustomMetric(name, value);
  };

  const trackImage = (src: string, loadTime: number, success: boolean = true) => {
    trackImageLoad(src, loadTime, success);
  };

  const trackAsync = (name: string, startTime: number, endTime?: number) => {
    return trackAsyncOperation(name, startTime, endTime);
  };

  const getMetrics = () => {
    return getPerformanceMetrics();
  };

  return {
    trackMetric,
    trackImage,
    trackAsync,
    getMetrics
  };
}

// Initialize performance monitoring on module load
if (typeof window !== 'undefined') {
  initializePerformanceMonitoring({
    enableLogging: process.env.NODE_ENV === 'development',
    enableAnalytics: false, // Set to true and provide endpoint to enable
    sampleRate: 0.1 // Track 10% of users
  });
}
