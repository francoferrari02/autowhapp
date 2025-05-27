import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { NegocioProvider, useNegocio } from './NegocioContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ConfigPage from './pages/ConfigPage';
import OrdersPage from './pages/OrdersPage';
import AddBusinessPage from './pages/AddBusinessPage';
import ReservationsPage from './pages/ReservationsPage';
import RemindersPage from './pages/RemindersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import PaymentsPage from './pages/Payments';
import MockAnalyticsPage from './pages/MockAnalyticsPage';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Cargando...</p>
    </div>
  </div>
);

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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const selectedTab = getSelectedTab(location.pathname);
  const isLoginPage = location.pathname === '/';
  const isPricingPage = location.pathname === '/pricing';
  const { negocioId, negocios, setNegocioId } = useNegocio();
  const { isAuthenticated } = useAuth0();
  console.log('negocioId:', negocioId, 'negocios:', negocios);

  useEffect(() => {
    if (negocios.length === 1 && negocioId === null) {
      setNegocioId(negocios[0].id);
    }
  }, [negocios, negocioId, setNegocioId]);

  return (
    <div className="flex flex-col min-h-screen">
      {!isLoginPage && !isPricingPage && <Header />}
      <div className="flex flex-grow">
        {!isLoginPage && !isPricingPage && <Sidebar selected={selectedTab} />}
        <div className="flex-grow">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              }
            />
            <Route
              path="/pricing"
              element={<PricingPage />}
            />
            <Route
              path="/config"
              element={
                <ProtectedRoute>
                  <ConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-business"
              element={
                <ProtectedRoute>
                  <AddBusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute>
                  <ReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reminders"
              element={
                <ProtectedRoute>
                  <RemindersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <MockAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={<PaymentsPage />}
            />
            <Route path="*" element={<div>404 - Página no encontrada</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <NegocioProvider>
      <Router>
        <AppContent />
      </Router>
    </NegocioProvider>
  );
};

export default App;