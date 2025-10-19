import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";
import { AdvancedTable } from "@/components/ui/advanced-table";
import { MobileCard, MobileCardList } from "@/components/ui/mobile-card";
import { Loader2 } from "lucide-react";

interface ResponsiveTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showColumnToggle?: boolean;
  showExport?: boolean;
  onExport?: () => void;
  className?: string;
  pageSize?: number;
  // Mobile-specific props
  mobileCardConfig?: {
    primaryField: keyof TData;
    secondaryField?: keyof TData;
    statusField?: keyof TData;
    statusConfig?: {
      getStatus: (item: TData) => { label: string; variant?: "default" | "secondary" | "destructive" | "outline" };
    };
    iconField?: keyof TData;
    iconConfig?: {
      getIcon: (item: TData) => React.ReactNode;
    };
    subtitleField?: keyof TData;
    getSubtitle?: (item: TData) => string;
    getSummary?: (item: TData) => string;
    expandable?: boolean;
    getExpandedContent?: (item: TData) => React.ReactNode;
    getActions?: (item: TData) => React.ReactNode;
  };
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
  };
}

export function ResponsiveTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  showSearch = true,
  showColumnToggle = true,
  showExport = false,
  onExport,
  className,
  pageSize = 10,
  mobileCardConfig,
  emptyState,
}: ResponsiveTableProps<TData, TValue>) {
  const isMobile = useIsMobile();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);

  // Debounce search term
  React.useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter data based on debounced search term
  const filteredData = React.useMemo(() => {
    if (!debouncedSearchTerm || !searchKey) return data;
    
    return data.filter((item) => {
      const value = (item as any)[searchKey];
      return value?.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    });
  }, [data, debouncedSearchTerm, searchKey]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Desktop view - use existing AdvancedTable
  if (!isMobile) {
    return (
      <AdvancedTable
        columns={columns}
        data={filteredData}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        showSearch={showSearch}
        showColumnToggle={showColumnToggle}
        showExport={showExport}
        onExport={onExport}
        className={className}
        pageSize={pageSize}
      />
    );
  }

  // Mobile view - card-based layout
  if (!mobileCardConfig) {
    // Fallback to simple list if no mobile config provided
    return (
      <div className={cn("space-y-3", className)}>
        {showSearch && searchKey && (
          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            />
          </div>
        )}
        <MobileCardList emptyState={emptyState}>
          {filteredData.map((item, index) => (
            <MobileCard key={index}>
              <div className="text-sm">
                {JSON.stringify(item, null, 2)}
              </div>
            </MobileCard>
          ))}
        </MobileCardList>
      </div>
    );
  }

  const {
    primaryField,
    statusField,
    statusConfig,
    iconField,
    iconConfig,
    subtitleField,
    getSubtitle,
    getSummary,
    expandable = false,
    getExpandedContent,
    getActions,
  } = mobileCardConfig;

  return (
    <div className={cn("space-y-3 max-w-full overflow-hidden", className)}>
      {/* Search bar for mobile */}
      {showSearch && searchKey && (
        <div className="relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pr-8 border border-input rounded-md bg-background text-sm"
          />
          {isSearching && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 px-1 sm:px-2 w-full max-w-full overflow-hidden">
        {filteredData.map((item, index) => {
          const itemId = `item-${index}`;
          const isExpanded = expandedItems.has(itemId);
          
          const primaryValue = (item as any)[primaryField];
          const status = statusField && statusConfig ? statusConfig.getStatus(item) : undefined;
          const icon = iconField && iconConfig ? iconConfig.getIcon(item) : null;
          const subtitle = subtitleField ? (item as any)[subtitleField] : getSubtitle?.(item);
          const summary = getSummary ? getSummary(item) : undefined;
          const expandedContent = getExpandedContent ? getExpandedContent(item) : undefined;

          return (
            <MobileCard
              key={index}
              expandable={expandable}
              expanded={isExpanded}
              onExpand={() => toggleExpanded(itemId)}
              status={status}
              subtitle={subtitle}
              summary={summary}
              expandedContent={expandedContent}
              icon={icon}
              actions={getActions ? getActions(item) : undefined}
              className="w-full max-w-full"
              onSwipeLeft={() => {
                // Swipe left: View details
                console.log('Swipe left - View details:', item);
              }}
              onSwipeRight={() => {
                // Swipe right: Cancel (with confirmation)
                console.log('Swipe right - Cancel:', item);
              }}
            >
              {primaryValue}
            </MobileCard>
          );
        })}
      </div>
    </div>
  );
}

// Utility function to create mobile card config for common table types
export function createMobileCardConfig<TData>(config: {
  primaryField: keyof TData;
  secondaryField?: keyof TData;
  statusField?: keyof TData;
  statusMap?: Record<string, { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }>;
  iconField?: keyof TData;
  iconMap?: Record<string, React.ReactNode>;
  iconConfig?: {
    getIcon: (item: TData) => React.ReactNode;
  };
  subtitleField?: keyof TData;
  getSubtitle?: (item: TData) => string;
  expandable?: boolean;
  getExpandedContent?: (item: TData) => React.ReactNode;
  getActions?: (item: TData) => React.ReactNode;
}) {
  return {
    primaryField: config.primaryField,
    secondaryField: config.secondaryField,
    statusField: config.statusField,
    statusConfig: config.statusField && config.statusMap ? {
      getStatus: (item: TData) => {
        const statusValue = (item as any)[config.statusField!];
        return config.statusMap![statusValue] || { label: statusValue };
      }
    } : undefined,
    iconField: config.iconField,
    iconConfig: config.iconConfig || (config.iconField && config.iconMap ? {
      getIcon: (item: TData) => {
        const iconValue = (item as any)[config.iconField!];
        return config.iconMap![iconValue] || null;
      }
    } : undefined),
    subtitleField: config.subtitleField,
    getSubtitle: config.getSubtitle,
    expandable: config.expandable,
    getExpandedContent: config.getExpandedContent,
    getActions: config.getActions,
  } as any;
}
