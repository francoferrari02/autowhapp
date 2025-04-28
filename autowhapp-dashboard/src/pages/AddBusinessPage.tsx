import React, { useState } from 'react';
import { Box, Button, TextField, MenuItem, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

const businessTypes = [
  { value: '', label: 'Seleccionar' },
  { value: 'tienda_online', label: 'Tienda Online (E-commerce)' },
  { value: 'moda', label: 'Moda y Ropa' },
  { value: 'restaurante', label: 'Restaurante o Cafetería' },
  { value: 'agencia_viajes', label: 'Agencia de Viajes' },
  { value: 'hotel', label: 'Hotel o Hospedaje' },
  { value: 'consultorio_medico', label: 'Consultorio Médico' },
  { value: 'veterinaria', label: 'Veterinaria' },
  { value: 'gimnasio', label: 'Gimnasio o Centro de Fitness' },
  { value: 'salon_belleza', label: 'Salón de Belleza o Spa' },
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'educacion', label: 'Educación' },
  { value: 'concesionario', label: 'Concesionario de Autos' },
  { value: 'electronica', label: 'Tienda de Electrónica' },
  { value: 'eventos', label: 'Eventos y Entretenimiento' },
  { value: 'profesionales', label: 'Servicios Profesionales' },
  { value: 'personalizado', label: 'Personalizado' },
];

// Componente para input con label e icono
const LabeledInput: React.FC<{
  label: string;
  icon: React.ReactNode;
  name: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, icon, name, value, placeholder, onChange }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={name} className="flex items-center gap-1 text-gray-700 font-semibold font-poppins">
      {icon}
      <span>{label}</span>
    </label>
    <input
      id={name}
      name={name}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-poppins"
    />
  </div>
);

const AddBusinessPage: React.FC = () => {
  const navigate = useNavigate();
  const [business, setBusiness] = useState({
    nombre: '',
    numero_telefono: '',
    tipo_negocio: '',
    localidad: '',
    direccion: '',
    horarios: {
      Lunes: { open: '09:00', close: '18:00' },
      Martes: { open: '09:00', close: '18:00' },
      Miércoles: { open: '09:00', close: '18:00' },
      Jueves: { open: '09:00', close: '18:00' },
      Viernes: { open: '09:00', close: '18:00' },
      Sábado: { open: '09:00', close: '18:00' },
      Domingo: { open: '09:00', close: '18:00' },
    },
    contexto: '',
  });
  const [customType, setCustomType] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBusiness({ ...business, [name]: value });
  };

  const handleTypeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as string;
    if (value === 'personalizado') {
      setCustomType('');
      setBusiness({ ...business, tipo_negocio: 'personalizado' });
    } else {
      setCustomType('');
      setBusiness({ ...business, tipo_negocio: value });
    }
  };

  const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomType(value);
    setBusiness({ ...business, tipo_negocio: value });
  };

  const handleHoursChange = (day: keyof typeof business.horarios, field: 'open' | 'close', value: string) => {
    setBusiness({
      ...business,
      horarios: {
        ...business.horarios,
        [day]: {
          ...business.horarios[day],
          [field]: value,
        },
      },
    });
  };

  const handleSave = () => {
    // Validación en el frontend
    if (!business.nombre || !business.numero_telefono) {
      setMessage('Nombre y número de teléfono son requeridos');
      return;
    }

    const businessToSave = {
      nombre: business.nombre,
      numero_telefono: business.numero_telefono,
      tipo_negocio: business.tipo_negocio,
      localidad: business.localidad,
      direccion: business.direccion,
      horarios: business.horarios,
      contexto: business.contexto,
    };

    axios.post('/api/negocios', businessToSave)
      .then(response => {
        setMessage('Negocio creado con éxito');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      })
      .catch(error => {
        console.error('Error al crear el negocio:', error);
        // Mostrar un mensaje más específico basado en el error del backend
        if (error.response) {
          if (error.response.status === 400) {
            setMessage('Nombre y número de teléfono son requeridos');
          } else if (error.response.status === 500 && error.response.data.error.includes('UNIQUE constraint failed')) {
            setMessage('El número de teléfono ya está registrado');
          } else {
            setMessage(`Error al crear el negocio: ${error.response.data.error || 'Error desconocido'}`);
          }
        } else {
          setMessage('Error al conectar con el servidor');
        }
      });
  };

  const days: (keyof typeof business.horarios)[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <Box sx={{ backgroundColor: '#2563EB', minHeight: '100vh', p: 3 }}>
      <Typography variant="h4" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', color: 'white', mb: 4 }}>
        Agregar Nuevo Negocio
      </Typography>
      <Box className="bg-white rounded-lg p-6 max-w-[1000px] mx-auto" style={{ boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)' }}>
        <div className="space-y-5">
          <LabeledInput
            label="Nombre del Negocio"
            icon={<StorefrontIcon className="text-primary-blue" />}
            name="nombre"
            value={business.nombre}
            placeholder="Ej. La Pizzería Italiana"
            onChange={handleInputChange}
          />

          <LabeledInput
            label="Número de Teléfono"
            icon={<PhoneIcon className="text-primary-blue" />}
            name="numero_telefono"
            value={business.numero_telefono}
            placeholder="Ej. +541123456789"
            onChange={handleInputChange}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="tipo_negocio" className="text-gray-700 font-semibold font-poppins">
              Tipo de Negocio
            </label>
            <TextField
              id="tipo_negocio"
              select
              value={businessTypes.find(bt => bt.value === business.tipo_negocio) ? business.tipo_negocio : 'personalizado'}
              onChange={handleTypeChange}
              fullWidth
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              {businessTypes.map(({ value, label }) => (
                <MenuItem key={value} value={value} disabled={value === ''}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </div>

          {(business.tipo_negocio === 'personalizado' || !businessTypes.find(bt => bt.value === business.tipo_negocio)) && (
            <div className="flex flex-col gap-1 mt-2">
              <label htmlFor="customType" className="text-gray-700 font-semibold font-poppins">
                Especifique el Tipo de Negocio
              </label>
              <input
                id="customType"
                type="text"
                value={customType}
                placeholder="Ingrese el tipo de negocio manualmente"
                onChange={handleCustomTypeChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-poppins"
              />
            </div>
          )}

          <LabeledInput
            label="Localidad"
            icon={<LocationOnIcon className="text-primary-blue" />}
            name="localidad"
            value={business.localidad}
            placeholder="Ej. Buenos Aires"
            onChange={handleInputChange}
          />

          <LabeledInput
            label="Dirección"
            icon={<LocationOnIcon className="text-primary-blue" />}
            name="direccion"
            value={business.direccion}
            placeholder="Ej. Av. Corrientes 123"
            onChange={handleInputChange}
          />

          <div className="border border-gray-300 rounded-lg">
            <div className="flex items-center justify-between p-3 bg-gray-100 rounded-t-lg">
              <div className="flex items-center gap-2 font-poppins font-semibold text-gray-700">
                <AccessTimeIcon />
                <span>Horarios de Atención</span>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {days.map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <span className="w-24 font-poppins text-gray-700">{day}</span>
                  <input
                    type="time"
                    value={business.horarios[day as keyof typeof business.horarios].open}
                    onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                  <input
                    type="time"
                    value={business.horarios[day].close}
                    onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="contexto" className="flex items-center gap-2 text-gray-700 font-semibold font-poppins">
              <ChatBubbleOutlineIcon className="text-primary-blue" />
              Sugerencias/Aclaraciones para el Bot (Opcional)
            </label>
            <textarea
              id="contexto"
              value={business.contexto}
              onChange={(e) => setBusiness({ ...business, contexto: e.target.value })}
              placeholder="Dale alguna sugerencia o aclaración extra al bot (opcional)..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-poppins"
              rows={4}
            />
          </div>

          <Button
            variant="contained"
            sx={{ backgroundColor: '#34C759', '&:hover': { backgroundColor: '#2EA44F' }, borderRadius: 2 }}
            onClick={handleSave}
          >
            Guardar Negocio
          </Button>

          {message && (
            <Typography color={message.includes('Error') ? 'error' : 'success.main'} mt={2}>
              {message}
            </Typography>
          )}
        </div>
      </Box>
    </Box>
  );
};

export default AddBusinessPage;