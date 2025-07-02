import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useNegocio } from '../NegocioContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth0();
  const { negocio, isFirstLogin, setIsFirstLogin } = useNegocio();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isFirstLogin && !negocio) {
      navigate('/add-business', { replace: true });
    }
  }, [isLoading, isFirstLogin, negocio, navigate]);

  // Función para determinar la pestaña seleccionada
  const getSelectedTab = (path: string): 'config' | 'orders' | 'analytics' | 'reservations' | 'reminders' => {
    return 'config'; // Dashboard se considera parte de la configuración
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-poppins">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isFirstLogin && !negocio) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center font-poppins text-gray-800">
            ¡Bienvenido a AutoWhapp, {user?.name}!
          </h1>
          <p className="text-gray-600 mb-6 text-center font-poppins">
            Para comenzar a usar AutoWhapp, necesitamos configurar tu negocio. Esto solo tomará unos minutos.
          </p>
          <button
            onClick={() => {
              navigate('/add-business');
            }}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-poppins"
          >
            Comenzar Configuración
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-blue-600">
      <Header />
      <div className="flex flex-grow">
        <Sidebar selected={getSelectedTab(window.location.pathname)} />
        <div className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-white font-poppins">Dashboard</h1>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 font-poppins text-gray-800">Tu Negocio</h2>
              {negocio ? (
                <div className="border p-4 rounded-lg">
                  <p className="text-gray-700 font-poppins">
                    <strong>Nombre:</strong> {negocio.nombre}
                  </p>
                  
                </div>
              ) : (
                <p className="text-gray-600 font-poppins">No tienes un negocio configurado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;