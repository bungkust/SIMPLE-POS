import React, { useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Card } from '@/components/ui/card';
import { Package, Plus, Minus } from 'lucide-react';
import { getMediumImageUrl, getResponsiveImageSize } from '../lib/image-utils';
import { colors, typography, components, sizes, shadows, cn } from '@/lib/design-system';
import { formatCurrency } from '@/lib/form-utils';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  base_price?: number;
  photo_url?: string;
  is_active?: boolean;
}

interface VirtualizedMenuGridProps {
  items: MenuItem[];
  getItemQuantity: (id: string) => number;
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
  onItemClick: (item: MenuItem) => void;
  containerWidth: number;
  containerHeight: number;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    items: MenuItem[];
    columnsPerRow: number;
    getItemQuantity: (id: string) => number;
    addItem: (item: any) => void;
    removeItem: (id: string) => void;
    onItemClick: (item: MenuItem) => void;
  };
}

const GridItem = React.memo(({ columnIndex, rowIndex, style, data }: GridItemProps) => {
  const { items, columnsPerRow, getItemQuantity, addItem, removeItem, onItemClick } = data;
  const itemIndex = rowIndex * columnsPerRow + columnIndex;
  const item = items[itemIndex];

  if (!item) {
    return <div style={style} />;
  }

  const quantity = getItemQuantity(item.id);
  const isAdding = quantity > 0;

  return (
    <div style={style} className="p-2">
      <Card
        className={cn(
          components.card,
          "overflow-hidden cursor-pointer transition-all duration-200 ease-in-out h-full",
          shadows.md,
          isAdding ? "ring-2 ring-primary" : "hover:shadow-lg"
        )}
        onClick={() => onItemClick(item)}
      >
        <div className="relative w-full h-48">
          {item.photo_url ? (
            <img
              src={getMediumImageUrl(item.photo_url, getResponsiveImageSize())}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png';
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {item.is_active === false && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className={cn(typography.body.large, colors.text.white, "font-semibold")}>
                Unavailable
              </span>
            </div>
          )}
        </div>
        <div className={cn(components.cardContent, "p-4 flex flex-col justify-between flex-grow")}>
          <div>
            <h3 className={cn(typography.h5, "mb-1")}>{item.name}</h3>
            <p className={cn(typography.body.small, colors.text.muted, "line-clamp-2 mb-2")}>
              {item.description}
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <span className={cn(typography.h5, colors.text.primary)}>
              {formatCurrency(item.price || 0)}
            </span>
            <div className="flex justify-end">
              {quantity > 0 ? (
                <div className="flex items-center gap-2">
                  <button 
                    className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center font-medium text-sm">{quantity}</span>
                  <button 
                    className="w-7 h-7 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem({
                        id: item.id,
                        name: item.name,
                        price: item.price || 0,
                        qty: 1,
                        photo_url: item.photo_url,
                        menu_id: item.id
                      });
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button 
                  className="w-7 h-7 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem({
                      id: item.id,
                      name: item.name,
                      price: item.price || 0,
                      qty: 1,
                      photo_url: item.photo_url,
                      menu_id: item.id
                    });
                  }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

GridItem.displayName = 'GridItem';

export const VirtualizedMenuGrid = React.memo(({
  items,
  getItemQuantity,
  addItem,
  removeItem,
  onItemClick,
  containerWidth,
  containerHeight
}: VirtualizedMenuGridProps) => {
  // Calculate grid dimensions
  const itemWidth = 300; // Fixed item width
  const itemHeight = 400; // Fixed item height
  const columnsPerRow = Math.floor(containerWidth / itemWidth) || 1;
  const rowCount = Math.ceil(items.length / columnsPerRow);

  const gridData = useMemo(() => ({
    items,
    columnsPerRow,
    getItemQuantity,
    addItem,
    removeItem,
    onItemClick
  }), [items, columnsPerRow, getItemQuantity, addItem, removeItem, onItemClick]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className={cn(typography.body.large, colors.text.muted)}>No menu items found.</p>
      </div>
    );
  }

  return (
    <Grid
      columnCount={columnsPerRow}
      columnWidth={itemWidth}
      height={containerHeight}
      rowCount={rowCount}
      rowHeight={itemHeight}
      width={containerWidth}
      itemData={gridData}
    >
      {GridItem}
    </Grid>
  );
});

VirtualizedMenuGrid.displayName = 'VirtualizedMenuGrid';
