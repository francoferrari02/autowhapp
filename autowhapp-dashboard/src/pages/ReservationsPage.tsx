import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ModuleStatus from '../components/ModuleStatus';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Tipado para la respuesta del API
interface NegocioResponse {
  modulo_reservas: boolean;
  horarios_citas?: string;
  reservas?: { id: number; fecha_inicio: string; fecha_fin: string }[];
}

// Tipado para los eventos del calendario
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

const ReservationsPage: React.FC = () => {
  const { negocioId } = useNegocio();
  const [moduloReservas, setModuloReservas] = useState<boolean>(false);
  const [appointmentHours, setAppointmentHours] = useState<Record<string, { open: string; close: string }>>({
    Lunes: { open: '09:00', close: '18:00' },
    Martes: { open: '09:00', close: '18:00' },
    Miércoles: { open: '09:00', close: '18:00' },
    Jueves: { open: '09:00', close: '18:00' },
    Viernes: { open: '09:00', close: '18:00' },
    Sábado: { open: '09:00', close: '18:00' },
    Domingo: { open: '09:00', close: '18:00' },
  });
  const [reservations, setReservations] = useState<CalendarEvent[]>([]);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (negocioId !== null) {
      axios
        .get<NegocioResponse>(`http://localhost:3000/api/negocio/${negocioId}`)
        .then((res) => {
          setModuloReservas(!!res.data.modulo_reservas);
          if (res.data.horarios_citas) {
            try {
              const parsedHours = JSON.parse(res.data.horarios_citas);
              const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
              const isValidHours = days.every(day => 
                parsedHours[day] && typeof parsedHours[day] === 'object' && 'open' in parsedHours[day] && 'close' in parsedHours[day]
              );
              if (isValidHours) setAppointmentHours(parsedHours);
            } catch (e) {
              console.error('Error al parsear horarios de citas:', e);
            }
          }
          if (res.data.reservas) {
            setReservations(res.data.reservas.map((reserva) => ({
              id: reserva.id.toString(),
              title: 'Reserva',
              start: new Date(reserva.fecha_inicio),
              end: new Date(reserva.fecha_fin),
            })));
          }
        })
        .catch((err) => {
          console.error('Error al cargar estado de reservas:', err);
          setModuloReservas(false);
        });
    }
  }, [negocioId]);

  const handleToggleReservas = (nuevoEstado: boolean) => {
    if (negocioId == null) return;
    axios
      .post('http://localhost:3000/api/actualizar-modulo-reservas', { negocioId, moduloReservas: nuevoEstado })
      .then(() => {
        setModuloReservas(nuevoEstado);
      })
      .catch(err => {
        console.error('Error al actualizar estado de reservas:', err);
      });
  };

  const handleHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    setAppointmentHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleDateClick = (info: { dateStr: string; date: Date }) => {
    const dateStr = info.dateStr;
    const dayOfWeek = new Date(dateStr).toLocaleString('es-ES', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase());
    const hoursForDay = appointmentHours[dayOfWeek];
    if (!hoursForDay) return;

    const [startHour, startMinute] = hoursForDay.open.split(':').map(Number);
    const [endHour, endMinute] = hoursForDay.close.split(':').map(Number);
    const clickedHour = info.date.getHours();
    const clickedMinute = info.date.getMinutes();

    const clickedTimeInMinutes = clickedHour * 60 + clickedMinute;
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    if (clickedTimeInMinutes < startTimeInMinutes || clickedTimeInMinutes > endTimeInMinutes) {
      setMessage(`No se puede reservar fuera del horario: ${hoursForDay.open} - ${hoursForDay.close}`);
      return;
    }

    const newReservation = {
      title: 'Reserva',
      start: info.date,
      end: new Date(info.date.getTime() + 60 * 60 * 1000), // 1 hora por defecto
    };

    if (negocioId == null) return;
    axios
      .post<{ id: number }>(`http://localhost:3000/api/reservas/${negocioId}`, {
        fecha_inicio: newReservation.start.toISOString(),
        fecha_fin: newReservation.end.toISOString(),
      })
      .then((res) => {
        setReservations([...reservations, { ...newReservation, id: res.data.id.toString() }]);
        setMessage('Reserva añadida con éxito');
      })
      .catch((err) => {
        console.error('Error al añadir reserva:', err);
        setMessage('Error al añadir reserva');
      });
  };

  const saveSettings = async () => {
    if (negocioId == null) return;
    try {
      await axios.put(`http://localhost:3000/api/reservas/${negocioId}`, {
        horarios_citas: JSON.stringify(appointmentHours),
      });
      setMessage('Configuración de reservas guardada con éxito');
    } catch (error: any) {
      console.error('Error al guardar configuración de reservas:', error);
      setMessage(`Error al guardar: ${error.response?.data?.error || error.message}`);
    }
  };

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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
              <ModuleStatus
                moduleName="Reservas"
                active={moduloReservas}
                onToggle={handleToggleReservas}
              />
            </div>
          </Box>
          <Box sx={{ backgroundColor: 'white', padding: 6, borderRadius: 8, boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)' }}>
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mb: 4 }}>
              Horarios de las Citas
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 4, p: 3 }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccessTimeIcon sx={{ color: '#2563EB' }} />
                <Typography sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>
                  Horarios de Atención
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {days.map((day) => (
                  <Box key={day} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ width: 100, fontFamily: 'Poppins' }}>{day}</Typography>
                    <input
                      type="time"
                      value={appointmentHours[day].open}
                      onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                    <input
                      type="time"
                      value={appointmentHours[day].close}
                      onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </Box>
                ))}
              </Box>
            </Box>

            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mt: 4, mb: 2 }}>
              Reservas Programadas
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 4, p: 3 }}>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                events={reservations}
                dateClick={handleDateClick}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                height="auto"
                locale="es"
                eventColor="#34C759"
                eventTextColor="white"
                allDaySlot={false}
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
        </Box>
      </Box>
    </Box>
  );
};

export default ReservationsPage;