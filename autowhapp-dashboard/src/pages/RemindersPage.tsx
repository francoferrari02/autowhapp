import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Switch,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import ModuleStatus from '../components/ModuleStatus';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth0 } from '@auth0/auth0-react';

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
  recordatorios?: Recordatorio[];
}

const RemindersPage: React.FC = () => {
  const { negocioId } = useNegocio();
  const { getAccessTokenSilently } = useAuth0();
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
    if (negocioId === null || negocioId === undefined) {
      console.warn('negocioId no está definido, no se puede cargar el estado de recordatorios');
      return;
    }
    const fetchReminders = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
          }
        });
        const res = await axios.get<NegocioResponse>(`http://localhost:3000/api/negocio/${negocioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setModuloRecordatorios(!!res.data.modulo_recordatorios);
        setReminders(res.data.recordatorios || []);
      } catch (err: any) {
        showMessage('Error al cargar los recordatorios', 'error');
      }
    };
    fetchReminders();
  }, [negocioId, getAccessTokenSilently]);

  const showMessage = (message: string, severity: 'success' | 'error') => {
    setPageMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const addReminder = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const res = await axios.post<{ success: boolean; id: number }>(`http://localhost:3000/api/recordatorios/${negocioId}`, {
        message,
        frequency,
        time,
        day: frequency === 'once' && day ? new Date(day).toISOString().slice(0, 10) : day || null,
        activo: 1,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const newReminder: Recordatorio = {
          id: res.data.id,
          message,
          frequency,
          time,
          day: frequency === 'once' && day ? new Date(day).toISOString().slice(0, 10) : day || undefined,
          activo: true,
        };
        setReminders([...reminders, newReminder]);
        showMessage('Recordatorio agregado con éxito', 'success');
      } else {
        throw new Error('El backend no devolvió un estado de éxito');
      }
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Error al agregar el recordatorio', 'error');
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
      const mesesInvalidos = ['febrero', 'abril', 'junio', 'septiembre', 'noviembre'].filter((mes) => {
        if (mes === 'febrero') return dayNum > 28;
        return dayNum > 30;
      });
      if (mesesInvalidos.length > 0) {
        showMessage(
          `⚠️ El día ${dayNum} no existe en: ${mesesInvalidos.join(', ')}. Ese mes no se enviará el recordatorio.`,
          'error'
        );
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

  const handleToggleRecordatorios = async (nuevoEstado: boolean) => {
    if (negocioId === null || negocioId === undefined) {
      showMessage('No se puede actualizar el módulo: negocioId no está definido', 'error');
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      await axios.post('http://localhost:3000/api/actualizar-modulo-recordatorios', {
        negocioId,
        moduloRecordatorios: nuevoEstado,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModuloRecordatorios(nuevoEstado);
    } catch (err: any) {
      showMessage('Error al actualizar el módulo de recordatorios', 'error');
    }
  };

  const toggleReminder = async (id: number) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) {
      showMessage('Recordatorio no encontrado', 'error');
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const res = await axios.put<{ success: boolean }>(`http://localhost:3000/api/recordatorios/${id}/activo`, {
        activo: reminder.activo ? 0 : 1,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setReminders(reminders.map((r) => (r.id === id ? { ...r, activo: !r.activo } : r)));
        showMessage('Estado del recordatorio actualizado', 'success');
      } else {
        throw new Error('El backend no devolvió un estado de éxito');
      }
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Error al actualizar el recordatorio', 'error');
    }
  };

  const handleDeleteReminder = async (id: number) => {
    setDeleteDialogOpen(null);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const res = await axios.delete<{ success: boolean }>(`http://localhost:3000/api/recordatorios/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setReminders(reminders.filter((r) => r.id !== id));
        showMessage('Recordatorio eliminado con éxito', 'success');
      } else {
        throw new Error('El backend no devolvió un estado de éxito');
      }
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Error al eliminar el recordatorio', 'error');
    }
  };

  const handleEditReminder = async () => {
    if (!editReminder) {
      showMessage('No hay recordatorio seleccionado para editar', 'error');
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const res = await axios.put<{ success: boolean }>(`http://localhost:3000/api/recordatorios/${editReminder.id}`, {
        message: editReminder.message,
        frequency: editReminder.frequency,
        time: editReminder.time,
        day: editReminder.frequency === 'once' && editReminder.day ? new Date(editReminder.day).toISOString().slice(0, 10) : editReminder.day || null,
        activo: editReminder.activo ? 1 : 0,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setReminders(reminders.map((r) => (r.id === editReminder.id ? { ...editReminder } : r)));
        setEditDialogOpen(null);
        setEditReminder(null);
        showMessage('Recordatorio actualizado con éxito', 'success');
      } else {
        throw new Error('El backend no devolvió un estado de éxito');
      }
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Error al actualizar el recordatorio', 'error');
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
      if (!reminder.day) return 'Día no especificado';
      const dayIndex = weekDays.indexOf(reminder.day);
      while (nextDate.getDay() !== dayIndex || nextDate < now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    } else if (reminder.frequency === 'monthly') {
      if (!reminder.day) return 'Día no especificado';
      const dayNum = parseInt(reminder.day);
      nextDate.setDate(dayNum);
      if (nextDate.getMonth() === now.getMonth() && nextDate < now) nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (reminder.frequency === 'once') {
      if (!reminder.day) return 'Fecha no especificada';
      nextDate = new Date(reminder.day);
      return nextDate < now ? 'Ya enviado' : nextDate.toLocaleString();
    }
    return nextDate.toLocaleString();
  };

  const groupedReminders = {
    daily: reminders.filter((r) => r.frequency === 'daily'),
    weekly: reminders.filter((r) => r.frequency === 'weekly'),
    monthly: reminders.filter((r) => r.frequency === 'monthly'),
    once: reminders.filter((r) => r.frequency === 'once'),
  };

  return (
    <Box sx={{ backgroundColor: '#2563EB', minHeight: '100vh', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Box flexGrow={1} sx={{ padding: 3, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h5" sx={{ color: 'white', fontFamily: 'Poppins, sans-serif' }}>
            Configuración de Recordatorios
          </Typography>
          <ModuleStatus moduleName="Recordatorios" active={moduloRecordatorios} onToggle={handleToggleRecordatorios} />
        </Box>

        <Box sx={{ backgroundColor: 'white', padding: 3, borderRadius: 8, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
          <Typography variant="h6" mb={2} sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>
            Nuevo Recordatorio
          </Typography>
          <TextField
            label="Mensaje"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Frecuencia"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          >
            <MenuItem value="daily">Diario</MenuItem>
            <MenuItem value="weekly">Semanal</MenuItem>
            <MenuItem value="monthly">Mensual</MenuItem>
            <MenuItem value="once">Único</MenuItem>
          </TextField>
          {frequency === 'weekly' && (
            <TextField
              select
              label="Día de la semana"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            >
              {weekDays.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
          )}
          {frequency === 'monthly' && (
            <TextField
              label="Día del mes (1-31)"
              type="number"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
          )}
          {frequency === 'once' && (
            <TextField
              label="Fecha (YYYY-MM-DD)"
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
          )}
          <TextField
            type="time"
            label="Horario"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Button
            onClick={handleAddReminder}
            variant="contained"
            color="primary"
            sx={{ borderRadius: 8, padding: '8px 16px' }}
          >
            Añadir recordatorio
          </Button>
        </Box>

        {Object.entries(groupedReminders).map(([grupo, items]) => (
          <Box
            key={grupo}
            mt={4}
            sx={{ backgroundColor: 'white', padding: 3, borderRadius: 8, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
          >
            <Typography
              variant="h6"
              mb={2}
              sx={{ fontWeight: 600, textTransform: 'capitalize', fontFamily: 'Poppins, sans-serif' }}
            >
              {grupo === 'daily' ? 'Diarios' : grupo === 'weekly' ? 'Semanales' : grupo === 'monthly' ? 'Mensuales' : 'Únicos'}
            </Typography>
            {items.length === 0 ? (
              <Typography sx={{ fontStyle: 'italic', color: '#666', fontFamily: 'Poppins, sans-serif' }}>
                No hay recordatorios configurados
              </Typography>
            ) : (
              items.map((reminder) => (
                <Box
                  key={reminder.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderBottom: '1px solid #eee',
                    backgroundColor: reminder.activo ? 'white' : '#f9f9f9',
                    borderRadius: 4,
                    transition: 'background-color 0.3s',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontFamily: 'Poppins, sans-serif' }}>
                      {reminder.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontFamily: 'Poppins, sans-serif' }}>
                      {reminder.time} {reminder.day && `| Día: ${reminder.day}`} | Próximo: {getNextSendDate(reminder)}
                    </Typography>
                  </Box>
                  <Box>
                    <Switch checked={reminder.activo} onChange={() => toggleReminder(reminder.id)} color="primary" />
                    <IconButton
                      onClick={() => {
                        setEditReminder(reminder);
                        setEditDialogOpen(reminder.id);
                      }}
                      color="primary"
                      sx={{ ml: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => setDeleteDialogOpen(reminder.id)} color="error" sx={{ ml: 1 }}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        ))}

        <Dialog open={deleteDialogOpen !== null} onClose={() => setDeleteDialogOpen(null)}>
          <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif' }}>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontFamily: 'Poppins, sans-serif' }}>
              ¿Estás seguro de que querés eliminar este recordatorio?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(null)} color="inherit" sx={{ fontFamily: 'Poppins, sans-serif' }}>
              Cancelar
            </Button>
            <Button onClick={() => handleDeleteReminder(deleteDialogOpen!)} color="error" sx={{ fontFamily: 'Poppins, sans-serif' }}>
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={editDialogOpen !== null}
          onClose={() => {
            setEditDialogOpen(null);
            setEditReminder(null);
          }}
        >
          <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif' }}>Editar Recordatorio</DialogTitle>
          <DialogContent>
            {editReminder && (
              <>
                <TextField
                  label="Mensaje"
                  value={editReminder.message}
                  onChange={(e) => setEditReminder({ ...editReminder, message: e.target.value })}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2, mt: 1 }}
                />
                <TextField
                  select
                  label="Frecuencia"
                  value={editReminder.frequency}
                  onChange={(e) => setEditReminder({ ...editReminder, frequency: e.target.value })}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="daily">Diario</MenuItem>
                  <MenuItem value="weekly">Semanal</MenuItem>
                  <MenuItem value="monthly">Mensual</MenuItem>
                  <MenuItem value="once">Único</MenuItem>
                </TextField>
                {editReminder.frequency === 'weekly' && (
                  <TextField
                    select
                    label="Día de la semana"
                    value={editReminder.day || ''}
                    onChange={(e) => setEditReminder({ ...editReminder, day: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                  >
                    {weekDays.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                {editReminder.frequency === 'monthly' && (
                  <TextField
                    label="Día del mes (1-31)"
                    type="number"
                    value={editReminder.day || ''}
                    onChange={(e) => setEditReminder({ ...editReminder, day: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                )}
                {editReminder.frequency === 'once' && (
                  <TextField
                    label="Fecha (YYYY-MM-DD)"
                    type="date"
                    value={editReminder.day || ''}
                    onChange={(e) => setEditReminder({ ...editReminder, day: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
                <TextField
                  type="time"
                  label="Horario"
                  value={editReminder.time}
                  onChange={(e) => setEditReminder({ ...editReminder, time: e.target.value })}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEditDialogOpen(null);
                setEditReminder(null);
              }}
              color="inherit"
              sx={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditReminder} color="primary" sx={{ fontFamily: 'Poppins, sans-serif' }}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%', fontFamily: 'Poppins, sans-serif' }}>
            {pageMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default RemindersPage;