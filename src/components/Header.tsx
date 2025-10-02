import { Coffee, History, LogIn } from 'lucide-react';

interface HeaderProps {
  onHistoryClick: () => void;
  onAdminClick: () => void;
}

export function Header({ onHistoryClick, onAdminClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="w-6 h-6 text-green-500" />
          <h1 className="text-xl font-bold text-slate-900">Kopi Pendekar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onHistoryClick}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <History className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">Riwayat</span>
          </button>
          <button
            onClick={onAdminClick}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <LogIn className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">Login</span>
          </button>
        </div>
      </div>
    </header>
  );
}