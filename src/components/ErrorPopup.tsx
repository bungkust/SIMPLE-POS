import { useState, useEffect } from 'react';
import { X, AlertCircle, Mail, Copy, ExternalLink } from 'lucide-react';

interface ErrorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  error: {
    title: string;
    message: string;
    details?: string;
    setupUrl?: string;
    ownerEmail?: string;
  };
}

export function ErrorPopup({ isOpen, onClose, error }: ErrorPopupProps) {
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{error.title}</h3>
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
          <p className="text-slate-700">{error.message}</p>
          
          {error.details && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm text-slate-600 font-mono">{error.details}</p>
            </div>
          )}

          {error.setupUrl && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Setup URL:</span>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-800 break-all">{error.setupUrl}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(error.setupUrl!)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy URL'}
                </button>
                
                <button
                  onClick={() => window.open(error.setupUrl, '_blank')}
                  className="flex items-center justify-center px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {error.ownerEmail && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Owner Email:</strong> {error.ownerEmail}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Silakan kirim setup URL secara manual ke email ini.
              </p>
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
