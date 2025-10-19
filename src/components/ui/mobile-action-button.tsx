import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "secondary";
  size?: "sm" | "md";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function MobileActionButton({
  icon,
  label,
  onClick,
  variant = "default",
  size = "sm",
  disabled = false,
  loading = false,
  className,
}: MobileActionButtonProps) {
  const [showLabel, setShowLabel] = React.useState(false);

  const handlePress = () => {
    setShowLabel(true);
    setTimeout(() => setShowLabel(false), 1500);
    onClick();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return "text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-red-200";
      case "secondary":
        return "text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus:ring-blue-200";
      default:
        return "text-gray-600 hover:text-gray-700 hover:bg-gray-50 focus:ring-gray-200";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "md":
        return "h-10 w-10";
      default:
        return "h-9 w-9";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePress}
        disabled={disabled || loading}
        className={cn(
          getSizeStyles(),
          "p-0 rounded-full transition-all duration-200 focus:ring-2 focus:ring-offset-1 hover:shadow-md active:scale-95",
          getVariantStyles(),
          className
        )}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        ) : (
          icon
        )}
      </Button>
      
      {/* Mini label tooltip */}
      {showLabel && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
          {label}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

interface MobileActionGroupProps {
  actions: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "secondary";
    disabled?: boolean;
    loading?: boolean;
  }>;
  className?: string;
}

export function MobileActionGroup({ actions, className }: MobileActionGroupProps) {
  return (
    <div className={cn("flex items-center gap-0.5 flex-shrink-0", className)}>
      {actions.map((action, index) => (
        <MobileActionButton
          key={index}
          icon={action.icon}
          label={action.label}
          onClick={action.onClick}
          variant={action.variant}
          disabled={action.disabled}
          loading={action.loading}
        />
      ))}
    </div>
  );
}
