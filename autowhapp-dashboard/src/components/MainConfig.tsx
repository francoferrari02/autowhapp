import { useState, useEffect } from 'react';
import axios from 'axios';
import { Business, FAQ } from '../types';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useNegocio } from '../NegocioContext';
import { useAuth0 } from '@auth0/auth0-react';

const businessTypes = [
  { value: '', label: 'Seleccionar' },
  { value: 'tienda_online', label: 'Tienda Online (E-commerce): Para ventas de productos físicos o digitales.' },
  { value: 'moda', label: 'Moda y Ropa: Tiendas de ropa, calzado o accesorios.' },
  { value: 'restaurante', label: 'Restaurante o Cafetería: Negocios de comida y bebida.' },
  { value: 'agencia_viajes', label: 'Agencia de Viajes: Para reservas de vuelos, hoteles o paquetes turísticos.' },
  { value: 'hotel', label: 'Hotel o Hospedaje: Hoteles, hostales o Airbnb.' },
  { value: 'consultorio_medico', label: 'Consultorio Médico: Clínicas, médicos o especialistas.' },
  { value: 'veterinaria', label: 'Veterinaria: Servicios para mascotas.' },
  { value: 'gimnasio', label: 'Gimnasio o Centro de Fitness: Para clases, membresías o entrenamientos.' },
  { value: 'salon_belleza', label: 'Salón de Belleza o Spa: Citas para cortes de pelo, manicuras, masajes, etc.' },
  { value: 'inmobiliaria', label: 'Inmobiliaria: Venta o alquiler de propiedades.' },
  { value: 'educacion', label: 'Educación: Escuelas, cursos online o talleres.' },
  { value: 'concesionario', label: 'Concesionario de Autos: Venta de autos, pruebas de manejo o mantenimiento.' },
  { value: 'electronica', label: 'Tienda de Electrónica: Venta de dispositivos tecnológicos.' },
  { value: 'eventos', label: 'Eventos y Entretenimiento: Organizadores de eventos, bodas o venta de entradas.' },
  { value: 'profesionales', label: 'Servicios Profesionales: Abogados, contadores o consultores.' },
  { value: 'personalizado', label: 'Personalizado' },
];

// Para FAQs
type FaqWithId = {
  id?: number;
  question: string;
  answer: string;
  isNew?: boolean;
};

// Tipo para la respuesta de axios.post al crear una FAQ
interface CreateFaqResponse {
  success: boolean;
  id: number;
}

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

const MainConfig: React.FC<{ negocioId: number }> = ({ negocioId }) => {
  const { refreshNegocios } = useNegocio();
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<string>('');
  const [faqs, setFaqs] = useState<FaqWithId[]>([{ question: '', answer: '' }]);
  const [message, setMessage] = useState<string>('');
  const [customType, setCustomType] = useState<string>('');

  const defaultHours = {
    Lunes: { open: '09:00', close: '18:00' },
    Martes: { open: '09:00', close: '18:00' },
    Miércoles: { open: '09:00', close: '18:00' },
    Jueves: { open: '09:00', close: '18:00' },
    Viernes: { open: '09:00', close: '18:00' },
    Sábado: { open: '09:00', close: '18:00' },
    Domingo: { open: '09:00', close: '18:00' },
  };

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
          }
        });
        const businessRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/negocio/${negocioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = businessRes.data as any;
        console.log('Datos del negocio cargados:', data);
        let parsedHours: Record<string, { open: string; close: string }>;
        try {
          parsedHours = data.horarios ? JSON.parse(data.horarios) : defaultHours;
          const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
          const isValidHours = days.every(day =>
            parsedHours[day] && typeof parsedHours[day] === 'object' && 'open' in parsedHours[day] && 'close' in parsedHours[day]
          );
          if (!isValidHours) parsedHours = defaultHours;
        } catch (e) { parsedHours = defaultHours; }
        setBusiness({
          id: data.id,
          name: data.nombre,
          type: data.tipo_negocio,
          location: data.localidad,
          address: data.direccion,
          hours: parsedHours,
          isActive: data.estado_bot,
        });
        setContext((data.contexto || '') as string);
        setCustomType(businessTypes.find(bt => bt.value === data.tipo_negocio) ? '' : data.tipo_negocio);
      } catch (error) {
        setBusiness(null);
        const err = error as any;
        if (err.response?.status === 404) setError('Negocio no encontrado');
        else setError('Error al cargar la configuración');
      }
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
          }
        });
        const faqsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/faqs/${negocioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFaqs((faqsRes.data as any[]).map((f: any) => ({ id: f.id, question: f.pregunta, answer: f.respuesta })));
      } catch (error) {
        setFaqs([]);
      }
    };
    fetchData();
  }, [negocioId, getAccessTokenSilently]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (business) setBusiness({ ...business, [name]: value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (business) {
      if (value === 'personalizado') {
        setCustomType('');
        setBusiness({ ...business, type: 'personalizado' });
      } else {
        setCustomType('');
        setBusiness({ ...business, type: value });
      }
    }
  };

  const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomType(value);
    if (business) setBusiness({ ...business, type: value });
  };

  const handleHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    if (business) {
      setBusiness({
        ...business,
        hours: {
          ...business.hours,
          [day]: {
            ...business.hours[day],
            [field]: value,
          },
        },
      });
    }
  };

  // --- FAQ CRUD ---
  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqs(f => f.map((faq, i) => i === index ? { ...faq, [field]: value } : faq));
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '', isNew: true }]);
  };

  const removeFaq = async (index: number) => {
    const toDelete = faqs[index];
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      if (toDelete.id) {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/faqs/${toDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/faqs/${negocioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs((res.data as any[]).map((f: any) => ({ id: f.id, question: f.pregunta, answer: f.respuesta })));
      setMessage('FAQ eliminada con éxito');
    } catch (error: any) {
      setMessage(`Error al eliminar FAQ: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSave = async () => {
    if (!business) return;
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const updatedBusiness = {
        nombre: business.name,
        tipo_negocio: business.type,
        localidad: business.location,
        direccion: business.address,
        horarios: JSON.stringify(business.hours),
        contexto: context,
      };
      await axios.put(`${process.env.REACT_APP_API_URL}/api/negocio/${negocioId}`, updatedBusiness, {
        headers: { Authorization: `Bearer ${token}` }
      });
      for (const faq of faqs) {
        if (!faq.question.trim() || !faq.answer.trim()) {
          setMessage(`Error: La FAQ "${faq.question || 'sin pregunta'}" tiene campos vacíos. Por favor, completa ambos campos.`);
          return;
        }
        if (!faq.id) {
          const response = await axios.post<CreateFaqResponse>(`${process.env.REACT_APP_API_URL}/api/faqs`, {
            negocioId,
            pregunta: faq.question.trim(),
            respuesta: faq.answer.trim(),
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          faq.id = response.data.id;
        } else {
          await axios.put(`${process.env.REACT_APP_API_URL}/api/faqs/${faq.id}`, {
            pregunta: faq.question.trim(),
            respuesta: faq.answer.trim(),
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/faqs/${negocioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs((res.data as any[]).map((f: any) => ({ id: f.id, question: f.pregunta, answer: f.respuesta })));
      setMessage('Configuración guardada con éxito');
      refreshNegocios();
    } catch (error: any) {
      setMessage(`Error al guardar la configuración: ${error.response?.data?.error || error.message}`);
    }
  };

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  if (!business) return <div className="text-gray-500 font-poppins">Cargando datos del negocio...</div>;

  return (
    <div
      className="bg-white rounded-lg p-6 max-w-[1000px] mx-auto"
      style={{ boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)' }}
    >
      <h2 className="text-2xl font-bold text-black mb-6 font-poppins">Información de Negocio</h2>

      <div className="space-y-5">
        {/* Nombre con label + icono */}
        <LabeledInput
          label="Nombre del Negocio"
          icon={<StorefrontIcon className="text-primary-blue" />}
          name="name"
          value={business.name}
          placeholder="La Pizzería Italiana"
          onChange={handleInputChange}
        />

        {/* Select Tipo de Negocio con todas las opciones */}
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className="text-gray-700 font-semibold font-poppins">
            Tipo de Negocio
          </label>
          <select
            id="type"
            value={businessTypes.find(bt => bt.value === business.type) ? business.type : 'personalizado'}
            onChange={handleTypeChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-poppins"
          >
            {businessTypes.map(({ value, label }) => (
              <option key={value} value={value} disabled={value === ''}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Input para personalizar tipo, sólo aparece si se escoge personalizado o valor no está en opciones */}
        {(business.type === 'personalizado' || !businessTypes.find(bt => bt.value === business.type)) && (
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

        {/* Localidad con label + icono */}
        <LabeledInput
          label="Localidad"
          icon={<LocationOnIcon className="text-primary-blue" />}
          name="location"
          value={business.location}
          placeholder="Buenos Aires"
          onChange={handleInputChange}
        />

        {/* Dirección con label + icono */}
        <LabeledInput
          label="Dirección"
          icon={<LocationOnIcon className="text-primary-blue" />}
          name="address"
          value={business.address}
          placeholder="Av. Corrientes 123"
          onChange={handleInputChange}
        />

        {/* Horarios de Atención */}
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
                  value={business.hours && business.hours[day]?.open || '09:00'}
                  onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
                <input
                  type="time"
                  value={business.hours && business.hours[day]?.close || '18:00'}
                  onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Textarea sugerencias extra */}
        <div className="flex flex-col gap-1">
            <label htmlFor="context" className="flex items-center gap-2 text-gray-700 font-semibold font-poppins">
                <ChatBubbleOutlineIcon className="text-primary-blue" />
                Sugerencias/Aclaraciones para el Bot (Opcional)
            </label>
            <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Dale alguna sugerencia o aclaración extra al bot (opcional)..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-poppins"
                rows={4}
            />
        </div>

        {/* FAQs */}
        <h3 className="text-xl font-bold text-black mb-4 font-poppins">Preguntas Frecuentes (FAQs)</h3>
        {faqs.map((faq, index) => (
          <div key={index} className="flex flex-col md:flex-row gap-3 mb-4 items-center">
            <input
              type="text"
              value={faq.question}
              onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
              placeholder="Pregunta"
              style={{ background: 'white', color: 'black', border: '1px solid #2563EB', zIndex: 10 }}
              className="flex-1 p-2 rounded-lg font-poppins"
            />
            <input
              type="text"
              value={faq.answer}
              onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
              placeholder="Respuesta"
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-poppins"
            />
            <button
              onClick={() => removeFaq(index)}
              aria-label="Eliminar pregunta frecuente"
              title="Eliminar FAQ"
              className="text-primary-red hover:text-secondary-red p-2 rounded focus:outline-none"
            >
              <DeleteIcon />
            </button>
          </div>
        ))}
        <div className="flex justify-between mt-4">
          <button
            onClick={addFaq}
            style={{ background: '#2563EB', color: 'white', border: '2px solid #153E6F', zIndex: 10 }}
            className="px-4 py-2 rounded-lg font-poppins"
          >
            AÑADIR FAQ
          </button>
          <button
            onClick={handleSave}
            style={{ background: '#22C55E', color: 'white', border: '2px solid #15803D', zIndex: 10 }}
            className="px-4 py-2 rounded-lg font-poppins"
          >
            GUARDAR CAMBIOS
          </button>
        </div>
        {message && (
          <p className={`mt-4 font-poppins ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default MainConfig;