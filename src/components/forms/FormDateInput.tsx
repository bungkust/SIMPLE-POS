import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface FormDateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const FormDateInput = React.forwardRef<HTMLInputElement, FormDateInputProps>(
  ({ className, label, error, helperText, required, id, ...props }, ref) => {
    const inputId = id || `date-input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={inputId} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
            {label}
          </Label>
        )}
        <div className="relative">
          <Input
            id={inputId}
            type="date"
            className={cn(
              "cursor-pointer hover:bg-gray-50 focus:bg-white transition-colors pr-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-moz-calendar-picker-indicator]:hidden",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

FormDateInput.displayName = "FormDateInput";

export { FormDateInput };
