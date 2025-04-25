// OrdersPage.tsx
import React from 'react';
import { Box } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Orders from '../components/Orders';
import PedidosStatus from '../components/PedidosStatus'; // import nuevo componente

const OrdersPage: React.FC = () => {
  return (
    <Box sx={{ backgroundColor: '#2563EB', minHeight: '100vh' }}>
      <Header />
      <Box display="flex">
        <Sidebar selected="orders" />
        <Box flexGrow={1} sx={{ padding: 3 }}>
          {/* Título + PedidosStatus */}
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={4}>
            <h2 className="text-2xl font-poppins font-bold text-white mt-2">Configuración de Pedidos</h2>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', maxWidth: '480px' }}>
              <PedidosStatus />
            </div>
          </Box>
          <Orders />
        </Box>
      </Box>
    </Box>
  );
};

export default OrdersPage;