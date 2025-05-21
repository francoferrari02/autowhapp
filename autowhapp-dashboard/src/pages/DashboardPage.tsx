import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNegocio } from '../NegocioContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth0();
  const { negocios, isFirstLogin } = useNegocio();

  if (isFirstLogin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center">
            ¡Bienvenido a AutoWhapp, {user?.name?.toUpperCase()}!
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            Para comenzar a usar AutoWhapp, necesitamos configurar tu negocio. Esto solo tomará unos minutos.
          </p>
          <button
            onClick={() => window.location.href = '/getting-started'}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Comenzar Configuración
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Tus Negocios</h2>
          {negocios.length > 0 ? (
            <ul className="space-y-4">
              {negocios.map((negocio) => (
                <li key={negocio.id} className="border p-4 rounded">
                  {negocio.nombre}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No tienes negocios configurados.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 