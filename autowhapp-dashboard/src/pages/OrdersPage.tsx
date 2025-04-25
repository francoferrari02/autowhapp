import React from 'react';
import { Box } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Orders from '../components/Orders';

const OrdersPage: React.FC = () => {
  return (
    <Box>
      <Header />
      <Box display="flex">
        <Sidebar selected="orders" />
        <Box flexGrow={1} sx={{ backgroundColor: '#F7F9FC', padding: '24px' }}>
          <Orders />
        </Box>
      </Box>
    </Box>
  );
};

export default OrdersPage;