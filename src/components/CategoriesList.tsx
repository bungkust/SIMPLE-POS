/**
 * Categories List Component with Infinite Scroll
 * Displays categories with pagination and infinite scroll
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAllFetchedCategories } from '@/hooks/use-categories-infinite';
import { cn } from '@/lib/design-system';

interface CategoriesListProps {
  tenantId: string;
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  className?: string;
}

export const CategoriesList: React.FC<CategoriesListProps> = ({
  tenantId,
  selectedCategory,
  onCategorySelect,
  className
}) => {
  const {
    allCategories,
    totalCount,
    hasMore,
    isLoading,
    isFetchingNextPage,
    loadMore,
    error
  } = useAllFetchedCategories(tenantId, 20);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer untuk infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isFetchingNextPage) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, isFetchingNextPage, loadMore]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    onCategorySelect(categoryId);
  }, [onCategorySelect]);

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">Error loading categories</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (allCategories.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No categories found</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Categories Grid */}
      <div className="flex flex-wrap gap-2">
        {/* All Categories Button */}
        <Badge
          variant={!selectedCategory ? "default" : "outline"}
          onClick={() => handleCategoryClick('')}
          className={cn(
            "cursor-pointer transition-colors",
            !selectedCategory 
              ? "bg-primary text-primary-foreground" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          All
        </Badge>

        {/* Category Buttons */}
        {allCategories.map((category) => (
          <Badge
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => handleCategoryClick(category.id)}
            className={cn(
              "cursor-pointer transition-colors",
              selectedCategory === category.id 
                ? "bg-primary text-primary-foreground" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {category.name}
          </Badge>
        ))}
      </div>

      {/* Load More Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-2">
          {isFetchingNextPage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <div className="text-xs text-gray-500">
              Scroll to load more categories
            </div>
          )}
        </div>
      )}

      {/* Categories Count */}
      <div className="text-center text-xs text-gray-500">
        Showing {allCategories.length} of {totalCount} categories
      </div>
    </div>
  );
};
