import React, { useState } from 'react';
import { Card, CardContent, Typography, TextField, MenuItem, Select, Button, Accordion, AccordionSummary, AccordionDetails, SelectChangeEvent, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StoreIcon from '@mui/icons-material/Store';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Business, FAQ } from '../types';

const MainConfig: React.FC = () => {
  // Datos mockeados para simular la respuesta del backend
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBusiness({ ...business, [name]: value });
  };

  const handleTypeChange = (e: SelectChangeEvent<string>) => {
    setBusiness({ ...business, type: e.target.value });
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
    // Simular el guardado de datos (en lugar de enviar al backend)
    setMessage('Configuración guardada con éxito (simulado)');

    // Simular el envío a n8n
    const prompt = `Eres el asistente de ${business.name}, un ${business.type} ubicado en ${business.location}, ${business.address}. Estamos abiertos ${Object.entries(business.hours).map(([day, times]) => `${day} de ${times.open} a ${times.close}`).join(', ')}. Responde amablemente a las consultas de los clientes. Contexto adicional: ${context}. FAQs: ${faqs.map(faq => `Pregunta: ${faq.question}, Respuesta: ${faq.answer}`).join('; ')}`;
    console.log('Simulando envío a n8n:', {
      negocioId: business.id,
      contexto: prompt,
    });
  };

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <Card sx={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '12px', padding: '24px' }}>
      <CardContent>
        <Typography variant="h5" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', marginBottom: '16px' }}>
          Configuración Principal
        </Typography>
        <TextField
          fullWidth
          label="Nombre del Negocio"
          name="name"
          value={business.name}
          onChange={handleInputChange}
          placeholder="La Pizzería Italiana"
          variant="outlined"
          sx={{ marginBottom: '16px' }}
          InputProps={{ startAdornment: <StoreIcon sx={{ color: '#4B5563', marginRight: '8px' }} /> }}
        />
        <Select
          fullWidth
          value={business.type}
          onChange={handleTypeChange}
          displayEmpty
          sx={{ marginBottom: '16px' }}
        >
          <MenuItem value="" disabled>Seleccionar</MenuItem>
          <MenuItem value="restaurante">Restaurante</MenuItem>
          <MenuItem value="veterinaria">Veterinaria</MenuItem>
          <MenuItem value="consultorio">Consultorio Médico</MenuItem>
          <MenuItem value="personalizado">Personalizado</MenuItem>
        </Select>
        <TextField
          fullWidth
          label="Localidad"
          name="location"
          value={business.location}
          onChange={handleInputChange}
          placeholder="Buenos Aires"
          variant="outlined"
          sx={{ marginBottom: '16px' }}
          InputProps={{ startAdornment: <LocationOnIcon sx={{ color: '#4B5563', marginRight: '8px' }} /> }}
        />
        <TextField
          fullWidth
          label="Dirección"
          name="address"
          value={business.address}
          onChange={handleInputChange}
          placeholder="Av. Corrientes 123"
          variant="outlined"
          sx={{ marginBottom: '16px' }}
          InputProps={{ startAdornment: <LocationOnIcon sx={{ color: '#4B5563', marginRight: '8px' }} /> }}
        />
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <AccessTimeIcon sx={{ color: '#4B5563', marginRight: '8px' }} />
            <Typography sx={{ fontFamily: 'Poppins' }}>Horarios de Atención</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {days.map((day) => (
              <div key={day} style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                <Typography sx={{ width: '100px', fontFamily: 'Poppins' }}>{day}</Typography>
                <TextField
                  type="time"
                  value={business.hours[day].open}
                  onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                />
                <TextField
                  type="time"
                  value={business.hours[day].close}
                  onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                />
              </div>
            ))}
          </AccordionDetails>
        </Accordion>
        <TextField
          fullWidth
          label="Contexto del Bot"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Ej: Eres el contestador de la pizzería Bongusto en Buenos Aires..."
          variant="outlined"
          multiline
          rows={4}
          sx={{ marginBottom: '16px', marginTop: '16px' }}
        />
        <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', marginBottom: '16px' }}>
          Preguntas Frecuentes (FAQs)
        </Typography>
        {faqs.map((faq, index) => (
          <Box key={index} sx={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
            <TextField
              fullWidth
              label="Pregunta"
              value={faq.question}
              onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
              placeholder="Escribe la pregunta..."
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Respuesta"
              value={faq.answer}
              onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
              placeholder="Escribe la respuesta..."
              variant="outlined"
            />
            <Button
              variant="contained"
              sx={{ backgroundColor: '#EF4444', '&:hover': { backgroundColor: '#DC2626' } }}
              onClick={() => removeFaq(index)}
            >
              Eliminar
            </Button>
          </Box>
        ))}
        <Button
          variant="contained"
          sx={{ backgroundColor: '#1E3A8A', marginBottom: '16px', '&:hover': { backgroundColor: '#153E6F' } }}
          onClick={addFaq}
        >
          Añadir FAQ
        </Button>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#34C759', marginTop: '16px', borderRadius: '8px', '&:hover': { backgroundColor: '#2EA44F' } }}
          onClick={handleSave}
        >
          Guardar Cambios
        </Button>
        {message && (
          <Typography sx={{ color: message.includes('Error') ? 'red' : 'green', marginTop: '16px' }}>
            {message}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MainConfig;