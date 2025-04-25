import React from 'react';
import { Box } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MainConfig from '../components/MainConfig';
import BotStatus from '../components/BotStatus';
import Products from '../components/Products';

const ConfigPage: React.FC = () => {
  return (
    <Box>
      <Header />
      <Box display="flex">
        <Sidebar selected="config" />
        <Box flexGrow={1} sx={{ backgroundColor: '#F7F9FC', padding: '24px' }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ flex: { xs: '100%', md: '70%' } }}>
              <MainConfig />
            </Box>
            <Box sx={{ flex: { xs: '100%', md: '30%' } }}>
              <BotStatus />
              <Products />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ConfigPage;