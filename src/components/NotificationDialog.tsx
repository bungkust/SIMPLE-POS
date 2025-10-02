import { useState } from 'react';
import { CheckCircle, XCircle, X, AlertTriangle } from 'lucide-react';

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export function NotificationDialog({
  isOpen,
  onClose,
  title,
  message,
  type
}: NotificationDialogProps) {
  if (!isOpen) return null;

  const typeStyles = {
    success: {
      bg: 'bg-green-500',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      buttonBg: 'bg-green-500 hover:bg-green-600'
    },
    error: {
      bg: 'bg-red-500',
      icon: XCircle,
      iconColor: 'text-red-500',
      buttonBg: 'bg-red-500 hover:bg-red-600'
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600'
    },
    info: {
      bg: 'bg-blue-500',
      icon: AlertTriangle,
      iconColor: 'text-blue-500',
      buttonBg: 'bg-blue-500 hover:bg-blue-600'
    }
  };

  const currentStyle = typeStyles[type];
  const IconComponent = currentStyle.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <IconComponent className={`w-6 h-6 ${currentStyle.iconColor}`} />
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 mb-6">{message}</p>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 ${currentStyle.buttonBg} text-white rounded-lg transition-colors`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
