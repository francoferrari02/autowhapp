import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { NegocioProvider, useNegocio } from './NegocioContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ConfigPage from './pages/ConfigPage';
import OrdersPage from './pages/OrdersPage';
import AddBusinessPage from './pages/AddBusinessPage';
import ReservationsPage from './pages/ReservationsPage';
import RemindersPage from './pages/RemindersPage';
import AnalyticsPage from './pages/MockAnalyticsPage';
import LandingPage from './pages/LandingPage';
import PaymentsPage from './pages/Payments';
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

const getSelectedTab = (path: string): 'config' | 'orders' | 'analytics' | 'reservations' | 'reminders' => {
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
    default:
      return 'config';
  }
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth0();
  const { negocios, setNegocioId, refreshNegocios } = useNegocio();
  const prevIsAuth = useRef<boolean>(false);

  useEffect(() => {
    // Solo redirigir si el login fue iniciado con nuestro botón
    const justLoggedIn = window.localStorage.getItem('justLoggedIn') === 'true';

    if (!isLoading && isAuthenticated && !prevIsAuth.current && justLoggedIn) {
      // Limpiamos el flag
      window.localStorage.removeItem('justLoggedIn');

      // Refrescamos y redirigimos según negocio
      refreshNegocios()
        .then(() => {
          if (negocios.length === 0) {
            navigate('/add-business', { replace: true });
          } else {
            setNegocioId(negocios[0].id);
            navigate('/config', { replace: true });
          }
        })
        .catch(console.error);
    }

    prevIsAuth.current = isAuthenticated;
  }, [isAuthenticated, isLoading, negocios, refreshNegocios, setNegocioId, navigate]);

  const selectedTab = getSelectedTab(location.pathname);
  const isLandingPage = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      {!isLandingPage && <Header />}
      <div className="flex flex-grow">
        {!isLandingPage && <Sidebar selected={selectedTab} />}
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/config" element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/add-business" element={<ProtectedRoute><AddBusinessPage /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><ReservationsPage /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="*" element={<div>404 - Página no encontrada</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <NegocioProvider>
    <Router>
      <AppContent />
    </Router>
  </NegocioProvider>
);

export default App;