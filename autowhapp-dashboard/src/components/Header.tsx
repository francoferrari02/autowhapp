import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AddIcon from '@mui/icons-material/Add';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { useNavigate } from 'react-router-dom';
import { useNegocio } from '../NegocioContext';
import { useAuth0 } from '@auth0/auth0-react';
import logo from '../assets/LogoAutoWhappBlanco.png';
import axios from 'axios';

const Header: React.FC = () => {
  const { negocioId, setNegocioId, negocios, refreshNegocios } = useNegocio();
  const { logout, user } = useAuth0();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [qrAnchorEl, setQrAnchorEl] = useState<null | HTMLElement>(null);
  const [planAnchorEl, setPlanAnchorEl] = useState<null | HTMLElement>(null);
  const [qrs, setQrs] = useState<any[]>([]);
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

  const handleQrMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setQrAnchorEl(event.currentTarget);
    fetchQrs();
  };

  const handlePlanMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPlanAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleQrMenuClose = () => {
    setQrAnchorEl(null);
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
  console.log('Intentando cambiar plan:', { negocioId, plan });
  if (!negocioId) return;
  try {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
      }
    });
    await axios.put(`http://localhost:3000/api/negocio/${negocioId}/plan`, { plan }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    await refreshNegocios();
    handlePlanMenuClose();
  } catch (error) {
    console.error('Error al cambiar plan:', error);
  }
};

  const fetchQrs = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/qrs');
      setQrs(response.data as any[]);
    } catch (error) {
      console.error('Error al obtener QRs:', error);
      setQrs([]);
    }
  };

  useEffect(() => {
    if (qrAnchorEl) {
      const interval = setInterval(fetchQrs, 5000);
      return () => clearInterval(interval);
    }
  }, [qrAnchorEl]);

  const selectedNegocio = negocios.find(negocio => negocio.id === negocioId);

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'linear-gradient(90deg, rgb(2, 2, 2) 72%, rgb(255, 255, 255) 80%)',
        boxShadow: '0 6px 24px -8px rgba(50,60,130,0.5), 0 5px 3px 0 rgba(30,40,90,0.5)',
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
          sx={{ backgroundColor: 'rgb(69, 79, 225)', marginRight: 1, '&:hover': { backgroundColor: '#93C5FD' } }}
          onClick={handleQrMenuOpen}
          disabled={negocios.length === 0}
        >
          <QrCodeIcon sx={{ color: '#FFFFFF' }} />
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
            sx={{ fontFamily: 'Poppins', '&:hover': { backgroundColor: '#93C5FD' } }}
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
        <Menu
          anchorEl={qrAnchorEl}
          open={Boolean(qrAnchorEl)}
          onClose={handleQrMenuClose}
          PaperProps={{ sx: { backgroundColor: 'rgb(69, 79, 225)', color: '#FFFFFF', maxWidth: '400px' } }}
        >
          {qrs.length === 0 ? (
            <MenuItem disabled>Todos los negocios están autenticados o no hay QR disponibles</MenuItem>
          ) : (
            qrs.map(qr => (
              <MenuItem key={qr.negocioId} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography>{qr.nombre}</Typography>
                <img src={qr.qr} alt={`QR para negocio ${qr.negocioId}`} style={{ width: '200px', height: '200px' }} />
              </MenuItem>
            ))
          )}
        </Menu>
      </Toolbar>
</AppBar>
  );
};

export default Header;