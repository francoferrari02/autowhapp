import React, { useState, useEffect } from 'react';
import Orders from '../components/Orders';
import ModuleStatus from '../components/ModuleStatus';
import ProtectedModule from '../components/ProtectedModule';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';
import { useAuth0 } from '@auth0/auth0-react';

const OrdersPage: React.FC = () => {
  const { negocioId } = useNegocio();
  const { getAccessTokenSilently } = useAuth0();
  const [moduloPedidos, setModuloPedidos] = useState<boolean>(false);

  useEffect(() => {
    if (negocioId !== null) {
      const fetchModuloPedidos = async () => {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
            }
          });
          const res = await axios.get<{ modulo_pedidos: boolean }>(`${process.env.REACT_APP_API_URL}/api/negocio/${negocioId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setModuloPedidos(!!res.data.modulo_pedidos);
        } catch (err) {
          console.error('Error al cargar estado de pedidos:', err);
          setModuloPedidos(false);
        }
      };
      fetchModuloPedidos();
    }
  }, [negocioId, getAccessTokenSilently]);

  const handleTogglePedidos = async (nuevoEstado: boolean) => {
    if (negocioId == null) return;
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      await axios.post(`${process.env.REACT_APP_API_URL}/api/actualizar-modulo-pedidos`, { negocioId, moduloPedidos: nuevoEstado }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModuloPedidos(nuevoEstado);
    } catch (err) {
      console.error('Error al actualizar estado de pedidos:', err);
    }
  };

  return (
    <ProtectedModule module="orders">
      <div className="flex-grow bg-blue-600 p-6 min-h-screen">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-poppins font-bold text-white mt-2">
              Configuración de Pedidos
            </h2>
            <div className="flex-1 flex justify-end max-w-[480px]">
              <ModuleStatus
                moduleName="Pedidos"
                active={moduloPedidos}
                onToggle={handleTogglePedidos}
              />
            </div>
          </div>
          <Orders />
        </div>
      </div>
    </ProtectedModule>
  );
};

export default OrdersPage;