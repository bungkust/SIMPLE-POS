import { useRef, useCallback, useEffect } from 'react';

interface MenuWorkerMessage {
  type: string;
  data: any;
}

interface MenuWorkerResponse {
  type: string;
  data: any;
}

export const useMenuWorker = () => {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Only create worker in browser environment
    if (typeof window !== 'undefined' && 'Worker' in window) {
      workerRef.current = new Worker('/menu-worker.js');
      
      return () => {
        if (workerRef.current) {
          workerRef.current.terminate();
        }
      };
    }
  }, []);

  const sendMessage = useCallback((message: MenuWorkerMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Fallback to synchronous processing if worker not available
        resolve(processSynchronously(message));
        return;
      }

      const handleMessage = (event: MessageEvent<MenuWorkerResponse>) => {
        if (event.data.type === message.type + '_RESULT') {
          workerRef.current?.removeEventListener('message', handleMessage);
          resolve(event.data.data);
        }
      };

      const handleError = (error: ErrorEvent) => {
        workerRef.current?.removeEventListener('message', handleMessage);
        workerRef.current?.removeEventListener('error', handleError);
        reject(error);
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.addEventListener('error', handleError);
      workerRef.current.postMessage(message);
    });
  }, []);

  const filterMenuItems = useCallback(async (items: any[], filters: any) => {
    return sendMessage({
      type: 'FILTER_MENU_ITEMS',
      data: { items, filters }
    });
  }, [sendMessage]);

  const sortMenuItems = useCallback(async (items: any[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') => {
    return sendMessage({
      type: 'SORT_MENU_ITEMS',
      data: { items, sortBy, sortOrder }
    });
  }, [sendMessage]);

  const searchMenuItems = useCallback(async (items: any[], query: string) => {
    return sendMessage({
      type: 'SEARCH_MENU_ITEMS',
      data: { items, query }
    });
  }, [sendMessage]);

  const processImageUrls = useCallback(async (items: any[]) => {
    return sendMessage({
      type: 'PROCESS_IMAGE_URLS',
      data: { items }
    });
  }, [sendMessage]);

  return {
    filterMenuItems,
    sortMenuItems,
    searchMenuItems,
    processImageUrls
  };
};

// Fallback synchronous processing
function processSynchronously(message: MenuWorkerMessage): any {
  const { type, data } = message;
  
  switch (type) {
    case 'FILTER_MENU_ITEMS':
      return data.items.filter((item: any) => {
        if (data.filters.category && item.category_id !== data.filters.category) {
          return false;
        }
        if (data.filters.priceRange) {
          const price = item.price || 0;
          if (price < data.filters.priceRange.min || price > data.filters.priceRange.max) {
            return false;
          }
        }
        if (data.filters.isActive !== undefined && item.is_active !== data.filters.isActive) {
          return false;
        }
        return true;
      });
      
    case 'SORT_MENU_ITEMS':
      return [...data.items].sort((a: any, b: any) => {
        let aValue, bValue;
        
        switch (data.sortBy) {
          case 'name':
            aValue = a.name?.toLowerCase() || '';
            bValue = b.name?.toLowerCase() || '';
            break;
          case 'price':
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          default:
            aValue = a.name?.toLowerCase() || '';
            bValue = b.name?.toLowerCase() || '';
        }
        
        if (data.sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });
      
    case 'SEARCH_MENU_ITEMS':
      if (!data.query || data.query.trim() === '') {
        return data.items;
      }
      
      const searchTerm = data.query.toLowerCase().trim();
      return data.items.filter((item: any) => {
        const name = (item.name || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return name.includes(searchTerm) || description.includes(searchTerm);
      });
      
    case 'PROCESS_IMAGE_URLS':
      return data.items.map((item: any) => {
        if (item.photo_url) {
          const baseUrl = item.photo_url;
          return {
            ...item,
            imageUrls: {
              thumbnail: `${baseUrl}?width=200&height=200&quality=60&format=webp`,
              medium: `${baseUrl}?width=400&height=300&quality=70&format=webp`,
              large: `${baseUrl}?width=800&height=600&quality=80&format=webp`
            }
          };
        }
        return item;
      });
      
    default:
      return data.items;
  }
}
