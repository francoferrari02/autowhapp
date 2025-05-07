import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AddIcon from '@mui/icons-material/Add';
import QrCodeIcon from '@mui/icons-material/QrCode';
import logo from '../assets/LogoAutoWhappBlanco.png';
import { useNavigate } from 'react-router-dom';
import { useNegocio } from '../NegocioContext';

const Header: React.FC = () => {
  const { negocioId, setNegocioId, negocios } = useNegocio();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [qrAnchorEl, setQrAnchorEl] = useState<null | HTMLElement>(null);
  const [qrs, setQrs] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleQrMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setQrAnchorEl(event.currentTarget);
    fetchQrs();
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleQrMenuClose = () => {
    setQrAnchorEl(null);
  };

  const handleNegocioSelect = (negocioId: number) => {
    setNegocioId(negocioId);
    handleMenuClose();
  };

  const handleAddBusiness = () => {
    handleMenuClose();
    navigate('/add-business');
  };

  const fetchQrs = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/qrs');
      const data = await response.json();
      setQrs(data);
    } catch (error) {
      console.error('Error al obtener QRs:', error);
    }
  };

  useEffect(() => {
    if (qrAnchorEl) {
      fetchQrs();
      const interval = setInterval(fetchQrs, 5000);
      return () => clearInterval(interval);
    }
  }, [qrAnchorEl]);

  const selectedNegocio = negocios.find(negocio => negocio.id === negocioId);

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'linear-gradient(90deg, rgb(69, 79, 255) 17%, rgb(255, 255, 255) 28%)',
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
        >
          <SettingsIcon sx={{ color: '#FFFFFF' }} />
        </IconButton>
        <IconButton
          sx={{ backgroundColor: 'rgb(69, 79, 225)', marginRight: 1, '&:hover': { backgroundColor: '#93C5FD' } }}
          onClick={handleQrMenuOpen}
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
        </Menu>
        <Menu
          anchorEl={qrAnchorEl}
          open={Boolean(qrAnchorEl)}
          onClose={handleQrMenuClose}
          PaperProps={{ sx: { backgroundColor: 'rgb(69, 79, 225)', color: '#FFFFFF', maxWidth: '400px' } }}
        >
          {qrs.length === 0 ? (
            <MenuItem disabled>Todos los negocios están autenticados</MenuItem>
          ) : (
            qrs.map(qr => (
              <MenuItem key={qr.negocioId} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography>{qr.nombre}</Typography> {/* Usamos qr.nombre directamente */}
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