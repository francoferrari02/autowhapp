import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, MenuItem, IconButton, Switch, Snackbar, Alert } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ModuleStatus from '../components/ModuleStatus';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';
import DeleteIcon from '@mui/icons-material/Delete';

interface Recordatorio {
  id: number;
  message: string;
  frequency: string;
  time: string;
  day?: string;
  activo: boolean;
}

interface NegocioResponse {
  modulo_recordatorios: boolean;
  recordatorios: Recordatorio[];
}

const RemindersPage: React.FC = () => {
  const { negocioId } = useNegocio();
  const [moduloRecordatorios, setModuloRecordatorios] = useState<boolean>(false);
  const [reminders, setReminders] = useState<Recordatorio[]>([]);
  const [message, setMessage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('09:00');
  const [pageMessage, setPageMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  useEffect(() => {
    if (negocioId !== null) {
      axios.get<NegocioResponse>(`http://localhost:3000/api/negocio/${negocioId}`)
        .then((res) => {
          setModuloRecordatorios(!!res.data.modulo_recordatorios);
          if (res.data.recordatorios) {
            setReminders(res.data.recordatorios);
          }
        })
        .catch((err) => {
          console.error('Error al cargar estado de recordatorios:', err);
        });
    }
  }, [negocioId]);

const handleToggleRecordatorios = (nuevoEstado: boolean) => {
  if (negocioId == null) return;
  axios
    .post('http://localhost:3000/api/actualizar-modulo-recordatorios', {
      negocioId,
      moduloRecordatorios: nuevoEstado,
    })
    .then(() => {
      setModuloRecordatorios(nuevoEstado);
      console.log("Estado actualizado en el backend:", nuevoEstado);
    })
    .catch((err) => console.error('Error al actualizar estado:', err));
};

  const showMessage = (message: string, severity: 'success' | 'error') => {
    setPageMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleAddReminder = () => {
    if (!message.trim()) {
      showMessage('El mensaje no puede estar vacío', 'error');
      return;
    }
    if (frequency === 'monthly') {
      const dayNum = parseInt(day);
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        showMessage('El día del mes debe ser un número válido entre 1 y 31', 'error');
        return;
      }
      const mesesInvalidos = ['febrero', 'abril', 'junio', 'septiembre', 'noviembre'].filter(mes => {
        if (mes === 'febrero') return dayNum > 28;
        return dayNum > 30;
      });
      if (mesesInvalidos.length > 0) {
        showMessage(`⚠️ El día ${dayNum} no existe en: ${mesesInvalidos.join(', ')}. Ese mes no se enviará el recordatorio.`, 'error');
      }
    }
    const newReminder: Recordatorio = {
      id: Date.now(),
      message,
      frequency,
      day,
      time,
      activo: true
    };
    setReminders([...reminders, newReminder]);
    setMessage('');
    setFrequency('daily');
    setDay('');
    setTime('09:00');
    showMessage('Recordatorio añadido', 'success');
  };

  const toggleReminder = (id: number) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, activo: !r.activo } : r));
  };

  const handleDeleteReminder = (id: number) => {
    setReminders(reminders.filter(r => r.id !== id));
    showMessage('Recordatorio eliminado', 'success');
  };

  const groupedReminders = {
    daily: reminders.filter(r => r.frequency === 'daily'),
    weekly: reminders.filter(r => r.frequency === 'weekly'),
    monthly: reminders.filter(r => r.frequency === 'monthly'),
    once: reminders.filter(r => r.frequency === 'once'),
  };

  return (
    <Box sx={{ backgroundColor: '#2563EB', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box display="flex" flexGrow={1}>
        <Sidebar selected="reminders" />
        <Box flexGrow={1} sx={{ padding: 3, display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={4}>
            <Typography variant="h5" sx={{ color: 'white' }}>
              Configuración de Recordatorios
            </Typography>
            <ModuleStatus
              moduleName="Recordatorios"
              active={moduloRecordatorios}
              onToggle={handleToggleRecordatorios}
            />
          </Box>

          <Box sx={{ backgroundColor: 'white', padding: 4, borderRadius: 2 }}>
            <Typography variant="h6" mb={2}>Nuevo Recordatorio</Typography>
            <TextField label="Mensaje" value={message} onChange={(e) => setMessage(e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField select label="Frecuencia" value={frequency} onChange={(e) => setFrequency(e.target.value)} fullWidth sx={{ mb: 2 }}>
              <MenuItem value="daily">Diario</MenuItem>
              <MenuItem value="weekly">Semanal</MenuItem>
              <MenuItem value="monthly">Mensual</MenuItem>
              <MenuItem value="once">Único</MenuItem>
            </TextField>
            {frequency === 'weekly' && (
              <TextField select label="Día de la semana" value={day} onChange={(e) => setDay(e.target.value)} fullWidth sx={{ mb: 2 }}>
                {weekDays.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
            )}
            {frequency === 'monthly' && (
              <TextField label="Día del mes (1-31)" type="number" value={day} onChange={(e) => setDay(e.target.value)} fullWidth sx={{ mb: 2 }} />
            )}
            <TextField type="time" label="Horario" value={time} onChange={(e) => setTime(e.target.value)} fullWidth sx={{ mb: 2 }} />
            <Button onClick={handleAddReminder} sx={{ backgroundColor: '#2563EB', color: 'white' }}>Añadir</Button>
          </Box>

          {Object.entries(groupedReminders).map(([grupo, items]) => (
            <Box key={grupo} mt={4} sx={{ backgroundColor: 'white', padding: 3, borderRadius: 2 }}>
              <Typography variant="h6" mb={1} sx={{ textTransform: 'capitalize' }}>
                {grupo === 'daily' ? 'Diarios' : grupo === 'weekly' ? 'Semanales' : grupo === 'monthly' ? 'Mensuales' : 'Únicos'}
              </Typography>
              {items.length === 0 ? (
                <Typography sx={{ fontStyle: 'italic' }}>No hay recordatorios configurados</Typography>
              ) : (
                items.map(reminder => (
                  <Box
                    key={reminder.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 2,
                      borderBottom: '1px solid #ddd',
                      backgroundColor: reminder.activo ? 'white' : '#f0f0f0',
                      opacity: reminder.activo ? 1 : 0.6,
                    }}
                  >
                    <Box>
                      <Typography>{reminder.message}</Typography>
                      <Typography variant="caption">{reminder.time} {reminder.day && `| Día: ${reminder.day}`}</Typography>
                    </Box>
                    <Box>
                      <Switch checked={reminder.activo} onChange={() => toggleReminder(reminder.id)} />
                      <IconButton onClick={() => handleDeleteReminder(reminder.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          ))}

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
              {pageMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
};

export default RemindersPage;