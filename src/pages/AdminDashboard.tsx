import { useState } from 'react';
import { LogOut, ShoppingBag, Coffee, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OrdersTab } from '../components/admin/OrdersTab';
import { MenuTab } from '../components/admin/MenuTab';
import { PaymentTab } from '../components/admin/PaymentTab';

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'payment'>('orders');
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      onBack();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Keluar</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pesanan</span>
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'menu'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'payment'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Pembayaran</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'menu' && <MenuTab />}
        {activeTab === 'payment' && <PaymentTab />}
      </div>
    </div>
  );
}