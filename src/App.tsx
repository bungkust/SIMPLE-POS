import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { MenuBrowser } from './components/MenuBrowser';
import { CartBar } from './components/CartBar';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { InvoicePage } from './pages/InvoicePage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';

type Page =
  | { type: 'home' }
  | { type: 'checkout' }
  | { type: 'success'; orderCode: string }
  | { type: 'invoice'; orderCode: string }
  | { type: 'history' }
  | { type: 'admin-login' }
  | { type: 'admin-dashboard' };

function AppContent() {
  const [page, setPage] = useState<Page>({ type: 'home' });
  const { isAdmin } = useAuth();

  const handleCheckout = () => {
    setPage({ type: 'checkout' });
  };

  const handleOrderSuccess = (orderCode: string) => {
    setPage({ type: 'success', orderCode });
  };

  const handleViewInvoice = (orderCode: string) => {
    setPage({ type: 'invoice', orderCode });
  };

  const handleBackToHome = () => {
    setPage({ type: 'home' });
  };

  const handleHistoryClick = () => {
    setPage({ type: 'history' });
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      setPage({ type: 'admin-dashboard' });
    } else {
      setPage({ type: 'admin-login' });
    }
  };

  if (page.type === 'checkout') {
    return <CheckoutPage onBack={handleBackToHome} onSuccess={handleOrderSuccess} />;
  }

  if (page.type === 'success') {
    return (
      <OrderSuccessPage
        orderCode={page.orderCode}
        onViewInvoice={() => handleViewInvoice(page.orderCode)}
        onBackToMenu={handleBackToHome}
      />
    );
  }

  if (page.type === 'invoice') {
    return <InvoicePage orderCode={page.orderCode} onBack={handleBackToHome} />;
  }

  if (page.type === 'history') {
    return <OrderHistoryPage onBack={handleBackToHome} onViewInvoice={handleViewInvoice} />;
  }

  if (page.type === 'admin-login') {
    return <AdminLoginPage onBack={handleBackToHome} />;
  }

  if (page.type === 'admin-dashboard') {
    return <AdminDashboard onBack={handleBackToHome} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onHistoryClick={handleHistoryClick} onAdminClick={handleAdminClick} />
      <MenuBrowser />
      <CartBar onCheckout={handleCheckout} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;