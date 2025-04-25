import { useState } from 'react';
import { Business, FAQ } from '../types';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

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

const MainConfig: React.FC = () => {
  const mockBusinessData: Business = {
    id: 1,
    name: 'La Pizzería Italiana',
    type: 'restaurante',
    location: 'Buenos Aires',
    address: 'Av. Corrientes 123',
    hours: {
      Lunes: { open: '12:00', close: '23:00' },
      Martes: { open: '12:00', close: '23:00' },
      Miércoles: { open: '12:00', close: '23:00' },
      Jueves: { open: '12:00', close: '23:00' },
      Viernes: { open: '12:00', close: '23:00' },
      Sábado: { open: '12:00', close: '23:00' },
      Domingo: { open: '12:00', close: '23:00' },
    },
    isActive: true,
  };

  const mockContext = 'Eres el contestador de la pizzería Bongusto en Buenos Aires...';
  const mockFaqs: FAQ[] = [
    { question: '¿Tienen delivery?', answer: 'Sí, hacemos envíos a domicilio.' },
    { question: '¿Cuál es el horario?', answer: 'Abrimos de 12:00 a 23:00 todos los días.' },
  ];

  const [business, setBusiness] = useState<Business>(mockBusinessData);
  const [context, setContext] = useState<string>(mockContext);
  const [faqs, setFaqs] = useState<FAQ[]>(mockFaqs);
  const [message, setMessage] = useState<string>('');

  // Estado extra para valor personalizado en tipo negocio
  const [customType, setCustomType] = useState<string>(
    businessTypes.find(bt => bt.value === business.type) ? '' : business.type
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBusiness({ ...business, [name]: value });
  };

  // Modifica para mostrar input personalizado si se elige esa opción
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // Si elige personalizado limpia customType para que el usuario escriba ahí
    if (value === 'personalizado') {
      setCustomType('');
      setBusiness({ ...business, type: 'personalizado' });
    } else {
      setCustomType('');
      setBusiness({ ...business, type: value });
    }
  };

  // Cuando el usuario escribe el tipo personalizado también actualizamos el business.type
  const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomType(value);
    setBusiness({ ...business, type: value });
  };

  const handleHoursChange = (day: string, field: 'open' | 'close', value: string) => {
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
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    setFaqs(updatedFaqs);
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setMessage('Configuración guardada con éxito (simulado)');
    const prompt = `Eres el asistente de ${business.name}, un ${business.type} ubicado en ${business.location}, ${business.address}. Estamos abiertos ${Object.entries(business.hours)
      .map(([day, times]) => `${day} de ${times.open} a ${times.close}`)
      .join(', ')}. Responde amablemente a las consultas de los clientes. Contexto adicional: ${context}. FAQs: ${faqs
      .map((faq) => `Pregunta: ${faq.question}, Respuesta: ${faq.answer}`)
      .join('; ')}`;
    console.log('Simulando envío a n8n:', {
      negocioId: business.id,
      contexto: prompt,
    });
  };

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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
                  value={business.hours[day].open}
                  onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
                <input
                  type="time"
                  value={business.hours[day].close}
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
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-poppins"
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

        {/* Botones */}
        <div className="flex justify-between mt-4">
            <button
                onClick={addFaq}
                className="bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-[#153E6F] font-poppins"
            >
                AÑADIR FAQ
            </button>
            <button
                onClick={handleSave}
                className="bg-primary-green text-white px-4 py-2 rounded-lg hover:bg-secondary-green font-poppins"
            >
                GUARDAR CAMBIOS
            </button>
        </div>

        {/* Mensaje */}
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