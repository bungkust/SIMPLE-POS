/**
 * Image optimization utilities using Supabase Storage Transform API
 * Provides functions to generate optimized image URLs with various parameters
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  gravity?: 'auto' | 'center' | 'top' | 'bottom' | 'left' | 'right';
  blur?: number; // 0-1000
  sharpen?: number; // 0-1000
}

export interface ImageSize {
  thumbnail: { width: 200; height: 200 };
  small: { width: 400; height: 300 };
  medium: { width: 800; height: 600 };
  large: { width: 1200; height: 900 };
}

/**
 * Generate optimized image URL using Supabase Storage Transform
 * @param originalUrl - Original image URL from Supabase Storage
 * @param options - Transform options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageTransformOptions = {}
): string {
  if (!originalUrl) return '';
  
  // If it's not a Supabase Storage URL, return original
  if (!originalUrl.includes('supabase') || !originalUrl.includes('storage')) {
    return originalUrl;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'cover',
    gravity = 'auto',
    blur,
    sharpen
  } = options;

  const params = new URLSearchParams();

  // Add transform parameters
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (quality !== 80) params.append('quality', quality.toString());
  if (format !== 'auto') params.append('format', format);
  if (fit !== 'cover') params.append('fit', fit);
  if (gravity !== 'auto') params.append('gravity', gravity);
  if (blur) params.append('blur', blur.toString());
  if (sharpen) params.append('sharpen', sharpen.toString());

  // Add cache busting for development
  if (process.env.NODE_ENV === 'development') {
    params.append('t', Date.now().toString());
  }

  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}${params.toString()}`;
}

/**
 * Get thumbnail URL for list views
 * @param originalUrl - Original image URL
 * @param size - Thumbnail size (default: 200x200)
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(
  originalUrl: string,
  size: { width: number; height: number } = { width: 200, height: 200 }
): string {
  return getOptimizedImageUrl(originalUrl, {
    ...size,
    quality: 75,
    format: 'webp',
    fit: 'cover'
  });
}

/**
 * Get medium-sized image URL for detail views
 * @param originalUrl - Original image URL
 * @param size - Medium size (default: 800x600)
 * @returns Medium image URL
 */
export function getMediumImageUrl(
  originalUrl: string,
  size: { width: number; height: number } = { width: 800, height: 600 }
): string {
  return getOptimizedImageUrl(originalUrl, {
    ...size,
    quality: 85,
    format: 'webp',
    fit: 'cover'
  });
}

/**
 * Get large image URL for full-size displays
 * @param originalUrl - Original image URL
 * @param size - Large size (default: 1200x900)
 * @returns Large image URL
 */
export function getLargeImageUrl(
  originalUrl: string,
  size: { width: number; height: number } = { width: 1200, height: 900 }
): string {
  return getOptimizedImageUrl(originalUrl, {
    ...size,
    quality: 90,
    format: 'webp',
    fit: 'cover'
  });
}

/**
 * Generate progressive placeholder (blurred, low-quality version)
 * @param originalUrl - Original image URL
 * @param size - Placeholder size
 * @returns Progressive placeholder URL
 */
export function getProgressivePlaceholder(
  originalUrl: string,
  size: { width: number; height: number } = { width: 200, height: 200 }
): string {
  return getOptimizedImageUrl(originalUrl, {
    ...size,
    quality: 20,
    format: 'webp',
    fit: 'cover',
    blur: 10
  });
}

/**
 * Generate responsive image URLs for different screen sizes
 * @param originalUrl - Original image URL
 * @returns Object with URLs for different sizes
 */
export function getResponsiveImageUrls(originalUrl: string) {
  return {
    thumbnail: getThumbnailUrl(originalUrl, { width: 200, height: 200 }),
    small: getOptimizedImageUrl(originalUrl, { width: 400, height: 300, quality: 75 }),
    medium: getMediumImageUrl(originalUrl, { width: 800, height: 600 }),
    large: getLargeImageUrl(originalUrl, { width: 1200, height: 900 }),
    placeholder: getProgressivePlaceholder(originalUrl, { width: 200, height: 200 })
  };
}

/**
 * Check if image URL is from Supabase Storage
 * @param url - Image URL to check
 * @returns True if URL is from Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase') && url.includes('storage');
}

/**
 * Get image format based on browser support
 * @returns Preferred image format
 */
export function getPreferredImageFormat(): 'webp' | 'jpeg' {
  // Check if browser supports WebP
  if (typeof window !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'webp' : 'jpeg';
  }
  return 'jpeg';
}

/**
 * Generate optimized image URL with adaptive quality based on connection
 * @param originalUrl - Original image URL
 * @param options - Transform options
 * @param connectionQuality - Connection quality ('fast' | 'slow' | 'offline')
 * @returns Optimized image URL with adaptive quality
 */
export function getAdaptiveImageUrl(
  originalUrl: string,
  options: ImageTransformOptions = {},
  connectionQuality: 'fast' | 'slow' | 'offline' = 'fast'
): string {
  const adaptiveOptions = { ...options };

  // Adjust quality based on connection
  switch (connectionQuality) {
    case 'fast':
      adaptiveOptions.quality = options.quality || 85;
      break;
    case 'slow':
      adaptiveOptions.quality = Math.min(options.quality || 60, 60);
      adaptiveOptions.format = 'webp'; // Force WebP for better compression
      break;
    case 'offline':
      // Return cached/placeholder version
      return getProgressivePlaceholder(originalUrl, { width: 200, height: 200 });
  }

  return getOptimizedImageUrl(originalUrl, adaptiveOptions);
}

/**
 * Preload image for better performance
 * @param url - Image URL to preload
 * @returns Promise that resolves when image is loaded
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Batch preload multiple images
 * @param urls - Array of image URLs to preload
 * @returns Promise that resolves when all images are loaded
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage));
}
