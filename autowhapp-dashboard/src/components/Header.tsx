import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AddIcon from '@mui/icons-material/Add';
import logo from '../assets/LogoAutoWhappBlanco.png';
import { useNavigate } from 'react-router-dom';
import { useNegocio } from '../NegocioContext'; // Importa el hook del contexto

const Header: React.FC = () => {
  const { negocioId, setNegocioId, negocios } = useNegocio(); // Usa el contexto
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNegocioSelect = (negocioId: number) => {
    setNegocioId(negocioId); // Actualiza el negocioId global
    handleMenuClose();
  };

  const handleAddBusiness = () => {
    handleMenuClose();
    navigate('/add-business');
  };

  const selectedNegocio = negocios.find(negocio => negocio.id === negocioId);

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'linear-gradient(90deg, rgb(69, 79, 255) 17%, rgb(255, 255, 255) 28%)',
        boxShadow:
          '0 6px 24px -8px rgba(50,60,130,0.5), 0 5px 3px 0 rgba(30,40,90,0.5)',
        zIndex: 1300,
      }}
    >
      <Toolbar>
        <img
          src={logo}
          alt="Logo AutoWhapp"
          style={{
            height: 40,
            width: 40,
            marginRight: 16,
            objectFit: 'contain',
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
          onClick={handleMenuOpen}
        >
          <PersonOutlineIcon sx={{ color: '#FFFFFF' }} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: 'rgb(69, 79, 225)',
              color: '#FFFFFF',
            },
          }}
        >
          {negocios.length === 0 ? (
            <MenuItem disabled>No se pudieron cargar negocios</MenuItem>
          ) : (
            negocios.map(negocio => (
              <MenuItem
                key={negocio.id}
                onClick={() => handleNegocioSelect(negocio.id)}
                sx={{
                  fontFamily: 'Poppins',
                  '&:hover': { backgroundColor: '#93C5FD' },
                  backgroundColor: negocioId === negocio.id ? '#93C5FD' : 'transparent',
                }}
              >
                {negocio.nombre}
              </MenuItem>
            ))
          )}
          <MenuItem
            onClick={handleAddBusiness}
            sx={{
              fontFamily: 'Poppins',
              '&:hover': { backgroundColor: '#93C5FD' },
            }}
          >
            <AddIcon sx={{ mr: 1 }} />
            Agregar Negocio
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;