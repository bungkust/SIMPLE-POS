import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

// Hook untuk menggunakan toast dengan mudah
export function useAppToast() {
  const { toast } = useToast();

  const showSuccess = React.useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  }, [toast]);

  const showError = React.useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }, [toast]);

  const showInfo = React.useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  }, [toast]);

  return {
    showSuccess,
    showError,
    showInfo,
    toast,
  };
}
