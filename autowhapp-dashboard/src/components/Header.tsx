import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useNegocio } from '../NegocioContext';
import { useAuth0 } from '@auth0/auth0-react';
import logo from '../assets/LogoAutoWhappBlanco.png';
import axios from 'axios';

const Header: React.FC = () => {
  const { negocio, setNegocioId, refreshNegocio } = useNegocio();
  const { logout, user } = useAuth0();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [planAnchorEl, setPlanAnchorEl] = useState<null | HTMLElement>(null);
  const [planes, setPlanes] = useState<string[]>([
    'Plan Servicios',
    'Plan Servicios Plus',
    'Plan Tienda',
    'Plan Tienda Plus',
    'Plan Premium',
  ]);
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePlanMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPlanAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePlanMenuClose = () => {
    setPlanAnchorEl(null);
  };

  const handleNegocioSelect = (id: number) => {
    setNegocioId(id);
    handleMenuClose();
    navigate('/config');
  };

  const handleAddBusiness = () => {
    handleMenuClose();
    navigate('/add-business');
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const { getAccessTokenSilently } = useAuth0(); // Asegúrate de importar useAuth0

const handlePlanSelect = async (plan: string) => {
  if (!negocio?.id) return;
  try {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
      }
    });
    await axios.put(`${process.env.REACT_APP_API_URL}/api/negocio/${negocio.id}/plan`, { plan }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    await refreshNegocio();
    handlePlanMenuClose();
  } catch (error) {
    console.error('Error al cambiar plan:', error);
  }
};

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'rgb(0, 0, 0)',
        boxShadow: '0 6px 24px -8px rounded-b-2xl rgba(50,60,130,0.5), 0 5px 3px 0 rgba(30,40,90,0.5)',
        zIndex: 1300,
      }}
    >
      <Toolbar>
        <img
          src={logo}
          alt="Logo AutoWhapp"
          style={{ height: 40, width: 40, marginRight: 16, objectFit: 'contain' }}
        />
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, fontFamily: 'Poppins', fontWeight: 'bold' }}
        >
          AutoWhapp
        </Typography>
        <IconButton
          sx={{ backgroundColor: 'rgb(69, 79, 225)', marginRight: 1, '&:hover': { backgroundColor: '#93C5FD' } }}
        >
          <HelpOutlineIcon sx={{ color: '#FFFFFF' }} />
        </IconButton>
        <IconButton
          sx={{ backgroundColor: 'rgb(69, 79, 225)', marginRight: 1, '&:hover': { backgroundColor: '#93C5FD' } }}
          onClick={handlePlanMenuOpen}
        >
          <SettingsIcon sx={{ color: '#FFFFFF' }} />
        </IconButton>
        <IconButton
          sx={{ backgroundColor: 'rgb(69, 79, 225)', '&:hover': { backgroundColor: '#93C5FD' } }}
          onClick={handleMenuOpen}
        >
          <PersonOutlineIcon sx={{ color: '#FFFFFF' }} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{ sx: { backgroundColor: 'rgb(69, 79, 225)', color: '#FFFFFF' } }}
        >
          <MenuItem disabled sx={{ fontFamily: 'Poppins' }}>
            {user?.name || 'Usuario'}
          </MenuItem>
          <MenuItem
            onClick={handleAddBusiness}
            sx={{ fontFamily: 'Poppins', '&:hover': { backgroundColor: '#93C5FD' } }}
            disabled={!!negocio}
          >
            <AddIcon sx={{ mr: 1 }} />
            Agregar Negocio
          </MenuItem>
          <MenuItem
            onClick={handleLogout}
            sx={{ fontFamily: 'Poppins', '&:hover': { backgroundColor: '#93C5FD' } }}
          >
            Cerrar Sesión
          </MenuItem>
        </Menu>
        <Menu
          anchorEl={planAnchorEl}
          open={Boolean(planAnchorEl)}
          onClose={handlePlanMenuClose}
          PaperProps={{ sx: { backgroundColor: 'rgb(69, 79, 225)', color: '#FFFFFF' } }}
        >
          {planes.map(plan => (
            <MenuItem
              key={plan}
              onClick={() => handlePlanSelect(plan)}
              sx={{ fontFamily: 'Poppins', '&:hover': { backgroundColor: '#93C5FD' } }}
            >
              {plan}
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
</AppBar>
  );
};

export default Header;