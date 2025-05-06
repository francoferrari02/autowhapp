import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, MenuItem, IconButton } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ModuleStatus from '../components/ModuleStatus';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';
import BellIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const RemindersPage: React.FC = () => {
  const { negocioId } = useNegocio();
  const [moduloRecordatorios, setModuloRecordatorios] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('daily');
  const [time, setTime] = useState<string>('09:00'); // Horario por defecto
  const [reminders, setReminders] = useState<{ id: number; message: string; frequency: string; time: string }[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState<string>('');
  const [editFrequency, setEditFrequency] = useState<string>('daily');
  const [editTime, setEditTime] = useState<string>('09:00');
  const [pageMessage, setPageMessage] = useState<string>('');

  useEffect(() => {
    if (negocioId !== null) {
      axios
        .get<{ modulo_recordatorios: boolean; recordatorios?: { id: number; message: string; frequency: string; time: string }[] }>(`http://localhost:3000/api/negocio/${negocioId}`)
        .then((res) => {
          setModuloRecordatorios(!!res.data.modulo_recordatorios);
          if (res.data.recordatorios) {
            setReminders(res.data.recordatorios);
          }
        })
        .catch((err) => {
          console.error('Error al cargar estado de recordatorios:', err);
          setModuloRecordatorios(false);
        });
    }
  }, [negocioId]);

  const handleToggleRecordatorios = (nuevoEstado: boolean) => {
    if (negocioId == null) return;
    axios
      .post('http://localhost:3000/api/actualizar-modulo-recordatorios', { negocioId, moduloRecordatorios: nuevoEstado })
      .then(() => {
        setModuloRecordatorios(nuevoEstado);
      })
      .catch(err => {
        console.error('Error al actualizar estado de recordatorios:', err);
      });
  };

  const handleAddReminder = () => {
    if (!message.trim()) {
      setPageMessage('El mensaje no puede estar vacío');
      return;
    }
    const newReminder = { id: Date.now(), message, frequency, time };
    setReminders([...reminders, newReminder]);
    setMessage('');
    setFrequency('daily');
    setTime('09:00');
    setPageMessage('Recordatorio añadido con éxito');
  };

  const handleEditReminder = (id: number) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
      setEditingId(id);
      setEditMessage(reminder.message);
      setEditFrequency(reminder.frequency);
      setEditTime(reminder.time);
    }
  };

  const handleSaveEdit = () => {
    if (!editMessage.trim()) {
      setPageMessage('El mensaje no puede estar vacío');
      return;
    }
    setReminders(reminders.map(r => r.id === editingId ? { ...r, message: editMessage, frequency: editFrequency, time: editTime } : r));
    setEditingId(null);
    setEditMessage('');
    setEditFrequency('daily');
    setEditTime('09:00');
    setPageMessage('Recordatorio actualizado con éxito');
  };

  const handleDeleteReminder = (id: number) => {
    setReminders(reminders.filter(r => r.id !== id));
    setPageMessage('Recordatorio eliminado con éxito');
  };

  const saveSettings = async () => {
    if (negocioId == null) return;
    try {
      await axios.put(`http://localhost:3000/api/recordatorios/${negocioId}`, {
        recordatorios: reminders,
      });
      setPageMessage('Configuración de recordatorios guardada con éxito');
    } catch (error: any) {
      console.error('Error al guardar configuración de recordatorios:', error);
      setPageMessage(`Error al guardar: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#2563EB', minHeight: '100vh' }}>
      <Header />
      <Box display="flex">
        <Sidebar selected="reminders" />
        <Box flexGrow={1} sx={{ padding: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={4}>
            <h2 className="text-2xl font-poppins font-bold text-white" style={{ marginTop: '0.5rem' }}>
              Configuración de Recordatorios
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', maxWidth: '480px' }}>
              <ModuleStatus
                moduleName="Recordatorios"
                active={moduloRecordatorios}
                onToggle={handleToggleRecordatorios}
              />
            </div>
          </Box>
          <Box sx={{ backgroundColor: 'white', padding: 6, borderRadius: 8, boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)' }}>
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mb: 4 }}>
              Configurar Recordatorio
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 4, p: 3, mb: 4 }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <BellIcon sx={{ color: '#2563EB' }} />
                <Typography sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>
                  Nuevo Recordatorio
                </Typography>
              </Box>
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
              </TextField>
              <TextField
                type="time"
                label="Horario de envío"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                fullWidth
                variant="outlined"
                InputProps={{ endAdornment: <AccessTimeIcon sx={{ color: '#2563EB' }} /> }}
                sx={{ mb: 2 }}
              />
              <Button
                onClick={handleAddReminder}
                sx={{ backgroundColor: '#34C759', color: 'white', '&:hover': { backgroundColor: '#2EA44F' } }}
              >
                Añadir Recordatorio
              </Button>
            </Box>

            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mt: 4, mb: 2 }}>
              Lista de Recordatorios
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 4, p: 3 }}>
              {reminders.length === 0 ? (
                <Typography sx={{ fontFamily: 'Poppins' }}>No hay recordatorios configurados</Typography>
              ) : (
                reminders.map((reminder) => (
                  <Box
                    key={reminder.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 4,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontFamily: 'Poppins' }}>
                        {reminder.message} (Frecuencia: {reminder.frequency}, Horario: {reminder.time})
                      </Typography>
                    </Box>
                    <Box>
                      {editingId === reminder.id ? (
                        <>
                          <TextField
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <TextField
                            select
                            value={editFrequency}
                            onChange={(e) => setEditFrequency(e.target.value)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <MenuItem value="daily">Diario</MenuItem>
                            <MenuItem value="weekly">Semanal</MenuItem>
                            <MenuItem value="monthly">Mensual</MenuItem>
                          </TextField>
                          <TextField
                            type="time"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Button
                            onClick={handleSaveEdit}
                            sx={{ backgroundColor: '#34C759', color: 'white', '&:hover': { backgroundColor: '#2EA44F' }, mr: 1 }}
                          >
                            Guardar
                          </Button>
                          <Button
                            onClick={() => setEditingId(null)}
                            sx={{ color: '#EF4444', '&:hover': { color: '#DC2626' } }}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <IconButton onClick={() => handleEditReminder(reminder.id)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteReminder(reminder.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>
                ))
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
            {pageMessage && (
              <Typography sx={{ mt: 2, color: pageMessage.includes('Error') ? 'red' : 'green' }}>
                {pageMessage}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RemindersPage;