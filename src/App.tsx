import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { MenuBrowser } from './components/MenuBrowser';
import { CartBar } from './components/CartBar';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { InvoicePage } from './pages/InvoicePage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { CartProvider } from './contexts/CartContext';

// Wrapper components to handle props
function HomePage() {
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
  return <CheckoutPage onBack={() => navigate('/')} onSuccess={(orderCode) => navigate(`/success/${orderCode}`)} />;
}

function OrderHistoryPageWrapper() {
  const navigate = useNavigate();
  return <OrderHistoryPage onBack={() => navigate('/')} onViewInvoice={(orderCode) => navigate(`/invoice/${orderCode}`)} />;
}

function InvoicePageWrapper() {
  const { orderCode } = useParams<{ orderCode: string }>();
  const navigate = useNavigate();
  return <InvoicePage orderCode={orderCode!} onBack={() => navigate('/')} />;
}

function OrderSuccessPageWrapper() {
  const { orderCode } = useParams<{ orderCode: string }>();
  const navigate = useNavigate();
  return (
    <OrderSuccessPage
      orderCode={orderCode!}
      onViewInvoice={() => navigate(`/invoice/${orderCode}`)}
      onBackToMenu={() => navigate('/')}
    />
  );
}

function AdminLoginPageWrapper() {
  const navigate = useNavigate();
  return <AdminLoginPage onBack={() => navigate('/')} />;
}

function AdminDashboardWrapper() {
  const navigate = useNavigate();
  return <AdminDashboard onBack={() => navigate('/')} />;
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ConfigProvider>
          <AuthProvider>
            <CartProvider>
              <div className="min-h-screen bg-slate-50">
                <Routes>
                  {/* Public Routes - Regular Users */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/checkout" element={<CheckoutPageWrapper />} />
                  <Route path="/orders" element={<OrderHistoryPageWrapper />} />
                  <Route path="/invoice/:orderCode" element={<InvoicePageWrapper />} />
                  <Route path="/success/:orderCode" element={<OrderSuccessPageWrapper />} />

                  {/* Admin Routes - Protected */}
                  <Route path="/admin/login" element={
                    <ProtectedRoute requireAuth={true}>
                      <AdminLoginPageWrapper />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminDashboardWrapper />
                    </ProtectedRoute>
                  } />

                  {/* Catch all - redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </CartProvider>
          </AuthProvider>
        </ConfigProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;