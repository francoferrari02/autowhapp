import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, MenuItem, IconButton, Switch, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ModuleStatus from '../components/ModuleStatus';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

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
  recordatorios?: Recordatorio[]; // Hacer opcional para manejar casos donde no se devuelva
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<number | null>(null);
  const [editReminder, setEditReminder] = useState<Recordatorio | null>(null);

  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  useEffect(() => {
    if (negocioId !== null) {
      axios.get<NegocioResponse>(`http://localhost:3000/api/negocio/${negocioId}`)
        .then((res) => {
          console.log('Respuesta de /api/negocio/:id:', res.data); // Log para depuración
          setModuloRecordatorios(!!res.data.modulo_recordatorios);
          if (res.data.recordatorios) {
            setReminders(res.data.recordatorios);
          } else {
            setReminders([]); // Aseguramos que el estado sea un array vacío si no hay recordatorios
          }
        })
        .catch((err) => {
          console.error('Error al cargar estado de recordatorios:', err);
        });
    }
  }, [negocioId]);

  const showMessage = (message: string, severity: 'success' | 'error') => {
    setPageMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const addReminder = async () => {
    try {
      const res = await axios.post<{ id: number }>(`http://localhost:3000/api/recordatorios/${negocioId}`, {
        message,
        frequency,
        time,
        day: frequency === 'once' ? new Date(day).toISOString().slice(0, 10) : day, // Formato estándar para 'once'
        activo: 1
      });

      const newReminder: Recordatorio = {
        id: res.data.id,
        message,
        frequency,
        time,
        day: frequency === 'once' ? new Date(day).toISOString().slice(0, 10) : day,
        activo: true
      };

      setReminders([...reminders, newReminder]);
      showMessage('Recordatorio agregado con éxito', 'success');
    } catch (err) {
      showMessage('Error al agregar el recordatorio', 'error');
    }
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

    if (frequency === 'once' && (!day || isNaN(Date.parse(day)) || new Date(day) < new Date())) {
      showMessage('La fecha para un recordatorio único debe ser futura y válida', 'error');
      return;
    }

    addReminder();
    setMessage('');
    setFrequency('daily');
    setDay('');
    setTime('09:00');
  };

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

  const toggleReminder = async (id: number) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    try {
      await axios.put(`http://localhost:3000/api/recordatorios/${id}/activo`, {
        activo: reminder.activo ? 0 : 1
      });
      setReminders(reminders.map(r => r.id === id ? { ...r, activo: !r.activo } : r));
      showMessage('Estado del recordatorio actualizado', 'success');
    } catch (err) {
      showMessage('Error al actualizar el recordatorio', 'error');
    }
  };

  const handleDeleteReminder = async (id: number) => {
    setDeleteDialogOpen(null); // Cerrar diálogo tras confirmación
    try {
      await axios.delete(`http://localhost:3000/api/recordatorios/${id}`);
      setReminders(reminders.filter(r => r.id !== id)); // Actualizar estado local
      showMessage('Recordatorio eliminado con éxito', 'success');
    } catch (err) {
      console.error('Error al eliminar el recordatorio:', err); // Log detallado del error
      showMessage('Error al eliminar el recordatorio', 'error');
    }
  };

  const handleEditReminder = async () => {
    if (!editReminder) return;
    try {
      await axios.put(`http://localhost:3000/api/recordatorios/${editReminder.id}`, {
        message: editReminder.message,
        frequency: editReminder.frequency,
        time: editReminder.time,
        day: editReminder.frequency === 'once' ? new Date(editReminder.day!).toISOString().slice(0, 10) : editReminder.day,
        activo: editReminder.activo
      });
      setReminders(reminders.map(r => r.id === editReminder.id ? editReminder : r));
      setEditDialogOpen(null);
      showMessage('Recordatorio actualizado con éxito', 'success');
    } catch (err) {
      showMessage('Error al actualizar el recordatorio', 'error');
    }
  };

  const getNextSendDate = (reminder: Recordatorio): string => {
    const now = new Date();
    const [hours, minutes] = reminder.time.split(':').map(Number);
    let nextDate = new Date(now);
    nextDate.setHours(hours, minutes, 0, 0);

    if (reminder.frequency === 'daily') {
      if (nextDate < now) nextDate.setDate(nextDate.getDate() + 1);
    } else if (reminder.frequency === 'weekly') {
      const dayIndex = weekDays.indexOf(reminder.day!);
      while (nextDate.getDay() !== dayIndex || nextDate < now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    } else if (reminder.frequency === 'monthly') {
      const dayNum = parseInt(reminder.day!);
      nextDate.setDate(dayNum);
      if (nextDate.getMonth() === now.getMonth() && nextDate < now) nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (reminder.frequency === 'once') {
      nextDate = new Date(reminder.day!);
      return nextDate < now ? 'Ya enviado' : nextDate.toLocaleString();
    }
    return nextDate.toLocaleString();
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
            {frequency === 'once' && (
              <TextField
                label="Fecha (YYYY-MM-DD)"
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
            )}
            <TextField type="time" label="Horario" value={time} onChange={(e) => setTime(e.target.value)} fullWidth sx={{ mb: 2 }} />
            <Button onClick={handleAddReminder} variant="contained" color="primary">
              Añadir recordatorio
            </Button>
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
                      <Typography variant="caption">{reminder.time} {reminder.day && `| Día: ${reminder.day}`} | Próximo: {getNextSendDate(reminder)}</Typography>
                    </Box>
                    <Box>
                      <Switch checked={reminder.activo} onChange={() => toggleReminder(reminder.id)} />
                      <IconButton onClick={() => { setEditReminder(reminder); setEditDialogOpen(reminder.id); }} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => setDeleteDialogOpen(reminder.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          ))}

          <Dialog open={deleteDialogOpen !== null} onClose={() => setDeleteDialogOpen(null)}>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogContent>
              <DialogContentText>
                ¿Estás seguro de que querés eliminar este recordatorio?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(null)}>Cancelar</Button>
              <Button onClick={() => handleDeleteReminder(deleteDialogOpen!)} color="error">Eliminar</Button>
            </DialogActions>
          </Dialog>

          <Dialog open={editDialogOpen !== null} onClose={() => { setEditDialogOpen(null); setEditReminder(null); }}>
            <DialogTitle>Editar Recordatorio</DialogTitle>
            <DialogContent>
              <TextField
                label="Mensaje"
                value={editReminder?.message || ''}
                onChange={(e) => setEditReminder({ ...editReminder!, message: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                select
                label="Frecuencia"
                value={editReminder?.frequency || 'daily'}
                onChange={(e) => setEditReminder({ ...editReminder!, frequency: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              >
                <MenuItem value="daily">Diario</MenuItem>
                <MenuItem value="weekly">Semanal</MenuItem>
                <MenuItem value="monthly">Mensual</MenuItem>
                <MenuItem value="once">Único</MenuItem>
              </TextField>
              {editReminder?.frequency === 'weekly' && (
                <TextField
                  select
                  label="Día de la semana"
                  value={editReminder.day || ''}
                  onChange={(e) => setEditReminder({ ...editReminder!, day: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {weekDays.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
              )}
              {editReminder?.frequency === 'monthly' && (
                <TextField
                  label="Día del mes (1-31)"
                  type="number"
                  value={editReminder.day || ''}
                  onChange={(e) => setEditReminder({ ...editReminder!, day: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              )}
              {editReminder?.frequency === 'once' && (
                <TextField
                  label="Fecha (YYYY-MM-DD)"
                  type="date"
                  value={editReminder.day || ''}
                  onChange={(e) => setEditReminder({ ...editReminder!, day: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
              )}
              <TextField
                type="time"
                label="Horario"
                value={editReminder?.time || '09:00'}
                onChange={(e) => setEditReminder({ ...editReminder!, time: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setEditDialogOpen(null); setEditReminder(null); }}>Cancelar</Button>
              <Button onClick={handleEditReminder} color="primary">Guardar</Button>
            </DialogActions>
          </Dialog>

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