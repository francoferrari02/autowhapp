// App.tsx

import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { NegocioProvider, useNegocio } from './NegocioContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import ConfigPage from './pages/ConfigPage';
import OrdersPage from './pages/OrdersPage';
import AddBusinessPage from './pages/AddBusinessPage';
import ReservationsPage from './pages/ReservationsPage';
import RemindersPage from './pages/RemindersPage';
import AnalyticsPage from './pages/MockAnalyticsPage';
import LandingPage from './pages/LandingPage';
import PaymentsPage from './pages/Payments';
import theme from './theme';
import './index.css';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Cargando...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const getSelectedTab = (path: string): 'config' | 'orders' | 'analytics' | 'reservations' | 'reminders' | 'payments' => {
  const route = path.split('/')[1] || 'config';
  switch (route) {
    case 'config':
    case 'dashboard':
      return 'config';
    case 'orders':
      return 'orders';
    case 'analytics':
      return 'analytics';
    case 'reservations':
      return 'reservations';
    case 'reminders':
      return 'reminders';
    case 'payments':
      return 'payments';
    default:
      return 'config';
  }
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth0();
  const { negocio, setNegocioId, refreshNegocio } = useNegocio();
  const prevIsAuth = useRef<boolean>(false);

  useEffect(() => {
    const justLoggedIn = window.localStorage.getItem('justLoggedIn') === 'true';

    if (!isLoading && isAuthenticated && !prevIsAuth.current && justLoggedIn) {
      window.localStorage.removeItem('justLoggedIn');

      refreshNegocio()
        .then((negocio) => {
          if (!negocio) {
            navigate('/add-business', { replace: true });
          } else {
            setNegocioId(negocio.id);
            navigate('/config', { replace: true });
          }
        })
        .catch((error) => {
          console.error('Error al refrescar negocio:', error);
          navigate('/add-business', { replace: true });
        });
    }

    prevIsAuth.current = isAuthenticated;
  }, [isAuthenticated, isLoading, refreshNegocio, setNegocioId, navigate]);

  const selectedTab = getSelectedTab(location.pathname);
  const isLandingPage = location.pathname === '/';
  const isAddBusinessPage = location.pathname === '/add-business';
  const shouldShowSidebar = !isLandingPage && !isAddBusinessPage;

  return (
    <div className="flex flex-col bg-[#000000]" style={{ minHeight: '100vh' }}>
      <ScrollToTop />
      {!isLandingPage && <Header />}
      <div className="flex flex-grow bg-[#000000]">
        {shouldShowSidebar && <Sidebar selected={selectedTab} />}
        <div className={`flex-grow bg-[#000000] ${shouldShowSidebar ? 'ml-52' : ''}`} style={{ minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/config" element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/add-business" element={<ProtectedRoute><AddBusinessPage /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><ReservationsPage /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
            <Route path="*" element={<div>404 - Página no encontrada</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <NegocioProvider>
      <Router>
        <AppContent />
      </Router>
    </NegocioProvider>
  </ThemeProvider>
);

export default App;
