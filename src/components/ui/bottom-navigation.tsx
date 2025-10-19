import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-media-query";
import { 
  ShoppingBag, 
  Coffee, 
  Calculator, 
  Settings 
} from "lucide-react";

interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: number;
  disabled?: boolean;
}

interface BottomNavigationProps {
  items: BottomNavItem[];
  activeItem?: string;
  className?: string;
}

export function BottomNavigation({ 
  items, 
  activeItem, 
  className 
}: BottomNavigationProps) {
  const isMobile = useIsMobile();
  
  if (!isMobile) {
    return null;
  }
  
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg",
      "pb-safe-area-inset-bottom",
      className
    )}>
      <div className="flex items-center justify-around px-1 py-1 max-w-full overflow-hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={item.onClick}
              disabled={item.disabled}
                  className={cn(
                    "flex flex-col items-center gap-0.5 h-auto py-1.5 px-1 min-w-0 flex-1 max-w-[20%]",
                    "hover:bg-muted/50",
                    isActive && "text-primary bg-primary/10"
                  )}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-xs leading-tight",
                isActive ? "font-medium" : "font-normal"
              )}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}

// Hook to provide bottom navigation items for admin dashboard
export function useAdminBottomNav(activeTab?: string) {
  const isMobile = useIsMobile();
  
  const navItems: BottomNavItem[] = React.useMemo(() => [
    {
      id: 'orders',
      label: 'Pesanan',
      icon: ShoppingBag,
      onClick: () => {
        // This will be handled by the parent component
        window.dispatchEvent(new CustomEvent('admin-nav', { detail: 'orders' }));
      }
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Coffee,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('admin-nav', { detail: 'menu' }));
      }
    },
    {
      id: 'kasir',
      label: 'Kasir',
      icon: Calculator,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('admin-nav', { detail: 'kasir' }));
      }
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('admin-nav', { detail: 'settings' }));
      }
    }
  ], []);
  
  return {
    navItems,
    isMobile
  };
}
