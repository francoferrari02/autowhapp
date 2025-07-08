import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Tabs,
  Tab
} from '@mui/material';
import { 
  ExpandMore, 
  ExpandLess, 
  Person, 
  Phone, 
  Schedule, 
  Description,
  Restaurant,
  Group
} from '@mui/icons-material';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reservation } from '../types';

interface ReservationListProps {
  reservations: Reservation[];
  onEditReservation: (reservation: Reservation) => void;
  onCancelReservation: (reservation: Reservation) => void;
  capacity: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ReservationList: React.FC<ReservationListProps> = ({ 
  reservations, 
  onEditReservation, 
  onCancelReservation,
  capacity 
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleSlotExpansion = (slotKey: string) => {
    const newExpanded = new Set(expandedSlots);
    if (newExpanded.has(slotKey)) {
      newExpanded.delete(slotKey);
    } else {
      newExpanded.add(slotKey);
    }
    setExpandedSlots(newExpanded);
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'EEEE d MMMM', { locale: es });
  };

  const getStatusColor = (available: number, total: number) => {
    const percentage = available / total;
    if (percentage > 0.5) return '#4CAF50'; // Verde
    if (percentage > 0.2) return '#FF9800'; // Naranja
    return '#F44336'; // Rojo
  };

  // Agrupar reservas por fecha y hora
  const groupedReservations = reservations.reduce((acc, reservation) => {
    const dateKey = reservation.fecha;
    const timeKey = `${reservation.hora_inicio}-${reservation.hora_fin}`;
    const slotKey = `${dateKey}_${timeKey}`;
    
    if (!acc[dateKey]) {
      acc[dateKey] = {};
    }
    if (!acc[dateKey][timeKey]) {
      acc[dateKey][timeKey] = {
        slotKey,
        reservations: [],
        available: capacity,
        timeRange: timeKey
      };
    }
    acc[dateKey][timeKey].reservations.push(reservation);
    acc[dateKey][timeKey].available = capacity - acc[dateKey][timeKey].reservations.length;
    
    return acc;
  }, {} as Record<string, Record<string, { slotKey: string; reservations: Reservation[]; available: number; timeRange: string }>>);

  // Vista de calendario compacto
  const CalendarView = () => (
    <Box>
      {Object.entries(groupedReservations).map(([date, timeSlots]) => (
        <Card key={date} sx={{ mb: 2, backgroundColor: '#f8f9fa' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mb: 2 }}>
              {getDateLabel(date)}
            </Typography>
            {Object.entries(timeSlots).map(([timeRange, slot]) => (
              <Box key={slot.slotKey} sx={{ mb: 1 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    p: 1,
                    backgroundColor: 'white',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                  onClick={() => toggleSlotExpansion(slot.slotKey)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Schedule sx={{ color: '#2563EB' }} />
                    <Typography sx={{ fontFamily: 'Poppins', fontWeight: 'medium' }}>
                      {timeRange}
                    </Typography>
                    <Chip 
                      label={`${slot.reservations.length}/${capacity}`}
                      size="small"
                      sx={{ 
                        backgroundColor: getStatusColor(slot.available, capacity),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  <IconButton size="small">
                    {expandedSlots.has(slot.slotKey) ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
                <Collapse in={expandedSlots.has(slot.slotKey)}>
                  <Box sx={{ pl: 4, pr: 2, pb: 1 }}>
                    {slot.reservations.map((reservation) => (
                      <Card key={reservation.id} sx={{ mb: 1, backgroundColor: '#fff' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Person fontSize="small" sx={{ color: '#2563EB' }} />
                                <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>
                                  {reservation.cliente}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Phone fontSize="small" sx={{ color: '#666' }} />
                                <Typography variant="body2" sx={{ fontFamily: 'Poppins', color: '#666' }}>
                                  {reservation.telefono}
                                </Typography>
                              </Box>
                              {reservation.personas && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Group fontSize="small" sx={{ color: '#666' }} />
                                  <Typography variant="body2" sx={{ fontFamily: 'Poppins', color: '#666' }}>
                                    {reservation.personas} personas
                                  </Typography>
                                </Box>
                              )}
                              {reservation.mesa && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Restaurant fontSize="small" sx={{ color: '#666' }} />
                                  <Typography variant="body2" sx={{ fontFamily: 'Poppins', color: '#666' }}>
                                    Mesa {reservation.mesa}
                                  </Typography>
                                </Box>
                              )}
                              {reservation.descripcion && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Description fontSize="small" sx={{ color: '#666' }} />
                                  <Typography variant="body2" sx={{ fontFamily: 'Poppins', color: '#666' }}>
                                    {reservation.descripcion}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button 
                                size="small" 
                                onClick={() => onEditReservation(reservation)}
                                sx={{ minWidth: 'auto', p: 1 }}
                              >
                                Editar
                              </Button>
                              <Button 
                                size="small" 
                                color="error"
                                onClick={() => onCancelReservation(reservation)}
                                sx={{ minWidth: 'auto', p: 1 }}
                              >
                                Cancelar
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            ))}
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  // Vista de tabla
  const TableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Fecha</TableCell>
            <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Horario</TableCell>
            <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Cliente</TableCell>
            <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Teléfono</TableCell>
            <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Personas</TableCell>
            <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Mesa</TableCell>
            <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell sx={{ fontFamily: 'Poppins' }}>
                {getDateLabel(reservation.fecha)}
              </TableCell>
              <TableCell sx={{ fontFamily: 'Poppins' }}>
                {reservation.hora_inicio} - {reservation.hora_fin}
              </TableCell>
              <TableCell sx={{ fontFamily: 'Poppins' }}>{reservation.cliente}</TableCell>
              <TableCell sx={{ fontFamily: 'Poppins' }}>{reservation.telefono}</TableCell>
              <TableCell sx={{ fontFamily: 'Poppins' }}>{reservation.personas || '-'}</TableCell>
              <TableCell sx={{ fontFamily: 'Poppins' }}>{reservation.mesa || '-'}</TableCell>
              <TableCell>
                <Button 
                  size="small" 
                  onClick={() => onEditReservation(reservation)}
                  sx={{ mr: 1 }}
                >
                  Editar
                </Button>
                <Button 
                  size="small" 
                  color="error"
                  onClick={() => onCancelReservation(reservation)}
                >
                  Cancelar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (reservations.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" sx={{ fontFamily: 'Poppins', color: '#666' }}>
          No hay reservas programadas
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Vista por Horarios" sx={{ fontFamily: 'Poppins' }} />
        <Tab label="Vista de Tabla" sx={{ fontFamily: 'Poppins' }} />
      </Tabs>
      
      <TabPanel value={tabValue} index={0}>
        <CalendarView />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <TableView />
      </TabPanel>
    </Box>
  );
};

export default ReservationList;
