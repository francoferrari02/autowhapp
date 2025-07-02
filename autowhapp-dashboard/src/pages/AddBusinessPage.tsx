import React, { useState } from 'react';
import { Box, Button, TextField, MenuItem, Typography, Switch, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
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

// Componente para input con label, icono y prefijo opcional
const LabeledInput: React.FC<{
  label: string;
  icon: React.ReactNode;
  name: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
}> = ({ label, icon, name, value, placeholder, onChange, prefix }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={name} className="flex items-center gap-1 text-gray-700 font-semibold font-poppins">
      {icon}
      <span>{label}</span>
    </label>
    <div className="flex">
      {prefix && (
        <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
          {prefix}
        </span>
      )}
      <input
        id={name}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        className={`w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-poppins ${prefix ? 'rounded-l-none' : ''}`}
      />
    </div>
  </div>
);

// Definición de intervalos de atención con habilitado y múltiples franjas
interface Interval {
  open: string;
  close: string;
}
interface DaySchedule {
  enabled: boolean;
  intervals: Interval[];
}

type Horarios = Record<string, DaySchedule>;

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

// Horarios por defecto: todos habilitados con un intervalo único
const defaultHorarios: Horarios = {
  Lunes:    { enabled: true, intervals: [{ open: '09:00', close: '18:00' }] },
  Martes:   { enabled: true, intervals: [{ open: '09:00', close: '18:00' }] },
  Miércoles:{ enabled: true, intervals: [{ open: '09:00', close: '18:00' }] },
  Jueves:   { enabled: true, intervals: [{ open: '09:00', close: '18:00' }] },
  Viernes:  { enabled: true, intervals: [{ open: '09:00', close: '18:00' }] },
  Sábado:   { enabled: true, intervals: [{ open: '09:00', close: '18:00' }] },
  Domingo:  { enabled: true, intervals: [{ open: '09:00', close: '18:00' }] }
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

  // Días de la semana
  const days = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

  // Maneja cambios de inputs básicos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value: raw } = e.target;
    const value = name === 'numero_telefono' ? raw.replace(/\D/g, '') : raw;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Cambia el tipo de negocio
  const handleTypeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const v = e.target.value as string;
    if (v === 'personalizado') {
      setCustomType('');
      setFormData(prev => ({ ...prev, tipo_negocio: 'personalizado' }));
    } else {
      setCustomType('');
      setFormData(prev => ({ ...prev, tipo_negocio: v }));
    }
  };
  const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCustomType(v);
    setFormData(prev => ({ ...prev, tipo_negocio: v }));
  };

  // Horarios: toggle día
  const handleToggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [day]: { ...prev.horarios[day], enabled: !prev.horarios[day].enabled }
      }
    }));
  };
  // Horarios: cambia intervalos
  const handleIntervalChange = (day: string, idx: number, field: 'open' | 'close', val: string) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [day]: {
          ...prev.horarios[day],
          intervals: prev.horarios[day].intervals.map((int, i) => i === idx ? { ...int, [field]: val } : int)
        }
      }
    }));
  };
  // Horarios: agregar intervalo
  const handleAddInterval = (day: string) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [day]: { ...prev.horarios[day], intervals: [...prev.horarios[day].intervals, { open: '09:00', close: '18:00' }] }
      }
    }));
  };
  // Horarios: eliminar intervalo
  const handleRemoveInterval = (day: string, idx: number) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [day]: { ...prev.horarios[day], intervals: prev.horarios[day].intervals.filter((_,i) => i!==idx) }
      }
    }));
  };

  // Guardar negocio
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!process.env.REACT_APP_API_URL) throw new Error('API URL no configurada');
      const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE } });
      const apiUrl = `${process.env.REACT_APP_API_URL.trim()}/api/negocios`;
      const telefonoConPrefijo = `+54${formData.numero_telefono}`;
      const dataToSend = {...formData, numero_telefono: telefonoConPrefijo};
      const res = await axios.post<BusinessResponse>(apiUrl, dataToSend, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' },
        timeout:5000
      });
      if (res.status===201||res.status===200) {
        await refreshNegocios();
        navigate('/dashboard');
      } else throw new Error('Respuesta inesperada: '+res.status);
    } catch(err:any) {
      setError(err.response?.data?.message||err.message||'Error al guardar el negocio');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ backgroundColor:'#2563EB', minHeight:'100vh', p:3 }}>
      <Typography variant="h4" sx={{ fontFamily:'Poppins', fontWeight:'bold', color:'white', mb:4 }}>
        Bienvenido!
      </Typography>
      <Box className="bg-white rounded-lg p-6 max-w-[1000px] mx-auto" sx={{ boxShadow:'0 0 7px rgba(0,0,0,0.2)' }}>
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
            placeholder="Ej. 112345678"
            onChange={handleInputChange}
            prefix="+54"
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="tipo_negocio" className="text-gray-700 font-semibold font-poppins">Tipo de Negocio</label>
            <TextField
              id="tipo_negocio"
              select
              value={businessTypes.find(bt=>bt.value===formData.tipo_negocio)?formData.tipo_negocio:'personalizado'}
              onChange={handleTypeChange}
              fullWidth
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'8px' } }}
            >
              {businessTypes.map(({value,label})=> (
                <MenuItem key={value} value={value} disabled={value===''}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </div>

          {(formData.tipo_negocio==='personalizado'||!businessTypes.find(bt=>bt.value===formData.tipo_negocio)) && (
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

          {/* Horarios de Atención con indicadores y multi-intervalos */}
          <Box border={1} borderColor="grey.300" borderRadius={1} mb={4} p={2}>
            <Box display="flex" alignItems="center" px={3} py={2} bgcolor="grey.100">
              <AccessTimeIcon fontSize="small" />
              <Typography variant="subtitle1" sx={{ ml:1 }}>Horarios de Atención</Typography>
            </Box>
            <Box px={3} py={2}>
              {days.map(day=> (
                <Box key={day} display="flex" alignItems="center" mb={1}>
                  <Switch size="small" checked={formData.horarios[day].enabled} onChange={()=>handleToggleDay(day)} />
                  <Typography variant="body2" sx={{ width:80 }}>{day}</Typography>
                  {formData.horarios[day].enabled && formData.horarios[day].intervals.map((interval,idx) => (
                    <Box key={idx} display="flex" alignItems="center" ml={1}>
                      <TextField
                        type="time"
                        variant="outlined"
                        size="small"
                        value={interval.open}
                        onChange={e=>handleIntervalChange(day,idx,'open',e.target.value)}
                        inputProps={{ step:300 }}
                        sx={{ width:140 }}
                      />
                      <Typography variant="body2" sx={{ mx:0.5 }}>-</Typography>
                      <TextField
                        type="time"
                        variant="outlined"
                        size="small"
                        value={interval.close}
                        onChange={e=>handleIntervalChange(day,idx,'close',e.target.value)}
                        inputProps={{ step:300 }}
                        sx={{ width:140 }}
                      />
                      {formData.horarios[day].intervals.length>1 && (
                        <IconButton size="small" color="error" onClick={()=>handleRemoveInterval(day,idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  {formData.horarios[day].enabled && (
                    <IconButton size="small" onClick={()=>handleAddInterval(day)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          <div className="flex flex-col gap-1">
            <label htmlFor="contexto" className="flex items-center gap-2 text-gray-700 font-semibold font-poppins">
              <ChatBubbleOutlineIcon className="text-primary-blue" /> Sugerencias/Aclaraciones para el Bot (Opcional)
            </label>
            <textarea
              id="contexto"
              value={formData.contexto}
              onChange={(e)=>setFormData(prev=>({...prev,contexto:e.target.value}))}
              placeholder="Dale alguna sugerencia o aclaración extra al bot (opcional)..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-poppins"
              rows={4}
            />
          </div>

          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              sx={{ backgroundColor:'#34C759','&:hover':{backgroundColor:'#2EA44F'},borderRadius:2 }}
              onClick={handleSave}
              disabled={loading}
            >
              {loading?'Guardando...':'Guardar Negocio'}
            </Button>
          </Box>
        </div>
      </Box>
    </Box>
  );
};

export default AddBusinessPage;
