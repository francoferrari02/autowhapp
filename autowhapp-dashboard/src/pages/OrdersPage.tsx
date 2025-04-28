import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Orders from '../components/Orders';
import PedidosStatus from '../components/PedidosStatus';
import axios from 'axios';
import { useNegocio } from '../NegocioContext'; // Importa el hook del contexto

const OrdersPage: React.FC = () => {
  const { negocioId } = useNegocio(); // Usa el negocioId del contexto
  const [moduloPedidos, setModuloPedidos] = useState<boolean>(false);

  // Cuando cambia el negocio, busca el estado real
  useEffect(() => {
    if (negocioId !== null) {
      axios
        .get<{ modulo_pedidos: boolean }>(`http://localhost:3000/api/negocio/${negocioId}`)
        .then((res) => setModuloPedidos(!!res.data.modulo_pedidos))
        .catch((err) => {
          console.error('Error al cargar estado de pedidos:', err);
          setModuloPedidos(false);
        });
    }
  }, [negocioId]);

  const handleTogglePedidos = (nuevoEstado: boolean) => {
    if (negocioId == null) return;
    axios
      .post('http://localhost:3000/api/actualizar-modulo-pedidos', { negocioId, moduloPedidos: nuevoEstado })
      .then(() => {
        setModuloPedidos(nuevoEstado);
      })
      .catch(err => {
        console.error('Error al actualizar estado de pedidos:', err);
      });
  };

  return (
    <Box sx={{ backgroundColor: '#2563EB', minHeight: '100vh' }}>
      <Header />
      <Box display="flex">
        <Sidebar selected="orders" />
        <Box flexGrow={1} sx={{ padding: 3 }}>
          {/* Título + PedidosStatus */}
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={4}>
            <h2 className="text-2xl font-poppins font-bold text-white mt-2">
              Configuración de Pedidos
            </h2>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', maxWidth: '480px' }}>
              <PedidosStatus
                active={moduloPedidos}
                onToggle={handleTogglePedidos}
              />
            </div>
          </Box>
          <Orders />
        </Box>
      </Box>
    </Box>
  );
};

export default OrdersPage;