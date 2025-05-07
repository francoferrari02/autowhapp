import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Modal } from '@mui/material';
import CalendarComponent from '../components/Calendar';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ModuleStatus from '../components/ModuleStatus';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { CalendarEvent } from '../types';

// Tipado para la respuesta del API
interface NegocioResponse {
  modulo_reservas: boolean;
  horarios?: string | Record<string, { open: string; close: string }>;
  reservas?: { id: number; fecha_inicio: string; fecha_fin: string; cliente?: string; telefono?: string; descripcion?: string }[];
  appointment_duration?: number;
  break_between?: number;
}

const ReservationsPage: React.FC = () => {
  const { negocioId } = useNegocio();
  const [moduloReservas, setModuloReservas] = useState<boolean>(false);
  const [appointmentHours, setAppointmentHours] = useState<Record<string, { open: string; close: string }>>({});
  const [reservations, setReservations] = useState<CalendarEvent[]>([]);
  const [message, setMessage] = useState<string>('');
  const [appointmentDuration, setAppointmentDuration] = useState<number>(60);
  const [breakBetween, setBreakBetween] = useState<number>(15);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (negocioId !== null) {
      axios
        .get<NegocioResponse>(`http://localhost:3000/api/negocio/${negocioId}`)
        .then((res) => {
          setModuloReservas(!!res.data.modulo_reservas);
          if (res.data.horarios) {
            try {
              let parsedHours: Record<string, { open: string; close: string }>;
              if (typeof res.data.horarios === 'string') {
                console.log('Horarios recibidos (string):', res.data.horarios);
                parsedHours = JSON.parse(res.data.horarios);
              } else {
                console.log('Horarios recibidos (objeto):', res.data.horarios);
                parsedHours = res.data.horarios;
              }
              console.log('Horarios parseados:', parsedHours);
              console.log('Claves de horarios:', Object.keys(parsedHours));
              setAppointmentHours(parsedHours);
            } catch (e) {
              console.error('Error al parsear horarios:', e);
              console.error('Valor de horarios que causó el error:', res.data.horarios);
              // Establecer un valor por defecto en caso de error
              setAppointmentHours({
                Lunes: { open: '09:00', close: '18:00' },
                Martes: { open: '09:00', close: '18:00' },
                Miércoles: { open: '09:00', close: '18:00' },
                Jueves: { open: '09:00', close: '18:00' },
                Viernes: { open: '09:00', close: '18:00' },
                Sábado: { open: '09:00', close: '18:00' },
                Domingo: { open: '09:00', close: '18:00' },
              });
            }
          } else {
            console.log('No se recibieron horarios, usando valores por defecto');
            setAppointmentHours({
              Lunes: { open: '09:00', close: '18:00' },
              Martes: { open: '09:00', close: '18:00' },
              Miércoles: { open: '09:00', close: '18:00' },
              Jueves: { open: '09:00', close: '18:00' },
              Viernes: { open: '09:00', close: '18:00' },
              Sábado: { open: '09:00', close: '18:00' },
              Domingo: { open: '09:00', close: '18:00' },
            });
          }
          if (res.data.reservas) {
            const mappedReservations = res.data.reservas.map((reserva) => ({
              id: reserva.id.toString(),
              title: 'Reserva',
              start: new Date(reserva.fecha_inicio),
              end: new Date(reserva.fecha_fin),
              cliente: reserva.cliente,
              telefono: reserva.telefono,
              descripcion: reserva.descripcion,
              backgroundColor: '#FF5733',
            }));
            console.log('Reservas mapeadas:', mappedReservations);
            setReservations(mappedReservations);
          }
          setAppointmentDuration(res.data.appointment_duration || 60);
          setBreakBetween(res.data.break_between || 15);
          generateAvailableSlots();
        })
        .catch((err) => {
          console.error('Error al cargar estado de reservas:', err);
          setModuloReservas(false);
          setAppointmentHours({});
          setReservations([]);
        });
    }
  }, [negocioId]);

  // Generar bloques de tiempo disponibles
  const generateAvailableSlots = () => {
    const slots: CalendarEvent[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Establecer a medianoche
    console.log('Fecha base para slots:', today);

    // Usar las claves reales de appointmentHours
    const days = Object.keys(appointmentHours);
    const dayOrder = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    days.forEach((day) => {
      const hours = appointmentHours[day];
      console.log(`Verificando horas para ${day}:`, hours);
      if (!hours || !hours.open || !hours.close) {
        console.log(`Sin horarios para ${day}`);
        return;
      }

      const [openHour, openMinute] = hours.open.split(':').map(Number);
      const [closeHour, closeMinute] = hours.close.split(':').map(Number);

      let currentTime = new Date(today);
      const dayIndex = dayOrder.indexOf(day);
      if (dayIndex === -1) {
        console.log(`Día ${day} no encontrado en dayOrder`);
        return;
      }
      currentTime.setDate(today.getDate() + (dayIndex - (new Date().getDay() || 7) + 7) % 7); // Ajustar al día correcto
      currentTime.setHours(openHour, openMinute, 0, 0);
      const endTime = new Date(currentTime);
      endTime.setHours(closeHour, closeMinute, 0, 0);
      console.log(`Generando slots para ${day}: ${currentTime.toISOString()} a ${endTime.toISOString()}`);

      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + appointmentDuration * 60 * 1000);
        if (slotEnd > endTime) break;

        const isOccupied = reservations.some(
          (res) =>
            new Date(res.start).toISOString().slice(0, -5) < slotEnd.toISOString().slice(0, -5) &&
            new Date(res.end).toISOString().slice(0, -5) > currentTime.toISOString().slice(0, -5) &&
            res.title === 'Reserva'
        );
        console.log(`Verificando ocupación para ${currentTime.toLocaleString()} - ${slotEnd.toLocaleString()}: ${isOccupied}`);

        if (!isOccupied) {
          slots.push({
            id: `slot-${dayIndex}-${currentTime.getTime()}`,
            title: 'Disponible',
            start: new Date(currentTime),
            end: slotEnd,
            backgroundColor: '#34C759',
          });
        }
        currentTime = new Date(currentTime.getTime() + (appointmentDuration + breakBetween) * 60 * 1000);
      }
    });

    console.log('Slots generados:', slots);
    setReservations((prev) => [...prev.filter((e) => e.title === 'Reserva'), ...slots]);
  };

  const handleToggleReservas = (nuevoEstado: boolean) => {
    if (negocioId == null) return;
    axios
      .post('http://localhost:3000/api/actualizar-modulo-reservas', { negocioId, moduloReservas: nuevoEstado })
      .then(() => setModuloReservas(nuevoEstado))
      .catch((err) => console.error('Error al actualizar estado de reservas:', err));
  };

  const handleDateClick = (clickedTime: Date) => {
    if (!moduloReservas || !negocioId) return;

    const dayOfWeek = clickedTime.toLocaleString('es-ES', { weekday: 'long', timeZone: 'America/Argentina/Buenos_Aires' }).replace(/^\w/, (c) => c.toUpperCase());
    const hoursForDay = appointmentHours[dayOfWeek];
    if (!hoursForDay) {
      setMessage('No hay horarios definidos para este día');
      return;
    }

    const [openHour, openMinute] = hoursForDay.open.split(':').map(Number);
    const [closeHour, closeMinute] = hoursForDay.close.split(':').map(Number);
    const dayStart = new Date(clickedTime);
    dayStart.setHours(openHour, openMinute, 0, 0);
    dayStart.setFullYear(clickedTime.getFullYear(), clickedTime.getMonth(), clickedTime.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(closeHour, closeMinute, 0, 0);

    if (clickedTime < dayStart || clickedTime >= dayEnd) {
      setMessage('Hora fuera del horario de atención');
      return;
    }

    const newReservation = {
      title: 'Reserva',
      start: clickedTime,
      end: new Date(clickedTime.getTime() + appointmentDuration * 60 * 1000),
      backgroundColor: '#FF5733',
    };

    axios
      .post<{ id: number }>(`http://localhost:3000/api/reservas/${negocioId}`, {
        fecha_inicio: newReservation.start.toISOString(),
        fecha_fin: newReservation.end.toISOString(),
      })
      .then((res) => {
        setReservations((prev) => [
          ...prev.filter((e) => e.title === 'Reserva'),
          { ...newReservation, id: res.data.id.toString() },
        ]);
        setMessage('Reserva añadida con éxito');
        generateAvailableSlots();
      })
      .catch((err) => {
        console.error('Error al añadir reserva:', err);
        setMessage(err.response?.data?.error || 'Error al añadir reserva');
      });
  };

  const handleEventClick = (info: { event: any }) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      cliente: event.extendedProps.cliente,
      telefono: event.extendedProps.telefono,
      descripcion: event.extendedProps.descripcion,
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedEvent(null);
  };

  const saveSettings = async () => {
    if (negocioId == null) return;
    try {
      await axios.put(`http://localhost:3000/api/reservas/${negocioId}`, {
        appointmentDuration,
        breakBetween,
      });
      setMessage('Configuración guardada con éxito');
      generateAvailableSlots();
    } catch (error: any) {
      console.error('Error al guardar configuración:', error);
      setMessage(`Error al guardar: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#2563EB', minHeight: '100vh' }}>
      <Header />
      <Box display="flex">
        <Sidebar selected="reservations" />
        <Box flexGrow={1} sx={{ padding: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={4}>
            <h2 className="text-2xl font-poppins font-bold text-white" style={{ marginTop: '0.5rem' }}>
              Configuración de Reservas
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', maxWidth: '480px' }}>
              <ModuleStatus moduleName="Reservas" active={moduloReservas} onToggle={handleToggleReservas} />
            </div>
          </Box>
          <Box sx={{ backgroundColor: 'white', padding: 6, borderRadius: 8, boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)' }}>
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mb: 4 }}>
              Configuración de Citas
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 4, p: 3 }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccessTimeIcon sx={{ color: '#2563EB' }} />
                <Typography sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>
                  Duración y Espaciado
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Duración de la cita (minutos)"
                  type="number"
                  value={appointmentDuration}
                  onChange={(e) => setAppointmentDuration(Number(e.target.value))}
                  sx={{ width: 200 }}
                />
                <TextField
                  label="Espacio entre citas (minutos)"
                  type="number"
                  value={breakBetween}
                  onChange={(e) => setBreakBetween(Number(e.target.value))}
                  sx={{ width: 200 }}
                />
              </Box>
            </Box>

            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mt: 4, mb: 2 }}>
              Reservas Programadas
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 4, p: 3 }}>
              <CalendarComponent
                events={reservations}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            </Box>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={saveSettings}
                sx={{ backgroundColor: '#34C759', color: 'white', '&:hover': { backgroundColor: '#2EA44F' } }}
              >
                Guardar Cambios
              </Button>
            </Box>
            {message && (
              <Typography sx={{ mt: 2, color: message.includes('Error') ? 'red' : 'green' }}>
                {message}
              </Typography>
            )}
          </Box>

          {/* Modal para detalles de la reserva */}
          <Modal open={openModal} onClose={handleCloseModal}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'white',
                borderRadius: 4,
                boxShadow: 24,
                p: 4,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mb: 2 }}>
                Detalles de la Reserva
              </Typography>
              {selectedEvent && (
                <>
                  <Typography>Cliente: {selectedEvent.cliente || 'No especificado'}</Typography>
                  <Typography>Teléfono: {selectedEvent.telefono || 'No especificado'}</Typography>
                  <Typography>
                    Horario: {selectedEvent.start.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit' })} - {selectedEvent.end.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Typography>Descripción: {selectedEvent.descripcion || 'Sin descripción'}</Typography>
                </>
              )}
              <Button onClick={handleCloseModal} sx={{ mt: 2 }}>
                Cerrar
              </Button>
            </Box>
          </Modal>
        </Box>
      </Box>
    </Box>
  );
};

export default ReservationsPage;