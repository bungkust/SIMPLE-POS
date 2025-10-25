import * as React from "react";
import DatePicker from "react-datepicker";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

interface FormDatePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  value?: string;
  onChange?: (date: string) => void;
  minDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const FormDatePicker = React.forwardRef<HTMLDivElement, FormDatePickerProps>(
  ({ 
    label, 
    error, 
    helperText, 
    required, 
    value, 
    onChange, 
    minDate, 
    disabled, 
    placeholder = "Select date",
    className 
  }, ref) => {
    const inputId = `date-picker-${Math.random().toString(36).substr(2, 9)}`;
    
    // Convert string value to Date object
    const selectedDate = value ? new Date(value) : null;
    
    // Handle date change
    const handleDateChange = (date: Date | null) => {
      if (date && onChange) {
        // Convert Date to YYYY-MM-DD format
        const formattedDate = date.toISOString().split('T')[0];
        onChange(formattedDate);
      } else if (onChange) {
        onChange('');
      }
    };

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={inputId} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
            {label}
          </Label>
        )}
        <div className="relative">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            minDate={minDate}
            disabled={disabled}
            placeholderText={placeholder}
            dateFormat="yyyy-MM-dd"
            showPopperArrow={false}
            popperClassName="react-datepicker-popper"
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:bg-gray-50 focus:bg-white transition-colors pr-10",
              error && "border-destructive focus-visible:ring-destructive"
            )}
            wrapperClassName="w-full"
            id={inputId}
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

FormDatePicker.displayName = "FormDatePicker";

export { FormDatePicker };
