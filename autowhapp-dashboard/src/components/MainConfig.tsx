import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Switch, IconButton, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useNegocio } from '../NegocioContext';
import { useAuth0 } from '@auth0/auth0-react';
import { Business } from '../types';

// Definición de intervalos de atención con habilitado y múltiples franjas
interface Interval {
  open: string;
  close: string;
}
interface DaySchedule {
  enabled: boolean;
  intervals: Interval[];
}
type Day = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
type Horarios = Record<Day, DaySchedule>;

const days: Day[] = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

// Horarios por defecto: todos habilitados con un intervalo único
const defaultSchedules: Horarios = days.reduce((acc, day) => {
  acc[day] = { enabled: true, intervals: [{ open: '09:00', close: '18:00' }] };
  return acc;
}, {} as Horarios);

// Opciones de tipo de negocio
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
  { value: 'personalizado', label: 'Personalizado' }
];

type FaqWithId = { id?: number; question: string; answer: string };
interface CreateFaqResponse { success: boolean; id: number; }

// Componente para inputs con icono y label
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
      {icon}<span>{label}</span>
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

const MainConfig: React.FC<{ negocioId: number }> = ({ negocioId }) => {
  const { refreshNegocio } = useNegocio();
  const { getAccessTokenSilently } = useAuth0();
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<string>('');
  const [faqs, setFaqs] = useState<FaqWithId[]>([{ question: '', answer: '' }]);
  const [message, setMessage] = useState<string>('');
  const [customType, setCustomType] = useState<string>('');

  // Estado de horarios de atención
  const [schedules, setSchedules] = useState<Horarios>(defaultSchedules);

  // Handlers de horarios
  const handleToggleDay = (day: Day) => setSchedules(prev => ({
    ...prev,
    [day]: { ...prev[day], enabled: !prev[day].enabled }
  }));

  const handleIntervalChange = (day: Day, idx: number, field: 'open' | 'close', val: string) => setSchedules(prev => ({
    ...prev,
    [day]: {
      ...prev[day],
      intervals: prev[day].intervals.map((intv, i) => i === idx ? { ...intv, [field]: val } : intv)
    }
  }));

  const handleAddInterval = (day: Day) => setSchedules(prev => ({
    ...prev,
    [day]: { ...prev[day], intervals: [...prev[day].intervals, { open: '09:00', close: '18:00' }] }
  }));

  const handleRemoveInterval = (day: Day, idx: number) => setSchedules(prev => ({
    ...prev,
    [day]: { ...prev[day], intervals: prev[day].intervals.filter((_, i) => i !== idx) }
  }));

  // Función para obtener token
  const getToken = async () => getAccessTokenSilently({ authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE! } });

  // Carga inicial de datos del negocio
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const res = await axios.get<any>(`${process.env.REACT_APP_API_URL}/api/negocio/${negocioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data;

        // Parsear y cargar horarios
        if (data.horarios) {
          try {
            const parsed = typeof data.horarios === 'string' ? JSON.parse(data.horarios) : data.horarios;
            setSchedules(parsed);
          } catch (err) {
            console.error('Error parsing horarios:', err);
          }
        }

        // Cargar el resto del negocio
        setBusiness({
          id: data.id,
          name: data.nombre,
          type: data.tipo_negocio,
          location: data.localidad,
          address: data.direccion,
          hours: {},
          isActive: data.estado_bot
        });
        setContext(data.contexto || '');
      } catch (err: any) {
        setError(err.response?.status === 404 ? 'Negocio no encontrado' : 'Error al cargar la configuración');
      }

      // Carga de FAQs
      try {
        const token = await getToken();
        const resFaqs = await axios.get<any[]>(`${process.env.REACT_APP_API_URL}/api/faqs/${negocioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFaqs(resFaqs.data.map(f => ({ id: f.id, question: f.pregunta, answer: f.respuesta })));
      } catch {
        setFaqs([]);
      }
    };
    fetchData();
  }, [negocioId, getAccessTokenSilently]);

  // Handlers adicionales
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (business) setBusiness({ ...business, [name]: value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCustomType('');
    if (business) setBusiness({ ...business, type: value });
  };

  const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomType(value);
    if (business) setBusiness({ ...business, type: value });
  };

  // CRUD de FAQs
  const handleFaqChange = (idx: number, field: 'question' | 'answer', val: string) => {
    setFaqs(prev => prev.map((f, i) => i === idx ? { ...f, [field]: val } : f));
  };
  const addFaq = () => setFaqs(prev => [...prev, { question: '', answer: '' }]);
  const removeFaq = async (idx: number) => {
    const toDelete = faqs[idx];
    try {
      const token = await getToken();
      if (toDelete.id) {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/faqs/${toDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      const res = await axios.get<any[]>(`${process.env.REACT_APP_API_URL}/api/faqs/${negocioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs(res.data.map(f => ({ id: f.id, question: f.pregunta, answer: f.respuesta })));    
      setMessage('FAQ eliminada con éxito');
    } catch (err: any) {
      setMessage(`Error al eliminar FAQ: ${err.response?.data?.error || err.message}`);
    }
  };

  // Guardar configuración
  const handleSave = async () => {
    if (!business) return;
    try {
      const token = await getToken();
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/negocio/${negocioId}`,
        {
          nombre: business.name,
          tipo_negocio: business.type,
          localidad: business.location,
          direccion: business.address,
          horarios: schedules,
          contexto: context
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Guardar FAQs
      for (const faq of faqs) {
        if (!faq.question.trim() || !faq.answer.trim()) {
          setMessage(`Error: La FAQ "${faq.question || 'sin pregunta'}" tiene campos vacíos.`);
          return;
        }
        if (!faq.id) {
          const resFaq = await axios.post<CreateFaqResponse>(
            `${process.env.REACT_APP_API_URL}/api/faqs`,
            { negocioId, pregunta: faq.question.trim(), respuesta: faq.answer.trim() },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          faq.id = resFaq.data.id;
        } else {
          await axios.put(
            `${process.env.REACT_APP_API_URL}/api/faqs/${faq.id}`,
            { pregunta: faq.question.trim(), respuesta: faq.answer.trim() },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      const updatedFaqs = await axios.get<any[]>(`${process.env.REACT_APP_API_URL}/api/faqs/${negocioId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      setFaqs(updatedFaqs.data.map(f => ({ id: f.id, question: f.pregunta, answer: f.respuesta })));
      setMessage('Configuración guardada con éxito');
      refreshNegocio();
    } catch (err: any) {
      setMessage(`Error al guardar la configuración: ${err.response?.data?.error || err.message}`);
    }
  };

  if (error) return <div className="text-red-500 font-poppins">{error}</div>;
  if (!business) return <div className="text-gray-500 font-poppins">Cargando datos del negocio...</div>;

  return (
    <div className="bg-white rounded-lg p-6 max-w-[1000px] mx-auto" style={{ boxShadow: '0 0 7px rgba(0,0,0,0.2)' }}>
      <h2 className="text-2xl font-bold mb-6 font-poppins">Información de Negocio</h2>
      <div className="space-y-5">
        <LabeledInput
          label="Nombre del Negocio"
          icon={<StorefrontIcon className="text-primary-blue" />}
          name="name"
          value={business.name}
          placeholder="La Pizzería Italiana"
          onChange={handleInputChange}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className="text-gray-700 font-semibold font-poppins">Tipo de Negocio</label>
          <select
            id="type"
            value={businessTypes.some(bt => bt.value === business.type) ? business.type : 'personalizado'}
            onChange={handleTypeChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-blue font-poppins"
          >
            {businessTypes.map(bt => (
              <option key={bt.value} value={bt.value} disabled={bt.value === ''}>
                {bt.label}
              </option>
            ))}
          </select>
        </div>
        {(business.type === 'personalizado') && (
          <div className="mt-2">
            <LabeledInput
              label="Especifique el Tipo de Negocio"
              icon={null}
              name="customType"
              value={customType}
              placeholder="Personalizado"
              onChange={handleCustomTypeChange}
            />
          </div>
        )}
        <LabeledInput
          label="Localidad"
          icon={<LocationOnIcon className="text-primary-blue" />}
          name="location"
          value={business.location}
          placeholder="Buenos Aires"
          onChange={handleInputChange}
        />
        <LabeledInput
          label="Dirección"
          icon={<LocationOnIcon className="text-primary-blue" />}
          name="address"
          value={business.address}
          placeholder="Av. Corrientes 123"
          onChange={handleInputChange}
        />
        {/* Horarios de Atención */}
        <Box border={1} borderColor="grey.300" borderRadius={1} mb={4} p={2}>
          <Box display="flex" alignItems="center" px={3} py={2} bgcolor="grey.100">
            <AccessTimeIcon fontSize="small" />
            <Typography sx={{ ml: 1 }}>Horarios de Atención</Typography>
          </Box>
          <Box px={3} py={2}>
            {days.map(day => (
              <Box key={day} display="flex" alignItems="center" mb={1}>
                <Switch size="small" checked={schedules[day].enabled} onChange={() => handleToggleDay(day)} />
                <Typography variant="body2" sx={{ width: 80 }}>{day}</Typography>
                {schedules[day].enabled && schedules[day].intervals.map((interval, idx) => (
                  <Box key={idx} display="flex" alignItems="center" ml={1}>
                    <TextField
                      type="time"
                      variant="outlined"
                      size="small"
                      value={interval.open}
                      onChange={e => handleIntervalChange(day, idx, 'open', e.target.value)}
                      inputProps={{ step: 300 }}
                      sx={{ width: 140 }}
                    />
                    <Typography variant="body2" sx={{ mx: 0.5 }}>-</Typography>
                    <TextField
                      type="time"
                      variant="outlined"
                      size="small"
                      value={interval.close}
                      onChange={e => handleIntervalChange(day, idx, 'close', e.target.value)}
                      inputProps={{ step: 300 }}
                      sx={{ width: 140 }}
                    />
                    {schedules[day].intervals.length > 1 && (
                      <IconButton size="small" color="error" onClick={() => handleRemoveInterval(day, idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
                {schedules[day].enabled && (
                  <IconButton size="small" onClick={() => handleAddInterval(day)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        </Box>
        <div className="flex flex-col gap-1">
          <label htmlFor="context" className="flex items-center gap-2 font-semibold font-poppins">
            <ChatBubbleOutlineIcon className="text-primary-blue" /> Sugerencias/Aclaraciones (Opcional)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Aclaraciones para el bot..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-blue font-poppins"
            rows={4}
          />
        </div>
        <h3 className="text-xl font-bold mb-4 font-poppins">Preguntas Frecuentes</h3>
        {faqs.map((faq, idx) => (
          <div key={idx} className="flex flex-col md:flex-row gap-3 mb-4 items-center">
            <input
              type="text"
              value={faq.question}
              onChange={e => handleFaqChange(idx, 'question', e.target.value)}
              placeholder="Pregunta"
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-primary-blue font-poppins"
            />
            <input
              type="text"
              value={faq.answer}
              onChange={e => handleFaqChange(idx, 'answer', e.target.value)}
              placeholder="Respuesta"
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-primary-blue font-poppins"
            />
            <IconButton onClick={() => removeFaq(idx)} color="error" size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        ))}
        <div className="flex justify-between mt-4">
          <IconButton onClick={addFaq} size="small"><AddIcon /></IconButton>
          <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded-lg font-poppins">
            GUARDAR
          </button>
        </div>
        {message && <p className={`mt-4 font-poppins ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
      </div>
    </div>
  );
};

export default MainConfig;
