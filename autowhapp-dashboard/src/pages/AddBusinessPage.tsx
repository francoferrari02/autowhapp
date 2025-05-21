import React, { useState } from 'react';
import { Box, Button, TextField, MenuItem, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useAuth0 } from '@auth0/auth0-react';
import { useNegocio } from '../NegocioContext';

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

interface Horario {
  open: string;
  close: string;
}

interface Horarios {
  Lunes: Horario;
  Martes: Horario;
  Miércoles: Horario;
  Jueves: Horario;
  Viernes: Horario;
  Sábado: Horario;
  Domingo: Horario;
}

interface BusinessData {
  nombre: string;
  numero_telefono: string;
  tipo_negocio: string;
  localidad: string;
  direccion: string;
  horarios: Horarios;
  contexto: string;
}

interface BusinessResponse {
  id: number;
  message: string;
}

const defaultHorarios: Horarios = {
  Lunes: { open: '09:00', close: '18:00' },
  Martes: { open: '09:00', close: '18:00' },
  Miércoles: { open: '09:00', close: '18:00' },
  Jueves: { open: '09:00', close: '18:00' },
  Viernes: { open: '09:00', close: '18:00' },
  Sábado: { open: '09:00', close: '18:00' },
  Domingo: { open: '09:00', close: '18:00' }
};

const AddBusinessPage: React.FC = () => {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const { refreshNegocios, setNegocioId } = useNegocio();
  const [formData, setFormData] = useState<BusinessData>({
    nombre: '',
    numero_telefono: '',
    tipo_negocio: '',
    localidad: '',
    direccion: '',
    horarios: defaultHorarios,
    contexto: ''
  });
  const [customType, setCustomType] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as string;
    if (value === 'personalizado') {
      setCustomType('');
      setFormData({ ...formData, tipo_negocio: 'personalizado' });
    } else {
      setCustomType('');
      setFormData({ ...formData, tipo_negocio: value });
    }
  };

  const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomType(value);
    setFormData({ ...formData, tipo_negocio: value });
  };

  const handleHoursChange = (day: keyof Horarios, field: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [day]: {
          ...prev.horarios[day],
          [field]: value
        }
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!process.env.REACT_APP_API_URL) {
        throw new Error('API URL is not configured');
      }

      console.log('Environment variables:', {
        API_URL: process.env.REACT_APP_API_URL,
        AUTH0_DOMAIN: process.env.REACT_APP_AUTH0_DOMAIN,
        AUTH0_AUDIENCE: process.env.REACT_APP_AUTH0_AUDIENCE
      });
      console.log('Audience:', process.env.REACT_APP_AUTH0_AUDIENCE);
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: "read:negocios write:negocios"
        }
      });
      console.log('TOKEN:', token);

      const baseUrl = process.env.REACT_APP_API_URL.trim();
      const apiUrl = `${baseUrl}/api/negocios`;
      
      console.log('Making request to:', apiUrl);
      console.log('Request payload:', formData);

      const response = await axios.post<BusinessResponse>(
        apiUrl,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log('Save response:', response.data);

      if (response.status === 201 || response.status === 200) {
        await refreshNegocios();
        navigate('/dashboard');
      } else {
        throw new Error('Unexpected response status: ' + response.status);
      }
    } catch (error: any) {
      console.error('Error al guardar el negocio:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
      setError(error.response?.data?.message || error.message || 'Error al guardar el negocio');
    } finally {
      setLoading(false);
    }
  };

  const days: (keyof typeof formData.horarios)[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <Box sx={{ backgroundColor: '#2563EB', minHeight: '100vh', p: 3 }}>
      <Typography variant="h4" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', color: 'white', mb: 4 }}>
        Agregar Nuevo Negocio
      </Typography>
      <Box className="bg-white rounded-lg p-6 max-w-[1000px] mx-auto" style={{ boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)' }}>
        <div className="space-y-5">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <LabeledInput
            label="Nombre del Negocio"
            icon={<StorefrontIcon className="text-primary-blue" />}
            name="nombre"
            value={formData.nombre}
            placeholder="Ej. La Pizzería Italiana"
            onChange={handleInputChange}
          />

          <LabeledInput
            label="Número de Teléfono"
            icon={<PhoneIcon className="text-primary-blue" />}
            name="numero_telefono"
            value={formData.numero_telefono}
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
              value={businessTypes.find(bt => bt.value === formData.tipo_negocio) ? formData.tipo_negocio : 'personalizado'}
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

          {(formData.tipo_negocio === 'personalizado' || !businessTypes.find(bt => bt.value === formData.tipo_negocio)) && (
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
            value={formData.localidad}
            placeholder="Ej. Buenos Aires"
            onChange={handleInputChange}
          />

          <LabeledInput
            label="Dirección"
            icon={<LocationOnIcon className="text-primary-blue" />}
            name="direccion"
            value={formData.direccion}
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
                    value={formData.horarios[day as keyof typeof formData.horarios].open}
                    onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                  <input
                    type="time"
                    value={formData.horarios[day].close}
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
              value={formData.contexto}
              onChange={(e) => setFormData({ ...formData, contexto: e.target.value })}
              placeholder="Dale alguna sugerencia o aclaración extra al bot (opcional)..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-poppins"
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="contained"
              sx={{ backgroundColor: '#34C759', '&:hover': { backgroundColor: '#2EA44F' }, borderRadius: 2 }}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Negocio'}
            </Button>
          </div>
        </div>
      </Box>
    </Box>
  );
};

export default AddBusinessPage;