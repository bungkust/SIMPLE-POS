import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, MoreHorizontal, AlertCircle, CheckCircle, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  expandable?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
  actions?: React.ReactNode;
  status?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    iconOnly?: boolean;
  };
  subtitle?: string;
  summary?: string; // Summary text when collapsed
  expandedContent?: React.ReactNode; // Content to show when expanded
  icon?: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function MobileCard({
  children,
  className,
  onClick,
  expandable = false,
  expanded = false,
  onExpand,
  actions,
  status,
  subtitle,
  summary,
  expandedContent,
  icon,
  onSwipeLeft,
  onSwipeRight,
}: MobileCardProps) {
  const { swipeState, handlers } = useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    threshold: 50,
  });

  const getStatusIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case 'paid':
      case 'selesai':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'diproses':
      case 'sedang diproses':
        return <Clock className="h-3 w-3 text-blue-600" />;
      case 'cancelled':
        return <X className="h-3 w-3 text-red-600" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400" />;
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md max-w-full overflow-hidden",
        onClick && "cursor-pointer hover:bg-muted/50",
        swipeState.isSwiping && "transform-gpu",
        className
      )}
      onClick={onClick}
      {...handlers}
    >
      <CardHeader className="pb-1 px-2 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {icon && (
              <div className="flex-shrink-0 mt-0.5">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {/* Baris 1: Nama pelanggan + status */}
              <div className="flex items-center gap-2 mb-1">
                <div className="text-base font-semibold text-foreground truncate flex-1">
                  {children}
                </div>
                {status && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {getStatusIcon(status.label)}
                    <span className="text-xs font-medium">
                      {status.label}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Baris 2: Kode order + total */}
              {subtitle && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {actions && (
              <div className="flex items-center gap-0.5">
                {actions}
              </div>
            )}
            
            {expandable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand?.();
                }}
                className="h-8 w-8 p-0"
              >
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expanded && "rotate-90"
                  )} 
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Expanded content */}
      {expandable && expanded && expandedContent && (
        <CardContent className="pt-0 px-2 pb-3 w-full">
          <div className="border-t border-border/50 pt-3 w-full">
            {expandedContent}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface MobileCardListProps {
  children: React.ReactNode;
  className?: string;
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
  };
}

export function MobileCardList({ 
  children, 
  className,
  emptyState 
}: MobileCardListProps) {
  const isEmpty = React.Children.count(children) === 0;
  
  if (isEmpty && emptyState) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 text-muted-foreground mx-auto mb-4">
          {emptyState.icon}
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {emptyState.title}
        </h3>
        <p className="text-muted-foreground mb-4">
          {emptyState.description}
        </p>
        {emptyState.action}
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-3", className)}>
      {children}
    </div>
  );
}

interface MobileCardActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardActions({ children, className }: MobileCardActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-8 w-8 p-0", className)}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { MobileCardActions as MobileCardActionItem };
