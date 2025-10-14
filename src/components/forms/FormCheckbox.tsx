import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormCheckboxProps {
  label?: string;
  error?: string;
  helperText?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

const FormCheckbox = React.forwardRef<HTMLButtonElement, FormCheckboxProps>(
  ({ label, error, helperText, checked, onCheckedChange, disabled, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            ref={ref}
            {...props}
          />
          {label && (
            <Label
              htmlFor={checkboxId}
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                error && "text-destructive"
              )}
            >
              {label}
            </Label>
          )}
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

FormCheckbox.displayName = "FormCheckbox";

export { FormCheckbox };
