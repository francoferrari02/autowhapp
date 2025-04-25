import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import logo from '../assets/LogoAutoWhappBlanco.png';

const Header: React.FC = () => {
  return (
    <AppBar
      position="sticky" // Cambiado de static a sticky
      sx={{
        background: 'linear-gradient(90deg, rgb(69, 79, 255) 17%, rgb(255, 255, 255) 28%)',
        boxShadow:
          '0 6px 24px -8px rgba(50,60,130,0.5), 0 5px 3px 0 rgba(30,40,90,0.5)',
        zIndex: 1300, // Asegura que el header esté encima del contenido
      }}
    >
      <Toolbar>
        {/* Logo a la izquierda */}
        <img
          src={logo}
          alt="Logo AutoWhapp"
          style={{
            height: 40,
            width: 40,
            marginRight: 16,
            objectFit: 'contain'
          }}
        />
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontFamily: 'Poppins',
            fontWeight: 'bold',
          }}
        >
          AutoWhapp
        </Typography>
        <IconButton
          sx={{
            backgroundColor: 'rgb(69, 79, 225)',
            marginRight: 1,
            '&:hover': { backgroundColor: '#93C5FD' },
          }}
        >
          <HelpOutlineIcon sx={{ color: '#FFFFFF' }} />
        </IconButton>
        <IconButton
          sx={{
            backgroundColor: 'rgb(69, 79, 225)',
            marginRight: 1,
            '&:hover': { backgroundColor: '#93C5FD' },
          }}
        >
          <SettingsIcon sx={{ color: '#FFFFFF' }} />
        </IconButton>
        <IconButton
          sx={{
            backgroundColor: 'rgb(69, 79, 225)',
            '&:hover': { backgroundColor: '#93C5FD' },
          }}
        >
          <PersonOutlineIcon sx={{ color: '#FFFFFF' }} />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;