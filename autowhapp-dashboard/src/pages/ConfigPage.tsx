import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import BotStatus from '../components/BotStatus';
import MainConfig from '../components/MainConfig';
import Products from '../components/Products';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';
import { useNavigate } from 'react-router-dom';

const ConfigPage: React.FC = () => {
  const { negocioId, negocios } = useNegocio();
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [negocio, setNegocio] = useState<any>(null);
  const navigate = useNavigate();

  const formatName = (name: string | undefined) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  useEffect(() => {
    const fetchNegocio = async () => {
      if (negocioId !== null) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
            }
          });
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/negocio/${negocioId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setNegocio(res.data);
        } catch (err) {
          console.error('Error al cargar el negocio:', err);
          setNegocio(null);
        }
      }
    };
    fetchNegocio();
  }, [negocioId, getAccessTokenSilently]);

  useEffect(() => {
    if (negocios.length === 0) {
      navigate('/add-business');
    }
  }, [negocios, navigate]);

  const handleToggleBot = async (nuevoEstado: boolean) => {
    if (negocioId !== null) {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
          }
        });
        await axios.post(`${process.env.REACT_APP_API_URL}/api/actualizar-estado-bot`, 
          { negocioId, estadoBot: nuevoEstado }, 
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setNegocio((prev: any) => prev ? { ...prev, estado_bot: nuevoEstado ? 1 : 0 } : prev);
      } catch (err) {
        console.error('Error al actualizar estado del bot:', err);
      }
    }
  };

  return (
    <div className="flex-grow bg-blue-600 p-6 min-h-screen">
      {isLoading ? (
        <div className="text-white font-poppins text-lg">Cargando...</div>
      ) : isAuthenticated && negocioId && negocio ? (
        <>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-poppins font-bold text-white mt-3">
                Hola, {formatName(user?.given_name)}!
              </h2>
            </div>
            <div className="flex-1 flex justify-end max-w-xl gap-4">
              <BotStatus 
                negocioId={negocioId} 
                active={!!negocio.estado_bot} 
                onToggle={handleToggleBot}
              />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 md:flex-[0_0_100%]">
              <MainConfig negocioId={negocioId} />
            </div>
            <div className="flex-1 md:flex-[0_0_100%]">
              <Products negocioId={negocioId} />
            </div>
          </div>
        </>
      ) : (
        <div className="text-white font-poppins text-lg">
          Seleccione un negocio para comenzar
        </div>
      )}
    </div>
  );
};

export default ConfigPage;