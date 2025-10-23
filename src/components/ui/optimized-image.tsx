import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  getOptimizedImageUrl, 
  getThumbnailUrl, 
  getMediumImageUrl, 
  getLargeImageUrl,
  getProgressivePlaceholder,
  type ImageTransformOptions 
} from '@/lib/image-utils';
import { useAdaptiveImageQuality } from '@/hooks/use-network-quality';
import { useImagePerformanceTracking } from '@/lib/performance-monitor';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  size?: 'thumbnail' | 'small' | 'medium' | 'large' | 'custom';
  customSize?: { width: number; height: number };
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  gravity?: 'auto' | 'center' | 'top' | 'bottom' | 'left' | 'right';
  progressive?: boolean;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  showSkeleton?: boolean;
  adaptive?: boolean;
}

/**
 * OptimizedImage component that automatically handles image optimization
 * based on network conditions and provides progressive loading
 */
export function OptimizedImage({
  src,
  alt,
  size = 'medium',
  customSize,
  quality,
  format = 'auto',
  fit = 'cover',
  gravity = 'auto',
  progressive = true,
  fallback = '/placeholder-image.png',
  onLoad,
  onError,
  showSkeleton = true,
  adaptive = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const loadStartTime = useRef<number>(0);

  // Get adaptive image quality based on network conditions
  const { getImageQuality, getImageFormat, getMaxImageSize, networkQuality } = useAdaptiveImageQuality();
  
  // Performance tracking
  const { trackImageLoad } = useImagePerformanceTracking();

  // Generate optimized image URL
  const getOptimizedSrc = useCallback(() => {
    if (!src) return fallback;

    // Use adaptive settings if enabled
    const finalQuality = adaptive ? getImageQuality(quality || 80) : (quality || 80);
    const finalFormat = adaptive ? getImageFormat() : format;
    
    let optimizedSrc: string;
    let finalSize: { width: number; height: number } | undefined;

    // Determine size
    if (size === 'custom' && customSize) {
      finalSize = customSize;
    } else {
      switch (size) {
        case 'thumbnail':
          finalSize = { width: 200, height: 200 };
          break;
        case 'small':
          finalSize = { width: 400, height: 300 };
          break;
        case 'medium':
          finalSize = { width: 800, height: 600 };
          break;
        case 'large':
          finalSize = { width: 1200, height: 900 };
          break;
        default:
          finalSize = { width: 800, height: 600 };
      }
    }

    // Apply adaptive sizing if enabled
    if (adaptive && finalSize) {
      finalSize.width = getMaxImageSize(finalSize.width);
      finalSize.height = getMaxImageSize(finalSize.height);
    }

    // Generate optimized URL based on size
    const options: ImageTransformOptions = {
      width: finalSize?.width,
      height: finalSize?.height,
      quality: finalQuality,
      format: finalFormat,
      fit,
      gravity
    };

    switch (size) {
      case 'thumbnail':
        optimizedSrc = getThumbnailUrl(src, finalSize);
        break;
      case 'small':
      case 'medium':
        optimizedSrc = getMediumImageUrl(src, finalSize);
        break;
      case 'large':
        optimizedSrc = getLargeImageUrl(src, finalSize);
        break;
      case 'custom':
        optimizedSrc = getOptimizedImageUrl(src, options);
        break;
      default:
        optimizedSrc = getMediumImageUrl(src, finalSize);
    }

    return optimizedSrc;
  }, [src, size, customSize, quality, format, fit, gravity, adaptive, getImageQuality, getImageFormat, getMaxImageSize, fallback]);

  const optimizedSrc = getOptimizedSrc();
  const placeholderSrc = progressive ? getProgressivePlaceholder(src, { width: 200, height: 200 }) : optimizedSrc;

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsLoading(false);
    
    // Track performance
    if (loadStartTime.current > 0) {
      const loadTime = performance.now() - loadStartTime.current;
      trackImageLoad(src, optimizedSrc, loadTime, networkQuality);
    }
    
    onLoad?.();
  }, [onLoad, src, optimizedSrc, trackImageLoad, networkQuality]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    
    // Track performance even on error
    if (loadStartTime.current > 0) {
      const loadTime = performance.now() - loadStartTime.current;
      trackImageLoad(src, optimizedSrc, loadTime, networkQuality);
    }
    
    onError?.();
  }, [onError, src, optimizedSrc, trackImageLoad, networkQuality]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    loadStartTime.current = performance.now();
  }, []);

  // Determine which image to show
  const getCurrentSrc = () => {
    if (hasError) return fallback;
    if (isLoaded) return optimizedSrc;
    if (progressive) return placeholderSrc;
    return optimizedSrc;
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Main Image */}
      <img
        {...props}
        src={getCurrentSrc()}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={handleLoadStart}
        className={cn(
          'transition-all duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          hasError && 'opacity-50',
          props.className
        )}
      />

      {/* Progressive Placeholder */}
      {progressive && !isLoaded && !hasError && (
        <img
          src={placeholderSrc}
          alt=""
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            isLoaded ? 'opacity-0' : 'opacity-100'
          )}
          style={{
            objectFit: fit,
            filter: 'blur(5px)'
          }}
        />
      )}

      {/* Loading Skeleton */}
      {showSkeleton && isLoading && !isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Failed to load image</div>
        </div>
      )}
    </div>
  );
}

/**
 * Pre-configured image components for common use cases
 */
export const ThumbnailImage = React.forwardRef<HTMLImageElement, Omit<OptimizedImageProps, 'size'>>(
  (props, ref) => (
    <OptimizedImage {...props} size="thumbnail" ref={ref} />
  )
);

export const SmallImage = React.forwardRef<HTMLImageElement, Omit<OptimizedImageProps, 'size'>>(
  (props, ref) => (
    <OptimizedImage {...props} size="small" ref={ref} />
  )
);

export const MediumImage = React.forwardRef<HTMLImageElement, Omit<OptimizedImageProps, 'size'>>(
  (props, ref) => (
    <OptimizedImage {...props} size="medium" ref={ref} />
  )
);

export const LargeImage = React.forwardRef<HTMLImageElement, Omit<OptimizedImageProps, 'size'>>(
  (props, ref) => (
    <OptimizedImage {...props} size="large" ref={ref} />
  )
);

ThumbnailImage.displayName = 'ThumbnailImage';
SmallImage.displayName = 'SmallImage';
MediumImage.displayName = 'MediumImage';
LargeImage.displayName = 'LargeImage';
