import { useEffect, useState } from 'react';

interface PreloadImageOptions {
  src: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const useImagePreloader = () => {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const preloadImage = ({ src, priority = false, onLoad, onError }: PreloadImageOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (preloadedImages.has(src)) {
        onLoad?.();
        resolve();
        return;
      }

      if (loadingImages.has(src)) {
        // Wait for existing load to complete
        const checkLoaded = () => {
          if (preloadedImages.has(src)) {
            onLoad?.();
            resolve();
          } else {
            setTimeout(checkLoaded, 50);
          }
        };
        checkLoaded();
        return;
      }

      setLoadingImages(prev => new Set(prev).add(src));

      const img = new Image();
      
      if (priority) {
        // Set high priority for critical images
        img.fetchPriority = 'high';
        img.loading = 'eager';
      } else {
        img.loading = 'lazy';
      }

      img.onload = () => {
        setPreloadedImages(prev => new Set(prev).add(src));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        onLoad?.();
        resolve();
      };

      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        onError?.();
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  };

  const preloadCriticalImages = async (imageUrls: string[]) => {
    const criticalImages = imageUrls.slice(0, 3); // Preload first 3 images
    const promises = criticalImages.map((url, index) => 
      preloadImage({ 
        src: url, 
        priority: index < 2, // First 2 images get high priority
        onLoad: () => console.log(`Critical image loaded: ${url}`),
        onError: () => console.warn(`Failed to load critical image: ${url}`)
      })
    );

    try {
      await Promise.all(promises);
      console.log('All critical images preloaded');
    } catch (error) {
      console.warn('Some critical images failed to preload:', error);
    }
  };

  const preloadVisibleImages = (imageUrls: string[]) => {
    // Use Intersection Observer to preload images as they come into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.src;
            
            if (!preloadedImages.has(src)) {
              preloadImage({ 
                src,
                onLoad: () => console.log(`Visible image preloaded: ${src}`)
              });
            }
            
            observer.unobserve(img);
          }
        });
      },
      { 
        rootMargin: '50px 0px', // Start loading 50px before image comes into view
        threshold: 0.1 
      }
    );

    // Observe all images on the page
    const images = document.querySelectorAll('img[data-preload]');
    images.forEach(img => observer.observe(img));

    return () => observer.disconnect();
  };

  return {
    preloadImage,
    preloadCriticalImages,
    preloadVisibleImages,
    preloadedImages,
    loadingImages
  };
};
