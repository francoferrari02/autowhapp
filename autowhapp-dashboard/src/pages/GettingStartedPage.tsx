import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useNegocio } from '../NegocioContext';

const GettingStartedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const { isFirstLogin } = useNegocio();

  useEffect(() => {
    // Si es el primer login, redirigir automáticamente
    if (isFirstLogin) {
      console.log('First login detected, redirecting to add-business...');
      navigate('/add-business');
    }
  }, [isFirstLogin, navigate]);

  const handleStartConfig = () => {
    console.log('Button clicked - Starting configuration...');
    navigate('/add-business');
  };

  console.log('GettingStartedPage rendered', { user, isFirstLogin });

  // Si es el primer login, no renderizar nada mientras se hace la redirección
  if (isFirstLogin) {
    return null;
  }

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
          onClick={handleStartConfig}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          Comenzar Configuración
        </button>
      </div>
    </div>
  );
};

export default GettingStartedPage; 