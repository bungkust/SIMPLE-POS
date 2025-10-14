import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  details?: {
    email?: string;
    password?: string;
    url?: string;
    setupUrl?: string;
    ownerEmail?: string;
  };
  showCopyButton?: boolean;
  showExternalLink?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
};

export function ModernDialog({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  details,
  showCopyButton = false,
  showExternalLink = false,
  primaryAction,
  secondaryAction,
}: ModernDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const config = typeConfig[type];
  const IconComponent = config.icon;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getCopyText = () => {
    if (details?.setupUrl) return details.setupUrl;
    if (details?.url) return details.url;
    if (details?.email) return details.email;
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full", config.bgColor)}>
              <IconComponent className={cn("h-5 w-5", config.iconColor)} />
            </div>
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {message}
          </DialogDescription>
        </DialogHeader>

        {details && (
          <div className="space-y-4">
            {details.email && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email:</label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-sm">
                    {details.email}
                  </Badge>
                  {showCopyButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(details.email!)}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {details.password && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password:</label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-sm">
                    {details.password}
                  </Badge>
                  {showCopyButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(details.password!)}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {(details.setupUrl || details.url) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {details.setupUrl ? "Setup URL:" : "URL:"}
                </label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs flex-1 truncate">
                    {details.setupUrl || details.url}
                  </Badge>
                  {showCopyButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(getCopyText())}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                  {showExternalLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(details.setupUrl || details.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {details.ownerEmail && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Owner Email:</label>
                <Badge variant="outline" className="font-mono text-sm">
                  {details.ownerEmail}
                </Badge>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction ? (
            <Button onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          ) : (
            <Button onClick={onClose}>
              OK
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
