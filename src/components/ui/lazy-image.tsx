import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  getOptimizedImageUrl, 
  getProgressivePlaceholder, 
  getResponsiveImageUrls,
  preloadImage 
} from '@/lib/image-utils';
import { useAdaptiveImageQuality } from '@/hooks/use-network-quality';
import { trackImageLoad } from '@/lib/performance-utils';

export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  fallback?: string;
  loading?: 'lazy' | 'eager';
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  onLoad?: () => void;
  onError?: () => void;
  showSkeleton?: boolean;
  progressive?: boolean;
  threshold?: number; // Intersection Observer threshold
  rootMargin?: string; // Intersection Observer root margin
}

export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  placeholder,
  fallback,
  loading = 'lazy',
  quality = 80,
  format = 'auto',
  fit = 'cover',
  onLoad,
  onError,
  showSkeleton = true,
  progressive = true,
  threshold = 0.1,
  rootMargin = '50px'
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Get adaptive image quality based on network conditions
  const { getImageQuality, getImageFormat, getMaxImageSize } = useAdaptiveImageQuality();

  // Generate optimized URLs with adaptive quality
  const adaptiveQuality = getImageQuality(quality);
  const adaptiveFormat = getImageFormat();
  const adaptiveWidth = width ? getMaxImageSize(width) : width;
  const adaptiveHeight = height ? getMaxImageSize(height) : height;

  const optimizedSrc = getOptimizedImageUrl(src, {
    width: adaptiveWidth,
    height: adaptiveHeight,
    quality: adaptiveQuality,
    format: format === 'auto' ? adaptiveFormat : format,
    fit
  });

  // Fallback to original src if optimization fails
  const [currentSrc, setCurrentSrc] = useState(optimizedSrc);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  const placeholderSrc = placeholder || getProgressivePlaceholder(src, {
    width: width || 200,
    height: height || 200
  });

  const fallbackSrc = fallback || '/placeholder-image.png';

  // Intersection Observer callback
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && !isInView) {
      setIsInView(true);
      setIsLoading(true);
      setLoadStartTime(performance.now());
      
      // Preload the image
      preloadImage(currentSrc)
        .then(() => {
          const loadTime = performance.now() - loadStartTime;
          setImageSrc(currentSrc);
          setIsLoaded(true);
          setIsLoading(false);
          
          // Track performance
          trackImageLoad(currentSrc, loadTime, true);
          
          onLoad?.();
        })
        .catch(() => {
          const loadTime = performance.now() - loadStartTime;
          setHasError(true);
          setIsLoading(false);
          
          // Track performance
          trackImageLoad(currentSrc, loadTime, false);
          
          onError?.();
        });
    }
  }, [currentSrc, isInView, onLoad, onError, loadStartTime]);

  // Set up Intersection Observer
  useEffect(() => {
    if (!imageRef || loading === 'eager') {
      // Load immediately for eager loading
      setIsInView(true);
      setIsLoading(true);
      setLoadStartTime(performance.now());
      
      preloadImage(currentSrc)
        .then(() => {
          const loadTime = performance.now() - loadStartTime;
          setImageSrc(currentSrc);
          setIsLoaded(true);
          setIsLoading(false);
          
          // Track performance
          trackImageLoad(currentSrc, loadTime, true);
          
          onLoad?.();
        })
        .catch(() => {
          const loadTime = performance.now() - loadStartTime;
          setHasError(true);
          setIsLoading(false);
          
          // Track performance
          trackImageLoad(currentSrc, loadTime, false);
          
          onError?.();
        });
      return;
    }

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });

    observerRef.current.observe(imageRef);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [imageRef, loading, handleIntersection, threshold, rootMargin, currentSrc, onLoad, onError]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image error with fallback
  const handleImageError = useCallback(() => {
    if (!fallbackAttempted && currentSrc !== src) {
      // Try fallback to original image
      setFallbackAttempted(true);
      setCurrentSrc(src);
      setIsLoading(true);
      setHasError(false);
      return;
    }
    
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError, fallbackAttempted, currentSrc, src]);

  // Determine which image to show
  const getCurrentSrc = () => {
    if (hasError) return fallbackSrc;
    if (isLoaded && imageSrc) return imageSrc;
    if (progressive && isInView) return placeholderSrc;
    return placeholderSrc;
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Main Image */}
      <img
        ref={setImageRef}
        src={getCurrentSrc()}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={cn(
          'transition-all duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          hasError && 'opacity-50'
        )}
        style={{
          objectFit: fit,
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto'
        }}
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
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : 'auto',
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
          <div className="text-center text-muted-foreground">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Convenience components for common use cases
export function ThumbnailImage(props: Omit<LazyImageProps, 'width' | 'height' | 'quality'>) {
  return (
    <LazyImage
      {...props}
      width={200}
      height={200}
      quality={75}
      fit="cover"
    />
  );
}

export function MediumImage(props: Omit<LazyImageProps, 'width' | 'height' | 'quality'>) {
  return (
    <LazyImage
      {...props}
      width={800}
      height={600}
      quality={85}
      fit="cover"
    />
  );
}

export function LargeImage(props: Omit<LazyImageProps, 'width' | 'height' | 'quality'>) {
  return (
    <LazyImage
      {...props}
      width={1200}
      height={900}
      quality={90}
      fit="cover"
    />
  );
}

// Hook for preloading multiple images
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const preloadImages = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all(
        urls.map(async (url) => {
          try {
            await preloadImage(url);
            setLoadedImages(prev => new Set([...prev, url]));
          } catch (error) {
            console.warn(`Failed to preload image: ${url}`, error);
          }
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [urls]);

  useEffect(() => {
    if (urls.length > 0) {
      preloadImages();
    }
  }, [urls, preloadImages]);

  return {
    loadedImages,
    isLoading,
    isImageLoaded: (url: string) => loadedImages.has(url),
    preloadImages
  };
}
