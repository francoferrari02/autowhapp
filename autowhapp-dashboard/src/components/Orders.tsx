import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, TextField, Box, Modal, Switch, FormControlLabel } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { Order } from '../types';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';

const BotStatusPedido: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => (
  <FormControlLabel
    control={<Switch checked={active} onChange={onToggle} color="primary" />}
    label={active ? "Módulo Pedido Activado" : "Módulo Pedido Desactivado"}
    sx={{ fontWeight: 'bold', userSelect: 'none' }}
  />
);

const Orders: React.FC = () => {
  const { negocioId } = useNegocio(); // Obtener el negocioId del contexto

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'Todos' | 'Recibidos' | 'Enviados'>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [messages, setMessages] = useState({
    recibido: 'Tu pedido ha sido recibido, te avisaremos pronto...',
    preparando: 'Tu pedido está siendo preparado.',
    enviado: 'Tu pedido está listo y en camino.',
  });

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string>('');

  // Cargar pedidos y mensajes al montar el componente
  useEffect(() => {
    if (negocioId !== null) {
      // Cargar pedidos
      axios
        .get(`http://localhost:3000/api/pedidos/${negocioId}`)
        .then((res) => {
          const pedidos: Order[] = (res.data as any[]).map((pedido: any) => ({
            id: pedido.id,
            time: pedido.created_at || new Date().toLocaleTimeString(), // Usamos la fecha actual si no hay created_at
            status: pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1), // Capitalizamos el estado
            client: 'Desconocido', // No está en la base de datos
            phone: pedido.numero_cliente,
            items: pedido.producto,
            total: 'N/A', // No está en la base de datos
            cantidad: pedido.cantidad,
          }));
          setOrders(pedidos);
        })
        .catch((err) => {
          console.error('Error al cargar pedidos:', err);
          setMessage('Error al cargar pedidos');
        });

      // Cargar mensajes personalizados
      axios
        .get(`http://localhost:3000/api/mensajes-pedidos/${negocioId}`)
        .then((res) => {
          const mensajesGuardados = (res.data as { tipo: string; mensaje: string }[]).reduce((acc: any, msg: any) => {
            acc[msg.tipo] = msg.mensaje;
            return acc;
          }, {});
          setMessages((prev) => ({
            ...prev,
            ...mensajesGuardados,
          }));
        })
        .catch((err) => {
          console.error('Error al cargar mensajes de pedidos:', err);
          setMessage('Error al cargar mensajes de pedidos');
        });
    }
  }, [negocioId]);

  const handleMessageChange = (key: 'recibido' | 'preparando' | 'enviado', value: string) => {
    setMessages((prev) => ({ ...prev, [key]: value }));
  };

  const saveMessages = () => {
    if (negocioId === null) {
      setMessage('Error: Negocio no identificado');
      return;
    }

    axios
      .post('http://localhost:3000/api/mensajes-pedidos', {
        negocio_id: negocioId,
        mensajes: messages,
      })
      .then(() => {
        setMessage('Mensajes guardados con éxito');
      })
      .catch((err) => {
        console.error('Error al guardar mensajes:', err);
        setMessage('Error al guardar mensajes');
      });
  };

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedOrder(null);
  };

  const updateStatus = (orderId: number, newStatus: 'Recibido' | 'Preparando' | 'Enviado') => {
    if (negocioId === null) {
      setMessage('Error: Negocio no identificado');
      return;
    }

    // Actualizar el estado del pedido en el backend
    axios
      .put(`http://localhost:3000/api/pedido/${orderId}/estado`, {
        estado: newStatus.toLowerCase(),
      })
      .then(() => {
        // Actualizar el estado localmente
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        setMessage(`Estado del pedido ${orderId} actualizado a ${newStatus}`);
      })
      .catch((err) => {
        console.error('Error al actualizar estado del pedido:', err);
        setMessage('Error al actualizar estado del pedido');
      });
  };

  const addNewOrder = () => {
    if (negocioId === null) {
      setMessage('Error: Negocio no identificado');
      return;
    }

    const newOrder = {
      negocioId,
      numeroCliente: '+541123456789', // Simulado
      producto: 'Producto de prueba',
      cantidad: 1,
    };

    axios
      .post('http://localhost:3000/api/registrar-pedido', newOrder)
      .then((res) => {
        const createdOrder: Order = {
          id: orders.length + 1, // Esto debería venir del backend, pero lo simulamos por ahora
          time: new Date().toLocaleTimeString(),
          status: 'Recibido',
          client: 'Desconocido',
          phone: newOrder.numeroCliente,
          items: newOrder.producto,
          total: 'N/A',
          cantidad: newOrder.cantidad,
        };
        setOrders([createdOrder, ...orders]);
        setMessage('Pedido añadido con éxito');
      })
      .catch((err) => {
        console.error('Error al registrar pedido:', err);
        setMessage('Error al registrar pedido');
      });
  };

  const refreshOrders = () => {
    if (negocioId === null) {
      setMessage('Error: Negocio no identificado');
      return;
    }

    axios
      .get(`http://localhost:3000/api/pedidos/${negocioId}`)
      .then((res) => {
        const pedidos: Order[] = (res.data as any[]).map((pedido: any) => ({
          id: pedido.id,
          time: pedido.created_at || new Date().toLocaleTimeString(),
          status: pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1),
          client: 'Desconocido',
          phone: pedido.numero_cliente,
          items: pedido.producto,
          total: 'N/A',
          cantidad: pedido.cantidad,
        }));
        setOrders(pedidos);
        setMessage('Pedidos actualizados');
      })
      .catch((err) => {
        console.error('Error al actualizar pedidos:', err);
        setMessage('Error al actualizar pedidos');
      });
  };

  const filteredOrders = orders
    .filter((order) => {
      if (filter === 'Todos') return true;
      if (filter === 'Recibidos') return order.status === 'Recibido';
      if (filter === 'Enviados') return order.status === 'Enviado';
      return true;
    })
    .filter((order) => (order.phone || '').toLowerCase().includes(searchTerm.toLowerCase())); // Filtramos por número de teléfono

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Mensajes dentro Card */}
      <Card sx={{ p: 3, mb: 4, boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)', borderRadius: 2 }}>
        <TextField
          label="Mensaje Pedido Recibido"
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 2 }}
          value={messages.recibido}
          onChange={(e) => handleMessageChange('recibido', e.target.value)}
        />
        <TextField
          label="Mensaje Pedido Preparando"
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 2 }}
          value={messages.preparando}
          onChange={(e) => handleMessageChange('preparando', e.target.value)}
        />
        <TextField
          label="Mensaje Pedido Enviado"
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 3 }}
          value={messages.enviado}
          onChange={(e) => handleMessageChange('enviado', e.target.value)}
        />
        <Button
          variant="contained"
          sx={{ backgroundColor: '#34C759', '&:hover': { backgroundColor: '#2EA44F' }, borderRadius: 2 }}
          onClick={saveMessages}
        >
          Guardar Mensajes
        </Button>
      </Card>

      {/* Buscador y filtros en box blanco */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: 2, boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Buscar pedidos por teléfono..."
          variant="outlined"
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
          sx={{ width: 300 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Box>
          {['Todos', 'Recibidos', 'Enviados'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'contained' : 'outlined'}
              sx={{
                mr: 1,
                backgroundColor: filter === f ? '#1E3A8A' : 'transparent',
                color: filter === f ? '#FFFFFF' : '#1E3A8A',
                '&:hover': { backgroundColor: '#153E6F', color: '#FFFFFF' },
                borderRadius: 2,
              }}
              onClick={() => setFilter(f as any)}
            >
              {f}
            </Button>
          ))}
          <Button
            startIcon={<RefreshIcon />}
            variant="contained"
            sx={{ mr: 1, backgroundColor: '#1E3A8A', '&:hover': { backgroundColor: '#153E6F' }, borderRadius: 2 }}
            onClick={refreshOrders}
          >
            Actualizar
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            sx={{ backgroundColor: '#34C759', '&:hover': { backgroundColor: '#2EA44F' }, borderRadius: 2 }}
            onClick={addNewOrder}
          >
            Nuevo Pedido
          </Button>
        </Box>
      </Box>

      {/* Pedidos ordenados por hora descendente */}
      {[...filteredOrders]
        .sort((a, b) => {
          const toMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
          };
          return toMinutes(b.time || '00:00') - toMinutes(a.time || '00:00');
        })
        .map((order) => (
          <Card key={order.id} sx={{ boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)', borderRadius: 2, mb: 2, p: 2 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontWeight: 'bold' }}>Pedido {order.id}</Typography>
                <Typography color="text.secondary">{order.time}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['Recibido', 'Preparando', 'Enviado'].map((status) => (
                  <Button
                    key={status}
                    onClick={() => updateStatus(order.id, status as any)}
                    sx={{
                      backgroundColor: order.status === status
                        ? status === 'Recibido'
                          ? '#9CA3AF'
                          : status === 'Preparando'
                          ? '#F59E0B'
                          : '#34C759'
                        : '#E5E7EB',
                      color: order.status === status ? '#FFFFFF' : '#666666',
                      borderRadius: 2,
                      textTransform: 'none',
                      minWidth: 90,
                      fontWeight: order.status === status ? '600' : 'normal',
                      fontSize: '0.875rem',
                    }}
                  >
                    {status}
                  </Button>
                ))}
                <Button
                  variant="contained"
                  sx={{ backgroundColor: '#1E3A8A', '&:hover': { backgroundColor: '#153E6F' }, borderRadius: 2 }}
                  onClick={() => handleOpenModal(order)}
                >
                  Ver Detalles
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Detalles del Pedido
          </Typography>
          {selectedOrder && (
            <>
              <Typography>Cliente: {selectedOrder.client}</Typography>
              <Typography>Teléfono: {selectedOrder.phone}</Typography>
              <Typography>Productos: {selectedOrder.items}</Typography>
              <Typography>Cantidad: {selectedOrder.cantidad}</Typography>
              <Typography>Total: {selectedOrder.total}</Typography>
            </>
          )}
        </Box>
      </Modal>

      {message && (
        <Typography color={message.includes('Error') ? 'error' : 'success.main'} mt={2}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default Orders;