import { useState, useEffect } from 'react';
import { X, CheckCircle, Copy, ExternalLink, Mail, User, Key, Globe } from 'lucide-react';

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    message: string;
    details?: {
      email?: string;
      password?: string;
      url?: string;
      setupUrl?: string;
      ownerEmail?: string;
    };
    type?: 'success' | 'info' | 'warning';
  };
}

export function SuccessPopup({ isOpen, onClose, data }: SuccessPopupProps) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  const getIcon = () => {
    switch (data.type) {
      case 'warning':
        return <CheckCircle className="w-5 h-5 text-amber-600" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getBgColor = () => {
    switch (data.type) {
      case 'warning':
        return 'bg-amber-100';
      case 'info':
        return 'bg-blue-100';
      default:
        return 'bg-green-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${getBgColor()} rounded-lg`}>
              {getIcon()}
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{data.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-700">{data.message}</p>
          
          {data.details && (
            <div className="space-y-3">
              {/* Email */}
              {data.details.email && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Email:</span>
                  </div>
                  <p className="text-sm text-slate-800">{data.details.email}</p>
                </div>
              )}

              {/* Password */}
              {data.details.password && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Password:</span>
                  </div>
                  <p className="text-sm text-slate-800 font-mono">{data.details.password}</p>
                </div>
              )}

              {/* Login URL */}
              {data.details.url && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Login URL:</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-blue-800 break-all">{data.details.url}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(data.details.url!, 'url')}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copied === 'url' ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
              )}

              {/* Setup URL */}
              {data.details.setupUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Setup URL:</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-blue-800 break-all">{data.details.setupUrl}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(data.details.setupUrl!, 'setup')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      {copied === 'setup' ? 'Copied!' : 'Copy URL'}
                    </button>
                    <button
                      onClick={() => window.open(data.details.setupUrl, '_blank')}
                      className="flex items-center justify-center px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Owner Email */}
              {data.details.ownerEmail && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Owner Email:</span>
                  </div>
                  <p className="text-sm text-amber-800">{data.details.ownerEmail}</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Silakan kirim setup URL secara manual ke email ini.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
