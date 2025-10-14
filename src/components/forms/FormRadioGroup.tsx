import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface FormRadioGroupProps {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
}

const FormRadioGroup = React.forwardRef<HTMLDivElement, FormRadioGroupProps>(
  ({ label, error, helperText, value, onValueChange, disabled, id, options, ...props }, ref) => {
    const radioGroupId = id || `radio-group-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-3">
        {label && (
          <Label className={cn(error && "text-destructive")}>
            {label}
          </Label>
        )}
        <RadioGroup
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value}
                id={`${radioGroupId}-${option.value}`}
                disabled={option.disabled || disabled}
              />
              <Label
                htmlFor={`${radioGroupId}-${option.value}`}
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  (option.disabled || disabled) && "cursor-not-allowed opacity-70"
                )}
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
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

FormRadioGroup.displayName = "FormRadioGroup";

export { FormRadioGroup };
