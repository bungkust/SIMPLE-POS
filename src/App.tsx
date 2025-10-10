import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { ConfigProvider } from './contexts/ConfigContext';
import { CartProvider } from './contexts/CartContext';
import { LandingPage } from './components/LandingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CheckoutPage } from './pages/CheckoutPage';
import { InvoicePage } from './pages/InvoicePage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { MenuBrowser } from './components/MenuBrowser';
import { CartBar } from './components/CartBar';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { SuperAdminLoginPage } from './pages/SuperAdminLoginPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { AuthProvider } from './contexts/AuthContext';
import { handleOAuthError } from './lib/auth-utils';
import AuthCallback from './pages/AuthCallback';

// Helper function to get current tenant slug from URL
const getCurrentTenantSlug = (): string => {
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(Boolean);

  // Check if path starts with tenant slug pattern (not admin, not other routes)
  if (pathParts.length >= 1 && !pathParts[0].includes('admin') && !pathParts[0].includes('login') && pathParts[0] !== 'checkout' && pathParts[0] !== 'orders' && pathParts[0] !== 'invoice' && pathParts[0] !== 'success') {
    return pathParts[0];
  }

  return 'kopipendekar'; // Default tenant
};

// Helper function to get order code from current URL
const getOrderCode = (): string => {
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(Boolean);

  // Look for order code in paths like /invoice/KP-251003-7W2B9I or /success/KP-251003-7W2B9I
  if (pathParts.length >= 2 && (pathParts[0] === 'invoice' || pathParts[0] === 'success')) {
    return pathParts[1];
  }

  return '';
};

// Wrapper components to handle props
function LandingPageWrapper() {
  return <LandingPage />;
}

function MenuPageWrapper() {
  return (
    <>
      <Header />
      <MenuBrowser />
      <CartBar />
    </>
  );
}

function CheckoutPageWrapper() {
  const navigate = useNavigate();
  return (
    <CheckoutPage
      onBack={() => navigate(`/${getCurrentTenantSlug()}`)}
      onSuccess={(orderCode: string) => navigate(`/${getCurrentTenantSlug()}/success/${orderCode}`)}
    />
  );
}

function OrderHistoryPageWrapper() {
  const navigate = useNavigate();
  return <OrderHistoryPage onBack={() => navigate(`/${getCurrentTenantSlug()}`)} onViewInvoice={(orderCode: string) => navigate(`/${getCurrentTenantSlug()}/invoice/${orderCode}`)} />;
}

function InvoicePageWrapper() {
  const { orderCode } = useParams<{ orderCode: string }>();
  const navigate = useNavigate();
  return <InvoicePage orderCode={orderCode || ''} onBack={() => navigate(`/${getCurrentTenantSlug()}`)} />;
}

function OrderSuccessPageWrapper() {
  const { orderCode } = useParams<{ orderCode: string }>();
  const navigate = useNavigate();
  return <OrderSuccessPage
    orderCode={orderCode || ''}
    onViewInvoice={() => navigate(`/${getCurrentTenantSlug()}/invoice/${orderCode}`)}
    onBackToMenu={() => navigate(`/${getCurrentTenantSlug()}`)}
  />;
}

function SuperAdminLoginPageWrapper() {
  const navigate = useNavigate();
  return <SuperAdminLoginPage onBack={() => navigate('/')} />;
}

function AdminLoginPageWrapper() {
  const navigate = useNavigate();
  return <AdminLoginPage onBack={() => navigate('/')} />;
}

function SuperAdminDashboardWrapper() {
  const navigate = useNavigate();
  return (
    <ProtectedRoute requireSuperAdmin={true}>
      <SuperAdminDashboard onBack={() => navigate('/super-admin/login')} />
    </ProtectedRoute>
  );
}

function AdminDashboardWrapper() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function App() {
  // Handle OAuth errors on app startup
  React.useEffect(() => {
    handleOAuthError();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <ConfigProvider>
          <CartProvider>
            <div className="min-h-screen bg-slate-50">
              <Routes>
                {/* Public Routes - Landing Page and Customer Interface */}
                <Route path="/" element={<LandingPageWrapper />} />
                <Route path="/:tenantSlug" element={<MenuPageWrapper />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/:tenantSlug/checkout" element={<CheckoutPageWrapper />} />
                <Route path="/:tenantSlug/orders" element={<OrderHistoryPageWrapper />} />
                <Route path="/:tenantSlug/invoice/:orderCode" element={<InvoicePageWrapper />} />
                <Route path="/:tenantSlug/success/:orderCode" element={<OrderSuccessPageWrapper />} />

                {/* Legacy routes - redirect to tenant-specific versions */}
                <Route path="/checkout" element={<Navigate to={`/${getCurrentTenantSlug()}/checkout`} replace />} />
                <Route path="/orders" element={<Navigate to={`/${getCurrentTenantSlug()}/orders`} replace />} />
                <Route path="/invoice/:orderCode" element={<Navigate to={`/${getCurrentTenantSlug()}/invoice/${getOrderCode()}`} replace />} />
                <Route path="/success/:orderCode" element={<Navigate to={`/${getCurrentTenantSlug()}/success/${getOrderCode()}`} replace />} />

                {/* Admin Routes - Following Test Login pattern */}
                <Route path="/login" element={
                  <AuthProvider>
                    <AdminLoginPageWrapper />
                  </AuthProvider>
                } />
                <Route path="/super-admin/login" element={
                  <AuthProvider>
                    <SuperAdminLoginPageWrapper />
                  </AuthProvider>
                } />
                <Route path="/super-admin/dashboard" element={
                  <AuthProvider>
                    <SuperAdminDashboardWrapper />
                  </AuthProvider>
                } />
                <Route path="/:tenantSlug/dashboard" element={
                  <AuthProvider>
                    <AdminDashboardWrapper />
                  </AuthProvider>
                } />

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </CartProvider>
        </ConfigProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;