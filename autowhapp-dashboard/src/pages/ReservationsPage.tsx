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

interface NegocioResponse {
  modulo_reservas: boolean;
  horarios?: string | Record<string, { open: string; close: string }>;
  reservas?: {
    id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    ocupado: number;
    cliente?: string;
    telefono?: string;
    descripcion?: string;
  }[];
  appointment_duration?: number;
  break_between?: number;
  hora_inicio_default?: string;
  hora_fin_default?: string;
}

const ReservationsPage: React.FC = () => {
  const { negocioId } = useNegocio();
  const [moduloReservas, setModuloReservas] = useState<boolean>(false);
  const [appointmentHours, setAppointmentHours] = useState<Record<string, { open: string; close: string }>>({});
  const [reservas, setReservas] = useState<CalendarEvent[]>([]);
  const [message, setMessage] = useState<string>('');
  const [appointmentDuration, setAppointmentDuration] = useState<number>(60);
  const [breakBetween, setBreakBetween] = useState<number>(15);
  const [horaInicioDefault, setHoraInicioDefault] = useState<string>('09:00');
  const [horaFinDefault, setHoraFinDefault] = useState<string>('18:00');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const [newReservation, setNewReservation] = useState({
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    cliente: '',
    telefono: '',
    descripcion: '',
  });

  // Función para cargar las reservas desde el servidor
  const fetchReservas = async () => {
    if (!negocioId) return;

    try {
      const res = await axios.get<NegocioResponse>(`http://localhost:3000/api/negocio/${negocioId}`);
      const fetchedReservas = res.data.reservas
        ?.filter((reserva) => reserva.ocupado === 1)
        .map((reserva) => ({
          id: reserva.id.toString(),
          title: 'Reserva',
          start: new Date(`${reserva.fecha}T${reserva.hora_inicio}:00Z`),
          end: new Date(`${reserva.fecha}T${reserva.hora_fin}:00Z`),
          cliente: reserva.cliente,
          telefono: reserva.telefono,
          descripcion: reserva.descripcion,
          backgroundColor: '#FF5733',
        })) || [];

      // Comparar las reservas actuales con las nuevas para evitar actualizaciones innecesarias
      setReservas((prevReservas) => {
        const prevIds = prevReservas.map(r => r.id);
        const newIds = fetchedReservas.map(r => r.id);
        const hasChanges = prevIds.length !== newIds.length || prevIds.some((id, index) => id !== newIds[index]);
        return hasChanges ? fetchedReservas : prevReservas;
      });
    } catch (err) {
      console.error('Error al cargar reservas:', err);
    }
  };

  // Cargar datos iniciales y configurar polling
  useEffect(() => {
    if (negocioId === null) {
      setModuloReservas(false);
      setAppointmentHours({});
      setReservas([]);
      return;
    }

    const loadInitialData = async () => {
      try {
        const res = await axios.get<NegocioResponse>(`http://localhost:3000/api/negocio/${negocioId}`);
        setModuloReservas(!!res.data.modulo_reservas);

        if (res.data.horarios) {
          try {
            let parsedHours: Record<string, { open: string; close: string }>;
            if (typeof res.data.horarios === 'string') {
              parsedHours = JSON.parse(res.data.horarios);
            } else {
              parsedHours = res.data.horarios;
            }
            setAppointmentHours(parsedHours);
          } catch {
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
        }

        const mappedReservas = res.data.reservas
          ?.filter((reserva) => reserva.ocupado === 1)
          .map((reserva) => ({
            id: reserva.id.toString(),
            title: 'Reserva',
            start: new Date(`${reserva.fecha}T${reserva.hora_inicio}:00Z`),
            end: new Date(`${reserva.fecha}T${reserva.hora_fin}:00Z`),
            cliente: reserva.cliente,
            telefono: reserva.telefono,
            descripcion: reserva.descripcion,
            backgroundColor: '#FF5733',
          })) || [];
        setReservas(mappedReservas);

        setAppointmentDuration(res.data.appointment_duration || 60);
        setBreakBetween(res.data.break_between || 15);
        setHoraInicioDefault(res.data.hora_inicio_default || '09:00');
        setHoraFinDefault(res.data.hora_fin_default || '18:00');
      } catch (err) {
        console.error('Error al cargar estado de reservas:', err);
        setModuloReservas(false);
        setAppointmentHours({});
        setReservas([]);
      }
    };

    loadInitialData();

    // Configurar polling para actualizar las reservas cada 30 segundos
    const intervalId = setInterval(() => {
      fetchReservas();
    }, 30000);

    // Limpiar el intervalo al desmontar el componente
    return () => clearInterval(intervalId);
  }, [negocioId]);

  const handleToggleReservas = (nuevoEstado: boolean) => {
    if (!negocioId) return;
    axios
      .post('http://localhost:3000/api/actualizar-modulo-reservas', { negocioId, moduloReservas: nuevoEstado })
      .then(() => setModuloReservas(nuevoEstado))
      .catch((err) => console.error('Error al actualizar estado de reservas:', err));
  };

  const handleAddReservation = () => {
    setOpenAddModal(true);
  };

  const handleSaveReservation = () => {
    if (!negocioId || !newReservation.fecha || !newReservation.hora_inicio || !newReservation.hora_fin) {
      setMessage('Fecha, hora de inicio y hora de fin son requeridos');
      return;
    }

    const startDateTime = new Date(`${newReservation.fecha}T${newReservation.hora_inicio}:00Z`);
    const endDateTime = new Date(`${newReservation.fecha}T${newReservation.hora_fin}:00Z`);

    axios
      .post(`http://localhost:3000/api/reservas/${negocioId}`, {
        fecha: newReservation.fecha,
        hora_inicio: newReservation.hora_inicio,
        hora_fin: newReservation.hora_fin,
        ocupado: 1,
        cliente: newReservation.cliente,
        telefono: newReservation.telefono,
        descripcion: newReservation.descripcion,
      })
      .then((res) => {
        const newEvent = {
          id: (res.data as { id: number }).id.toString(),
          title: 'Reserva',
          start: startDateTime,
          end: endDateTime,
          cliente: newReservation.cliente,
          telefono: newReservation.telefono,
          descripcion: newReservation.descripcion,
          backgroundColor: '#FF5733',
        };
        setReservas((prev) => [...prev, newEvent]);
        setMessage('Reserva añadida con éxito');
        setOpenAddModal(false);
        setNewReservation({ fecha: '', hora_inicio: '', hora_fin: '', cliente: '', telefono: '', descripcion: '' });
        // Refrescar las reservas inmediatamente después de añadir una nueva
        fetchReservas();
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
      start: new Date(event.startStr),
      end: new Date(event.endStr),
      cliente: event.extendedProps.cliente,
      telefono: event.extendedProps.telefono,
      descripcion: event.extendedProps.descripcion,
    });
    setOpenModal(true);
  };

  const handleCancelReservation = () => {
    if (!selectedEvent?.id || !negocioId || isNaN(Number(selectedEvent.id))) {
      setMessage('Error: No se pudo identificar la reserva para cancelar');
      return;
    }

    axios
      .delete(`http://localhost:3000/api/reservas/${negocioId}/${selectedEvent.id}`)
      .then(() => {
        setReservas((prev) => prev.filter((res) => res.id !== selectedEvent.id));
        setMessage('Reserva cancelada con éxito');
        setOpenModal(false);
        setSelectedEvent(null);
        // Refrescar las reservas inmediatamente después de cancelar
        fetchReservas();
      })
      .catch((err) => {
        console.error('Error al cancelar reserva:', err);
        const errorMessage = err.response?.data?.error || 'Error al cancelar la reserva';
        setMessage(errorMessage);
      });
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedEvent(null);
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
    setNewReservation({ fecha: '', hora_inicio: '', hora_fin: '', cliente: '', telefono: '', descripcion: '' });
  };

  const saveSettings = async () => {
    if (!negocioId) return;
    try {
      await axios.put(`http://localhost:3000/api/reservas/${negocioId}`, {
        appointmentDuration,
        breakBetween,
        hora_inicio_default: horaInicioDefault,
        hora_fin_default: horaFinDefault,
      });
      setMessage('Configuración guardada con éxito');
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
                <Typography sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Duración y Espaciado</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Duración de la cita (minutos)"
                  type="number"
                  value={appointmentDuration}
                  onChange={(e) => setAppointmentDuration(Number(e.target.value) || 1)}
                  sx={{ width: 200 }}
                  inputProps={{ min: 1 }}
                />
                <TextField
                  label="Espacio entre citas (minutos)"
                  type="number"
                  value={breakBetween}
                  onChange={(e) => setBreakBetween(Number(e.target.value) || 0)}
                  sx={{ width: 200 }}
                  inputProps={{ min: 0 }}
                />
              </Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccessTimeIcon sx={{ color: '#2563EB' }} />
                <Typography sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Horario Diario</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Hora de inicio (HH:MM)"
                  value={horaInicioDefault}
                  onChange={(e) => setHoraInicioDefault(e.target.value)}
                  sx={{ width: 200 }}
                  inputProps={{ pattern: '[0-2][0-9]:[0-5][0-9]' }}
                />
                <TextField
                  label="Hora de fin (HH:MM)"
                  value={horaFinDefault}
                  onChange={(e) => setHoraFinDefault(e.target.value)}
                  sx={{ width: 200 }}
                  inputProps={{ pattern: '[0-2][0-9]:[0-5][0-9]' }}
                />
              </Box>
            </Box>

            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mt: 4, mb: 2 }}>
              Reservas Programadas
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 4, p: 3 }}>
              <CalendarComponent events={reservas} onEventClick={handleEventClick} />
              <Box sx={{ mt: 2 }}>
                <Button
                  onClick={handleAddReservation}
                  sx={{ backgroundColor: '#34C759', color: 'white', '&:hover': { backgroundColor: '#2EA44F' } }}
                >
                  Añadir Reserva
                </Button>
              </Box>
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
              <Typography sx={{ mt: 2, color: message.toLowerCase().includes('error') ? 'red' : 'green' }}>
                {message}
              </Typography>
            )}
          </Box>

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
                    Horario:{' '}
                    {selectedEvent.start.toLocaleString('es-AR', {
                      timeZone: 'America/Argentina/Buenos_Aires',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}{' '}
                    -{' '}
                    {selectedEvent.end.toLocaleString('es-AR', {
                      timeZone: 'America/Argentina/Buenos_Aires',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </Typography>
                  <Typography>Descripción: {selectedEvent.descripcion || 'Sin descripción'}</Typography>
                  <Button
                    onClick={handleCancelReservation}
                    sx={{ mt: 2, backgroundColor: '#FF4444', color: 'white', '&:hover': { backgroundColor: '#CC0000' } }}
                  >
                    Cancelar Reserva
                  </Button>
                </>
              )}
              <Button onClick={handleCloseModal} sx={{ mt: 2 }}>
                Cerrar
              </Button>
            </Box>
          </Modal>

          <Modal open={openAddModal} onClose={handleCloseAddModal}>
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
                Añadir Nueva Reserva
              </Typography>
              <TextField
                label="Fecha (YYYY-MM-DD)"
                value={newReservation.fecha}
                onChange={(e) => setNewReservation({ ...newReservation, fecha: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Hora de Inicio (HH:MM)"
                value={newReservation.hora_inicio}
                onChange={(e) => setNewReservation({ ...newReservation, hora_inicio: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
                inputProps={{ pattern: '[0-2][0-9]:[0-5][0-9]' }}
              />
              <TextField
                label="Hora de Fin (HH:MM)"
                value={newReservation.hora_fin}
                onChange={(e) => setNewReservation({ ...newReservation, hora_fin: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
                inputProps={{ pattern: '[0-2][0-9]:[0-5][0-9]' }}
              />
              <TextField
                label="Cliente"
                value={newReservation.cliente}
                onChange={(e) => setNewReservation({ ...newReservation, cliente: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Teléfono"
                value={newReservation.telefono}
                onChange={(e) => setNewReservation({ ...newReservation, telefono: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Descripción"
                value={newReservation.descripcion}
                onChange={(e) => setNewReservation({ ...newReservation, descripcion: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
              <Button
                onClick={handleSaveReservation}
                sx={{ backgroundColor: '#34C759', color: 'white', '&:hover': { backgroundColor: '#2EA44F' } }}
              >
                Guardar Reserva
              </Button>
              <Button onClick={handleCloseAddModal} sx={{ mt: 2 }}>
                Cancelar
              </Button>
            </Box>
          </Modal>
        </Box>
      </Box>
    </Box>
  );
};

export default ReservationsPage;