// Web Worker for heavy menu operations
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'FILTER_MENU_ITEMS':
      const filteredItems = filterMenuItems(data.items, data.filters);
      self.postMessage({
        type: 'FILTER_MENU_ITEMS_RESULT',
        data: filteredItems
      });
      break;
      
    case 'SORT_MENU_ITEMS':
      const sortedItems = sortMenuItems(data.items, data.sortBy, data.sortOrder);
      self.postMessage({
        type: 'SORT_MENU_ITEMS_RESULT',
        data: sortedItems
      });
      break;
      
    case 'SEARCH_MENU_ITEMS':
      const searchResults = searchMenuItems(data.items, data.query);
      self.postMessage({
        type: 'SEARCH_MENU_ITEMS_RESULT',
        data: searchResults
      });
      break;
      
    case 'PROCESS_IMAGE_URLS':
      const processedItems = processImageUrls(data.items);
      self.postMessage({
        type: 'PROCESS_IMAGE_URLS_RESULT',
        data: processedItems
      });
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
};

function filterMenuItems(items, filters) {
  return items.filter(item => {
    if (filters.category && item.category_id !== filters.category) {
      return false;
    }
    if (filters.priceRange) {
      const price = item.price || 0;
      if (price < filters.priceRange.min || price > filters.priceRange.max) {
        return false;
      }
    }
    if (filters.isActive !== undefined && item.is_active !== filters.isActive) {
      return false;
    }
    return true;
  });
}

function sortMenuItems(items, sortBy, sortOrder = 'asc') {
  return [...items].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'price':
        aValue = a.price || 0;
        bValue = b.price || 0;
        break;
      case 'created_at':
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
        break;
      default:
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
    }
    
    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
}

function searchMenuItems(items, query) {
  if (!query || query.trim() === '') {
    return items;
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  return items.filter(item => {
    const name = (item.name || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const searchText = (item.search_text || '').toLowerCase();
    
    return name.includes(searchTerm) || 
           description.includes(searchTerm) || 
           searchText.includes(searchTerm);
  });
}

function processImageUrls(items) {
  return items.map(item => {
    if (item.photo_url) {
      // Add responsive image URLs
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
}
