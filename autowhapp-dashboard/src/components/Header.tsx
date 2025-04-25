import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const Header: React.FC = () => {
  return (
    <AppBar position="static" sx={{ background: 'linear-gradient(180deg, #1E3A8A 0%, #2B4B9B 100%)' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: 'Poppins', fontWeight: 'bold' }}>
          AutoWhapp
        </Typography>
        <IconButton sx={{ backgroundColor: '#E5E7EB', marginRight: 1, '&:hover': { backgroundColor: '#93C5FD' } }}>
          <HelpOutlineIcon sx={{ color: '#111827' }} />
        </IconButton>
        <IconButton sx={{ backgroundColor: '#E5E7EB', marginRight: 1, '&:hover': { backgroundColor: '#93C5FD' } }}>
          <SettingsIcon sx={{ color: '#111827' }} />
        </IconButton>
        <IconButton sx={{ backgroundColor: '#E5E7EB', '&:hover': { backgroundColor: '#93C5FD' } }}>
          <PersonOutlineIcon sx={{ color: '#111827' }} />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;