import { useState } from 'react';
import { X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  showTechnicalDetails?: boolean;
}

export function ErrorModal({
  isOpen,
  onClose,
  title = 'Error',
  message,
  details,
  onRetry,
  showTechnicalDetails = false
}: ErrorModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  // Function to clean technical error messages for users
  const getUserFriendlyMessage = (technicalDetails: string): string => {
    if (!technicalDetails) return '';

    // Common technical errors and their user-friendly versions
    if (technicalDetails.includes('onSuccess is not a function')) {
      return 'Terjadi kesalahan dalam pemrosesan. Silakan coba lagi.';
    }
    if (technicalDetails.includes('invalid input syntax for type uuid')) {
      return 'Data yang dimasukkan tidak valid. Silakan periksa kembali.';
    }
    if (technicalDetails.includes('violates row-level security policy')) {
      return 'Akses ditolak. Silakan hubungi administrator.';
    }
    if (technicalDetails.includes('duplicate key value')) {
      return 'Data sudah ada. Silakan gunakan data yang berbeda.';
    }
    if (technicalDetails.includes('foreign key constraint')) {
      return 'Data terkait tidak ditemukan. Silakan periksa kembali.';
    }
    if (technicalDetails.includes('network') || technicalDetails.includes('fetch')) {
      return 'Koneksi internet bermasalah. Silakan periksa koneksi Anda.';
    }

    // If no specific match, return a generic message
    return 'Terjadi kesalahan yang tidak dikenal. Silakan coba lagi atau hubungi dukungan teknis.';
  };

  const userFriendlyDetails = details ? getUserFriendlyMessage(details) : '';

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-slate-700 mb-3">{message}</p>

            {/* User-friendly error explanation */}
            {userFriendlyDetails && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">{userFriendlyDetails}</p>
              </div>
            )}

            {/* Technical details (collapsible) */}
            {details && showTechnicalDetails && (
              <div className="mb-3">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Detail Teknis
                </button>
                {showDetails && (
                  <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-xs text-slate-500 font-mono break-all">{details}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>
            {onRetry && (
              <button
                onClick={() => {
                  onRetry();
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Coba Lagi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
