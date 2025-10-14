import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "success" | "error" | "warning";
  children: React.ReactNode;
  className?: string;
}

const statusVariants = {
  active: "bg-green-100 text-green-800 hover:bg-green-200",
  inactive: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  success: "bg-green-100 text-green-800 hover:bg-green-200",
  error: "bg-red-100 text-red-800 hover:bg-red-200",
  warning: "bg-orange-100 text-orange-800 hover:bg-orange-200",
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(statusVariants[status], className)}
    >
      {children}
    </Badge>
  );
}
