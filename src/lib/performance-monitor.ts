/**
 * Performance monitoring utilities for tracking image optimization benefits
 * and overall application performance
 */

export interface PerformanceMetrics {
  imageLoadTime: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  networkQuality: 'fast' | 'slow' | 'offline';
  timestamp: number;
}

export interface PageLoadMetrics {
  pageName: string;
  loadTime: number;
  imageCount: number;
  totalImageSize: number;
  optimizedImageSize: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private pageMetrics: PageLoadMetrics[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true';
  }

  /**
   * Track image optimization performance
   */
  trackImageOptimization(
    originalUrl: string,
    optimizedUrl: string,
    loadTime: number,
    networkQuality: 'fast' | 'slow' | 'offline'
  ) {
    if (!this.isEnabled) return;

    // Estimate original size (this is approximate)
    const originalSize = this.estimateImageSize(originalUrl);
    const optimizedSize = this.estimateImageSize(optimizedUrl);
    const compressionRatio = originalSize > 0 ? (1 - optimizedSize / originalSize) * 100 : 0;

    const metric: PerformanceMetrics = {
      imageLoadTime: loadTime,
      originalSize,
      optimizedSize,
      compressionRatio,
      networkQuality,
      timestamp: Date.now()
    };

    this.metrics.push(metric);

    // Log in development
    if (import.meta.env.DEV) {
      console.log('🖼️ Image Optimization:', {
        originalSize: this.formatBytes(originalSize),
        optimizedSize: this.formatBytes(optimizedSize),
        compressionRatio: `${compressionRatio.toFixed(1)}%`,
        loadTime: `${loadTime}ms`,
        networkQuality
      });
      
      // Show alert for slow image loads
      if (loadTime > 2000) {
        console.warn(`🐌 Slow image load detected: ${loadTime}ms. Consider optimizing further.`);
      }
    }

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Track page load performance
   */
  trackPageLoad(
    pageName: string,
    loadTime: number,
    imageCount: number,
    totalImageSize: number,
    optimizedImageSize: number
  ) {
    if (!this.isEnabled) return;

    const metric: PageLoadMetrics = {
      pageName,
      loadTime,
      imageCount,
      totalImageSize,
      optimizedImageSize,
      timestamp: Date.now()
    };

    this.pageMetrics.push(metric);

    // Log in development
    if (import.meta.env.DEV) {
      const savings = totalImageSize - optimizedImageSize;
      const savingsPercent = totalImageSize > 0 ? (savings / totalImageSize) * 100 : 0;
      
      console.log('📊 Page Load Performance:', {
        page: pageName,
        loadTime: `${loadTime}ms`,
        images: imageCount,
        originalSize: this.formatBytes(totalImageSize),
        optimizedSize: this.formatBytes(optimizedImageSize),
        savings: this.formatBytes(savings),
        savingsPercent: `${savingsPercent.toFixed(1)}%`
      });
    }

    // Keep only last 50 page metrics
    if (this.pageMetrics.length > 50) {
      this.pageMetrics = this.pageMetrics.slice(-50);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    if (this.metrics.length === 0) {
      return {
        totalImages: 0,
        averageLoadTime: 0,
        averageCompressionRatio: 0,
        totalSavings: 0,
        networkQualityDistribution: { fast: 0, slow: 0, offline: 0 }
      };
    }

    const totalImages = this.metrics.length;
    const averageLoadTime = this.metrics.reduce((sum, m) => sum + m.imageLoadTime, 0) / totalImages;
    const averageCompressionRatio = this.metrics.reduce((sum, m) => sum + m.compressionRatio, 0) / totalImages;
    const totalSavings = this.metrics.reduce((sum, m) => sum + (m.originalSize - m.optimizedSize), 0);

    const networkQualityDistribution = this.metrics.reduce((acc, m) => {
      acc[m.networkQuality]++;
      return acc;
    }, { fast: 0, slow: 0, offline: 0 });

    return {
      totalImages,
      averageLoadTime: Math.round(averageLoadTime),
      averageCompressionRatio: Math.round(averageCompressionRatio * 10) / 10,
      totalSavings,
      networkQualityDistribution
    };
  }

  /**
   * Get page performance summary
   */
  getPagePerformanceSummary() {
    if (this.pageMetrics.length === 0) {
      return {
        totalPages: 0,
        averageLoadTime: 0,
        totalImageSavings: 0,
        averageImageSavings: 0
      };
    }

    const totalPages = this.pageMetrics.length;
    const averageLoadTime = this.pageMetrics.reduce((sum, m) => sum + m.loadTime, 0) / totalPages;
    const totalImageSavings = this.pageMetrics.reduce((sum, m) => sum + (m.totalImageSize - m.optimizedImageSize), 0);
    const averageImageSavings = totalImageSavings / totalPages;

    return {
      totalPages,
      averageLoadTime: Math.round(averageLoadTime),
      totalImageSavings,
      averageImageSavings: Math.round(averageImageSavings)
    };
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData() {
    return {
      imageMetrics: this.metrics,
      pageMetrics: this.pageMetrics,
      summary: this.getPerformanceSummary(),
      pageSummary: this.getPagePerformanceSummary(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Clear all performance data
   */
  clearData() {
    this.metrics = [];
    this.pageMetrics = [];
  }

  /**
   * Estimate image size based on URL (very approximate)
   */
  private estimateImageSize(url: string): number {
    // This is a rough estimation - in a real implementation,
    // you might want to fetch the actual image size
    if (url.includes('width=') && url.includes('height=')) {
      const widthMatch = url.match(/width=(\d+)/);
      const heightMatch = url.match(/height=(\d+)/);
      const qualityMatch = url.match(/quality=(\d+)/);
      
      if (widthMatch && heightMatch) {
        const width = parseInt(widthMatch[1]);
        const height = parseInt(heightMatch[1]);
        const quality = qualityMatch ? parseInt(qualityMatch[1]) : 80;
        
        // Rough estimation: width * height * 3 bytes per pixel * quality factor
        const baseSize = width * height * 3;
        const qualityFactor = quality / 100;
        return Math.round(baseSize * qualityFactor);
      }
    }
    
    // Default estimation for unoptimized images
    return 500000; // ~500KB
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook to track image optimization performance
 */
export function useImagePerformanceTracking() {
  const trackImageLoad = (
    originalUrl: string,
    optimizedUrl: string,
    loadTime: number,
    networkQuality: 'fast' | 'slow' | 'offline'
  ) => {
    performanceMonitor.trackImageOptimization(originalUrl, optimizedUrl, loadTime, networkQuality);
  };

  const trackPageLoad = (
    pageName: string,
    loadTime: number,
    imageCount: number,
    totalImageSize: number,
    optimizedImageSize: number
  ) => {
    performanceMonitor.trackPageLoad(pageName, loadTime, imageCount, totalImageSize, optimizedImageSize);
  };

  const getSummary = () => performanceMonitor.getPerformanceSummary();
  const getPageSummary = () => performanceMonitor.getPagePerformanceSummary();
  const exportData = () => performanceMonitor.exportPerformanceData();
  const clearData = () => performanceMonitor.clearData();

  return {
    trackImageLoad,
    trackPageLoad,
    getSummary,
    getPageSummary,
    exportData,
    clearData
  };
}

/**
 * Utility to measure page load time
 */
export function measurePageLoad(pageName: string, startTime: number = performance.now()) {
  const endTime = performance.now();
  const loadTime = endTime - startTime;
  
  if (import.meta.env.DEV) {
    console.log(`📄 Page "${pageName}" loaded in ${Math.round(loadTime)}ms`);
  }
  
  return loadTime;
}

/**
 * Utility to measure image load time
 */
export function measureImageLoad(
  imageUrl: string,
  startTime: number = performance.now()
): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      resolve(loadTime);
    };
    img.onerror = () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      resolve(loadTime);
    };
    img.src = imageUrl;
  });
}
