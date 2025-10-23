import { useState, useEffect, useCallback } from 'react';

export type NetworkQuality = 'fast' | 'slow' | 'offline';

export interface NetworkInfo {
  quality: NetworkQuality;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  isOnline: boolean;
}

/**
 * Hook to detect network quality and connection status
 * Provides adaptive loading strategies based on connection speed
 */
export function useNetworkQuality(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    quality: 'fast',
    isOnline: navigator.onLine
  });

  const determineNetworkQuality = useCallback((connection: any): NetworkQuality => {
    if (!navigator.onLine) {
      return 'offline';
    }

    // If no connection info available, assume fast
    if (!connection) {
      return 'fast';
    }

    const { effectiveType, downlink, rtt, saveData } = connection;

    // Check for data saver mode
    if (saveData) {
      return 'slow';
    }

    // Determine quality based on effective type
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'slow';
      case '3g':
        // 3g can be fast or slow depending on downlink
        return downlink && downlink < 1 ? 'slow' : 'fast';
      case '4g':
      default:
        // 4g and above are generally fast
        return 'fast';
    }
  }, []);

  const updateNetworkInfo = useCallback(() => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    const quality = determineNetworkQuality(connection);
    
    // Show console alert for slow connections
    if (quality === 'slow') {
      console.warn('🐌 Slow connection detected! Images will be optimized for better performance.');
    } else if (quality === 'offline') {
      console.warn('📴 Offline mode detected! Using cached images.');
    } else if (quality === 'fast') {
      console.log('🚀 Fast connection detected! Loading high-quality images.');
    }
    
    setNetworkInfo({
      quality,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
      isOnline: navigator.onLine
    });
  }, [determineNetworkQuality]);

  useEffect(() => {
    // Initial check
    updateNetworkInfo();

    // Listen for online/offline events
    const handleOnline = () => updateNetworkInfo();
    const handleOffline = () => updateNetworkInfo();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [updateNetworkInfo]);

  return networkInfo;
}

/**
 * Hook to get adaptive image quality based on network conditions
 */
export function useAdaptiveImageQuality() {
  const { quality, isOnline } = useNetworkQuality();

  const getImageQuality = useCallback((baseQuality: number = 80): number => {
    if (!isOnline) {
      return 20; // Very low quality for offline
    }

    switch (quality) {
      case 'slow':
        return Math.min(baseQuality, 60); // Reduce quality for slow connections
      case 'fast':
        return baseQuality; // Use full quality for fast connections
      case 'offline':
        return 20; // Very low quality for offline
      default:
        return baseQuality;
    }
  }, [quality, isOnline]);

  const getImageFormat = useCallback((): 'webp' | 'jpeg' => {
    if (!isOnline || quality === 'slow') {
      return 'webp'; // WebP for better compression
    }
    return 'webp'; // Default to WebP for all cases
  }, [quality, isOnline]);

  const shouldPreloadImages = useCallback((): boolean => {
    return quality === 'fast' && isOnline;
  }, [quality, isOnline]);

  const getMaxImageSize = useCallback((baseSize: number = 800): number => {
    if (!isOnline) {
      return 200; // Very small images for offline
    }

    switch (quality) {
      case 'slow':
        return Math.min(baseSize, 400); // Smaller images for slow connections
      case 'fast':
        return baseSize; // Full size for fast connections
      case 'offline':
        return 200; // Very small images for offline
      default:
        return baseSize;
    }
  }, [quality, isOnline]);

  return {
    getImageQuality,
    getImageFormat,
    shouldPreloadImages,
    getMaxImageSize,
    networkQuality: quality,
    isOnline
  };
}

/**
 * Hook to show network status indicator
 */
export function useNetworkStatus() {
  const { quality, isOnline } = useNetworkQuality();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Show indicator for slow or offline connections
    setShowIndicator(quality === 'slow' || !isOnline);
  }, [quality, isOnline]);

  const getStatusMessage = useCallback((): string => {
    if (!isOnline) {
      return 'Offline - Using cached data';
    }
    
    switch (quality) {
      case 'slow':
        return 'Slow connection - Optimizing for performance';
      case 'fast':
        return '';
      default:
        return '';
    }
  }, [quality, isOnline]);

  const getStatusColor = useCallback((): string => {
    if (!isOnline) {
      return 'text-red-600';
    }
    
    switch (quality) {
      case 'slow':
        return 'text-yellow-600';
      case 'fast':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  }, [quality, isOnline]);

  return {
    showIndicator,
    statusMessage: getStatusMessage(),
    statusColor: getStatusColor(),
    networkQuality: quality,
    isOnline
  };
}
