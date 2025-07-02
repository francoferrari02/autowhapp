import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import MainConfig from '../components/MainConfig';
import Products from '../components/Products';
import WhatsAppConnection from '../components/WhatsAppConnection';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';
import { useNavigate } from 'react-router-dom';

const ConfigPage: React.FC = () => {
  const { negocioId, negocio, loading: contextLoading } = useNegocio();
  const { user, isAuthenticated, isLoading: authLoading, getAccessTokenSilently } = useAuth0();
  const [negocioState, setNegocioState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const formatName = (name: string | undefined) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    const fetchNegocio = async () => {
      if (negocioId !== null) {
        try {
          const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.REACT_APP_AUTH0_AUDIENCE!
          }
        });
          const res = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/negocio/${negocioId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          setNegocioState(res.data);
        } catch (err) {
          console.error('Error al cargar el negocio:', err);
          setNegocioState(null);
        }
      } else {
        setNegocioState(null);
      }
      setLoading(false);
    };
    fetchNegocio();
  }, [negocioId, getAccessTokenSilently]);

  useEffect(() => {
    if (!contextLoading && !loading && !negocioState && negocioId === null) {
      navigate('/add-business');
    }
  }, [contextLoading, loading, negocioState, negocioId, navigate]);

  if (authLoading || contextLoading || loading) {
    return <div className="text-white font-poppins text-lg">Cargando...</div>;
  }

  if (!isAuthenticated || !negocioId || !negocioState) {
    return <div className="text-white font-poppins text-lg">Seleccione un negocio para comenzar</div>;
  }

  const handleToggleBot = async (nuevoEstado: boolean) => {
    if (negocioId !== null) {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
          }
        });
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/actualizar-estado-bot`,
          { negocioId, estadoBot: nuevoEstado },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNegocioState((prev: any) =>
          prev ? { ...prev, estado_bot: nuevoEstado ? 1 : 0 } : prev
        );
      } catch (err) {
        console.error('Error al actualizar estado del bot:', err);
      }
    }
  };

  return (
    <div className="flex-grow bg-blue-600 p-6 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-poppins font-bold text-white mt-3">
          Hola, {formatName(user?.given_name)}!
        </h2>
      </div>
      <WhatsAppConnection />
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 md:flex-[0_0_100%]">
          <MainConfig negocioId={negocioId} />
        </div>
        <div className="flex-1 md:flex-[0_0_100%]">
          <Products negocioId={negocioId} />
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;