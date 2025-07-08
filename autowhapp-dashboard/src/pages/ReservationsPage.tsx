import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Modal, Tabs, Tab } from '@mui/material';
import Calendar from '../components/Calendar';
import ReservationList from '../components/ReservationList';
import ModuleStatus from '../components/ModuleStatus';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { CalendarEvent, Reservation } from '../types';
import { useAuth0 } from '@auth0/auth0-react';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
    mesa?: string;
    personas?: number;
  }[];
  appointment_duration?: number;
  break_between?: number;
  hora_inicio_default?: string;
  hora_fin_default?: string;
  reservation_capacity?: number; // Nueva propiedad para capacidad
}

const ReservationsPage: React.FC = () => {
  const { negocioId } = useNegocio();
  const { getAccessTokenSilently } = useAuth0();
  const [moduloReservas, setModuloReservas] = useState<boolean>(false);
  const [appointmentHours, setAppointmentHours] = useState<Record<string, { open: string; close: string }>>({});
  const [reservas, setReservas] = useState<CalendarEvent[]>([]);
  const [reservasList, setReservasList] = useState<Reservation[]>([]);
  const [message, setMessage] = useState<string>('');
  const [appointmentDuration, setAppointmentDuration] = useState<number>(60);
  const [breakBetween, setBreakBetween] = useState<number>(0);
  const [reservationCapacity, setReservationCapacity] = useState<number>(1); // Nueva configuración
  const [horaInicioDefault, setHoraInicioDefault] = useState<string>('09:00');
  const [horaFinDefault, setHoraFinDefault] = useState<string>('18:00');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [viewMode, setViewMode] = useState<number>(0); // 0: Lista, 1: Calendario
  const [newReservation, setNewReservation] = useState({
    fecha: null as Date | null,
    hora_inicio: null as Date | null,
    hora_fin: null as Date | null,
    cliente: '',
    telefono: '',
    descripcion: '',
    mesa: '', // Nuevo campo
    personas: 1, // Nuevo campo
  });

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (date: Date): string => {
    return format(date, 'HH:mm');
  };

  const fetchReservas = async () => {
    if (!negocioId) return;
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const res = await axios.get<NegocioResponse>(`${process.env.REACT_APP_API_URL}/api/negocio/${negocioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fetchedReservasForCalendar = res.data.reservas
        ?.filter((reserva) => reserva.ocupado === 1)
        .map((reserva) => ({
          id: reserva.id.toString(),
          title: `${reserva.cliente} ${reserva.mesa ? `(Mesa ${reserva.mesa})` : ''}`,
          start: new Date(`${reserva.fecha}T${reserva.hora_inicio}:00`),
          end: new Date(`${reserva.fecha}T${reserva.hora_fin}:00`),
          cliente: reserva.cliente,
          telefono: reserva.telefono,
          descripcion: reserva.descripcion,
          backgroundColor: '#FF5733',
        })) || [];
      
      const fetchedReservasList = res.data.reservas
        ?.filter((reserva) => reserva.ocupado === 1)
        .map((reserva) => ({
          id: reserva.id,
          fecha: reserva.fecha,
          hora_inicio: reserva.hora_inicio,
          hora_fin: reserva.hora_fin,
          cliente: reserva.cliente || '',
          telefono: reserva.telefono || '',
          descripcion: reserva.descripcion || '',
          ocupado: reserva.ocupado,
          mesa: reserva.mesa,
          personas: reserva.personas,
        })) || [];
      
      setReservas(fetchedReservasForCalendar);
      setReservasList(fetchedReservasList);
    } catch (err) {
      console.error('Error al cargar reservas:', err);
    }
  };

  useEffect(() => {
    console.log('STATE reservas actualizado:', reservas);
  }, [reservas]);


  useEffect(() => {
    if (negocioId === null) {
      setModuloReservas(false);
      setAppointmentHours({});
      setReservas([]);
      return;
    }

    const loadInitialData = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
          }
        });
        const res = await axios.get<NegocioResponse>(`${process.env.REACT_APP_API_URL}/api/negocio/${negocioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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

        const mappedReservasForCalendar = res.data.reservas
          ?.filter((reserva) => reserva.ocupado === 1)
          .map((reserva) => ({
            id: reserva.id.toString(),
            title: `${reserva.cliente} ${reserva.mesa ? `(Mesa ${reserva.mesa})` : ''}`,
            start: new Date(`${reserva.fecha}T${reserva.hora_inicio}:00`),
            end: new Date(`${reserva.fecha}T${reserva.hora_fin}:00`),
            cliente: reserva.cliente,
            telefono: reserva.telefono,
            descripcion: reserva.descripcion,
            backgroundColor: '#FF5733',
          })) || [];
        
        const mappedReservasList = res.data.reservas
          ?.filter((reserva) => reserva.ocupado === 1)
          .map((reserva) => ({
            id: reserva.id,
            fecha: reserva.fecha,
            hora_inicio: reserva.hora_inicio,
            hora_fin: reserva.hora_fin,
            cliente: reserva.cliente || '',
            telefono: reserva.telefono || '',
            descripcion: reserva.descripcion || '',
            ocupado: reserva.ocupado,
            mesa: reserva.mesa,
            personas: reserva.personas,
          })) || [];
        
        setReservas(mappedReservasForCalendar);
        setReservasList(mappedReservasList);

        setAppointmentDuration(res.data.appointment_duration || 60);
        setBreakBetween(res.data.break_between || 0);
        setReservationCapacity(res.data.reservation_capacity || 1);
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
    // fetchReservas(); // Removido: ya se hace en loadInitialData
    const intervalId = setInterval(() => {
      fetchReservas();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [negocioId, getAccessTokenSilently]);

  const handleToggleReservas = async (nuevoEstado: boolean) => {
    if (!negocioId) return;
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      await axios.post(`${process.env.REACT_APP_API_URL}/api/actualizar-modulo-reservas`, { negocioId, moduloReservas: nuevoEstado }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModuloReservas(nuevoEstado);
    } catch (err) {
      console.error('Error al actualizar estado de reservas:', err);
    }
  };

  const handleAddReservation = () => {
    setEditingReservation(null);
    setNewReservation({ fecha: null, hora_inicio: null, hora_fin: null, cliente: '', telefono: '', descripcion: '', mesa: '', personas: 1 });
    setOpenAddModal(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setNewReservation({
      fecha: new Date(reservation.fecha),
      hora_inicio: parseTime(reservation.hora_inicio),
      hora_fin: parseTime(reservation.hora_fin),
      cliente: reservation.cliente,
      telefono: reservation.telefono,
      descripcion: reservation.descripcion,
      mesa: reservation.mesa || '',
      personas: reservation.personas || 1,
    });
    setOpenAddModal(true);
  };

  const handleCancelReservationFromList = async (reservation: Reservation) => {
    if (!negocioId) {
      setMessage('Error: No se pudo identificar la reserva para cancelar');
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/reservas/${negocioId}/${reservation.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refrescar las reservas desde el servidor
      await fetchReservas();
      
      setMessage('Reserva cancelada con éxito');
    } catch (err: any) {
      console.error('Error al cancelar reserva:', err);
      const errorMessage = err.response?.data?.error || 'Error al cancelar la reserva';
      setMessage(errorMessage);
    }
  };

  const handleSaveReservation = async () => {
    if (!negocioId || !newReservation.fecha || !newReservation.hora_inicio || !newReservation.hora_fin) {
      setMessage('Fecha, hora de inicio y hora de fin son requeridos');
      return;
    }
    
    try {
      const fechaStr = format(newReservation.fecha, 'yyyy-MM-dd');
      const horaInicioStr = format(newReservation.hora_inicio, 'HH:mm');
      const horaFinStr = format(newReservation.hora_fin, 'HH:mm');
      
      const reservationData = {
        fecha: fechaStr,
        hora_inicio: horaInicioStr,
        hora_fin: horaFinStr,
        ocupado: 1,
        cliente: newReservation.cliente,
        telefono: newReservation.telefono,
        descripcion: newReservation.descripcion,
        mesa: newReservation.mesa,
        personas: newReservation.personas,
      };
      
      console.log('Enviando reserva:', reservationData);

      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      
      let res;
      if (editingReservation) {
        // Editando reserva existente
        res = await axios.put(`${process.env.REACT_APP_API_URL}/api/reservas/${negocioId}/${editingReservation.id}`, reservationData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Reserva actualizada con éxito');
      } else {
        // Creando nueva reserva
        res = await axios.post(`${process.env.REACT_APP_API_URL}/api/reservas/${negocioId}`, reservationData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Reserva añadida con éxito');
      }
      
      console.log('Respuesta del servidor:', res.data);
      
      // Refrescar las reservas desde el servidor
      await fetchReservas();
      
      setOpenAddModal(false);
      setEditingReservation(null);
      setNewReservation({ fecha: null, hora_inicio: null, hora_fin: null, cliente: '', telefono: '', descripcion: '', mesa: '', personas: 1 });
    } catch (err: any) {
      console.error('Error al guardar reserva:', err);
      console.error('Error response:', err.response?.data);
      setMessage(err.response?.data?.error || 'Error al guardar reserva');
    }
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

  const handleCancelReservation = async () => {
    if (!selectedEvent?.id || !negocioId || isNaN(Number(selectedEvent.id))) {
      setMessage('Error: No se pudo identificar la reserva para cancelar');
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/reservas/${negocioId}/${selectedEvent.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refrescar las reservas desde el servidor
      await fetchReservas();
      
      setMessage('Reserva cancelada con éxito');
      setOpenModal(false);
      setSelectedEvent(null);
      } catch (err: any) {
        console.error('Error al cancelar reserva:', err);
        const errorMessage = err.response?.data?.error || 'Error al cancelar la reserva';
        setMessage(errorMessage);
      }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedEvent(null);
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
    setEditingReservation(null);
    setNewReservation({ fecha: null, hora_inicio: null, hora_fin: null, cliente: '', telefono: '', descripcion: '', mesa: '', personas: 1 });
  };

  const saveSettings = async () => {
    if (!negocioId) return;
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      await axios.put(`${process.env.REACT_APP_API_URL}/api/reservas/${negocioId}`, {
        appointmentDuration,
        breakBetween,
        reservation_capacity: reservationCapacity,
        hora_inicio_default: horaInicioDefault,
        hora_fin_default: horaFinDefault,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Configuración guardada con éxito');
    } catch (error: any) {
      console.error('Error al guardar configuración:', error);
      setMessage(`Error al guardar: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <div className="flex-grow bg-blue-600 p-6 min-h-screen">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-poppins font-bold text-white mt-2">
              Configuración de Reservas
            </h2>
            <div className="flex-1 flex justify-end max-w-[480px]">
              <ModuleStatus moduleName="Reservas" active={moduloReservas} onToggle={handleToggleReservas} />
            </div>
          </div>

          <Box sx={{ backgroundColor: 'white', padding: 6, borderRadius: 8, boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)' }}>
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mb: 4 }}>
              Configuración de Citas
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 4, p: 3 }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccessTimeIcon sx={{ color: '#2563EB' }} />
                <Typography sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Duración y Espaciado</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Duración de la cita (minutos)"
                  type="number"
                  value={appointmentDuration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppointmentDuration(Number(e.target.value) || 1)}
                  sx={{ width: 200 }}
                  inputProps={{ min: 1, step: 1 }}
                />
                <TextField
                  label="Espacio entre citas (minutos)"
                  type="number"
                  value={breakBetween}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBreakBetween(Number(e.target.value) || 0)}
                  sx={{ width: 200 }}
                  inputProps={{ min: 0, step: 1 }}
                  helperText="Tiempo de pausa entre reservas (0 = sin pausa)"
                />
                <TextField
                  label="Reservas simultáneas máximas"
                  type="number"
                  value={reservationCapacity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReservationCapacity(Number(e.target.value) || 1)}
                  sx={{ width: 200 }}
                  inputProps={{ min: 1, step: 1 }}
                  helperText="Cuántas reservas pueden coincidir en el mismo horario"
                />
              </Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccessTimeIcon sx={{ color: '#2563EB' }} />
                <Typography sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Horario Diario</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TimePicker
                  label="Hora de inicio"
                  value={horaInicioDefault ? parseTime(horaInicioDefault) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      setHoraInicioDefault(formatTime(newValue));
                    } else {
                      setHoraInicioDefault('');
                    }
                  }}
                  slotProps={{ textField: { sx: { width: 200 } } }}
                />
                <TimePicker
                  label="Hora de fin"
                  value={horaFinDefault ? parseTime(horaFinDefault) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      setHoraFinDefault(formatTime(newValue));
                    } else {
                      setHoraFinDefault('');
                    }
                  }}
                  slotProps={{ textField: { sx: { width: 200 } } }}
                />
              </Box>
            </Box>

            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mt: 4, mb: 2 }}>
              Reservas Programadas
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 4, p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)}>
                  <Tab label="Vista Lista" sx={{ fontFamily: 'Poppins' }} />
                  <Tab label="Vista Calendario" sx={{ fontFamily: 'Poppins' }} />
                </Tabs>
                <Button
                  onClick={handleAddReservation}
                  sx={{ backgroundColor: '#34C759', color: 'white', '&:hover': { backgroundColor: '#2EA44F' } }}
                >
                  Añadir Reserva
                </Button>
              </Box>
              
              {viewMode === 0 ? (
                <ReservationList 
                  reservations={reservasList}
                  onEditReservation={handleEditReservation}
                  onCancelReservation={handleCancelReservationFromList}
                  capacity={reservationCapacity}
                />
              ) : (
                <Calendar events={reservas} onEventClick={handleEventClick} />
              )}
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
                {editingReservation ? 'Editar Reserva' : 'Añadir Nueva Reserva'}
              </Typography>
              <DatePicker
                label="Fecha"
                value={newReservation.fecha}
                onChange={(newValue) => setNewReservation({ ...newReservation, fecha: newValue })}
                format="dd/MM/yyyy"
                slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
              />
              <TimePicker
                label="Hora de Inicio"
                value={newReservation.hora_inicio}
                onChange={(newValue) => setNewReservation({ ...newReservation, hora_inicio: newValue })}
                slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
              />
              <TimePicker
                label="Hora de Fin"
                value={newReservation.hora_fin}
                onChange={(newValue) => setNewReservation({ ...newReservation, hora_fin: newValue })}
                slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
              />
              <TextField
                label="Cliente"
                value={newReservation.cliente}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReservation({ ...newReservation, cliente: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Teléfono"
                value={newReservation.telefono}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReservation({ ...newReservation, telefono: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Número de Personas"
                  type="number"
                  value={newReservation.personas}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReservation({ ...newReservation, personas: Number(e.target.value) || 1 })}
                  inputProps={{ min: 1, step: 1 }}
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: <PeopleIcon sx={{ color: '#666', mr: 1 }} />
                  }}
                />
                <TextField
                  label="Mesa (opcional)"
                  value={newReservation.mesa}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReservation({ ...newReservation, mesa: e.target.value })}
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: <RestaurantIcon sx={{ color: '#666', mr: 1 }} />
                  }}
                />
              </Box>
              <TextField
                label="Descripción"
                value={newReservation.descripcion}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReservation({ ...newReservation, descripcion: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
                multiline
                rows={2}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={handleCloseAddModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveReservation}
                  sx={{ backgroundColor: '#34C759', color: 'white', '&:hover': { backgroundColor: '#2EA44F' } }}
                >
                  {editingReservation ? 'Actualizar Reserva' : 'Guardar Reserva'}
                </Button>
              </Box>
            </Box>
          </Modal>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default ReservationsPage;