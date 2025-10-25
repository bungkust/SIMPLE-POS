import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import React, { Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfigProvider } from './contexts/ConfigContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { handleOAuthError } from './lib/auth-utils';
import { ToastProvider } from './components/ui/toast-provider';
import { Loader2 } from 'lucide-react';

// Import only critical components for initial load
import { Header } from './components/HeaderNew';
import { LandingPage } from './components/LandingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MenuBrowser } from './components/MenuBrowserNew';
import { CartBar } from './components/CartBarNew';
import AuthCallback from './pages/AuthCallback';

// Import components directly to avoid React error #306
import { CheckoutPage } from './pages/CheckoutPageNew';
import { InvoicePage } from './pages/InvoicePageNew';
import { OrderHistoryPage } from './pages/OrderHistoryPageNew';
import { OrderSuccessPage } from './pages/OrderSuccessPageNew';
import { AdminLoginPage } from './pages/AdminLoginPageNew';
import { AdminDashboard } from './pages/AdminDashboardNew';
import { SuperAdminLoginPage } from './pages/SuperAdminLoginPageNew';
import { SuperAdminDashboard } from './pages/SuperAdminDashboardNew';
import { TenantSetupPage } from './pages/TenantSetupPageNew';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Import test utilities in development
if (import.meta.env.DEV) {
  import('./utils/test-image-optimization');
}

// Helper function to get current tenant slug from URL
const getCurrentTenantSlug = (): string => {
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(Boolean);

  // Check if path starts with tenant slug pattern (not admin, not other routes)
  if (pathParts.length >= 1 && !pathParts[0].includes('admin') && !pathParts[0].includes('login') && pathParts[0] !== 'checkout' && pathParts[0] !== 'orders' && pathParts[0] !== 'invoice' && pathParts[0] !== 'success' && pathParts[0] !== 'undefined' && pathParts[0] !== 'null') {
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
    <Suspense fallback={<LoadingSpinner />}>
      <CheckoutPage
        onBack={() => navigate(`/${getCurrentTenantSlug()}`)}
        onSuccess={(orderCode: string) => navigate(`/${getCurrentTenantSlug()}/success/${orderCode}`)}
      />
    </Suspense>
  );
}

function OrderHistoryPageWrapper() {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OrderHistoryPage onBack={() => navigate(`/${getCurrentTenantSlug()}`)} onViewInvoice={(orderCode: string) => navigate(`/${getCurrentTenantSlug()}/invoice/${orderCode}`)} />
    </Suspense>
  );
}

function InvoicePageWrapper() {
  const { orderCode } = useParams<{ orderCode: string }>();
  const navigate = useNavigate();
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InvoicePage orderCode={orderCode || ''} onBack={() => navigate(`/${getCurrentTenantSlug()}`)} />
    </Suspense>
  );
}

function OrderSuccessPageWrapper() {
  const { orderCode } = useParams<{ orderCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user came from admin dashboard (kasir)
  // Priority: location.state.fromAdmin > referrer detection
  const isFromAdmin = location.state?.fromAdmin || 
                     (document.referrer && (
                       document.referrer.includes('/admin/dashboard') ||
                       document.referrer.includes('/admin')
                     ));
  
  console.log('🔍 OrderSuccess: Navigation detection:', {
    locationState: location.state,
    referrer: document.referrer,
    isFromAdmin: isFromAdmin,
    fromAdminState: location.state?.fromAdmin,
    referrerCheck: document.referrer ? {
      includesAdminDashboard: document.referrer.includes('/admin/dashboard'),
      includesAdmin: document.referrer.includes('/admin')
    } : 'No referrer'
  });
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OrderSuccessPage
        orderCode={orderCode || ''}
        isFromAdmin={isFromAdmin}
        onViewInvoice={() => navigate(`/${getCurrentTenantSlug()}/invoice/${orderCode}`)}
        onBackToMenu={() => {
          console.log('🔍 OrderSuccess: onBackToMenu called, isFromAdmin:', isFromAdmin);
          if (isFromAdmin) {
            console.log('🔍 OrderSuccess: Navigating to admin dashboard (kasir)');
            navigate(`/${getCurrentTenantSlug()}/admin/dashboard`, { 
              state: { activeTab: 'kasir' } 
            });
          } else {
            console.log('🔍 OrderSuccess: Navigating to menu browser');
            navigate(`/${getCurrentTenantSlug()}`);
          }
        }}
      />
    </Suspense>
  );
}

function SuperAdminLoginPageWrapper() {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SuperAdminLoginPage onBack={() => navigate('/')} />
    </Suspense>
  );
}

function AdminLoginPageWrapper() {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminLoginPage onBack={() => navigate('/')} />
    </Suspense>
  );
}

function SuperAdminDashboardWrapper() {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProtectedRoute requireSuperAdmin={true}>
        <SuperAdminDashboard onBack={() => navigate('/super-admin/login')} />
      </ProtectedRoute>
    </Suspense>
  );
}

function AdminDashboardWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProtectedRoute requireAdmin={true}>
        <AdminDashboard />
      </ProtectedRoute>
    </Suspense>
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
        <AuthProvider>
          <ConfigProvider>
            <CartProvider>
              <ToastProvider>
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
                <Route path="/login" element={<AdminLoginPageWrapper />} />
                <Route path="/super-admin/login" element={<SuperAdminLoginPageWrapper />} />
                <Route path="/super-admin/dashboard" element={<SuperAdminDashboardWrapper />} />
                <Route path="/:tenantSlug/admin/dashboard" element={<AdminDashboardWrapper />} />
                <Route path="/:tenantSlug/admin/setup" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <TenantSetupPage />
                  </Suspense>
                } />


                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
                </div>
              </ToastProvider>
            </CartProvider>
          </ConfigProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;