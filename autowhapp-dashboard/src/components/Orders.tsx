import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, TextField, Box, Modal, Switch, FormControlLabel } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { Order } from '../types';

const BotStatusPedido: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => (
  <FormControlLabel
    control={<Switch checked={active} onChange={onToggle} color="primary" />}
    label={active ? "Módulo Pedido Activado" : "Módulo Pedido Desactivado"}
    sx={{ fontWeight: 'bold', userSelect: 'none' }}
  />
);

const Orders: React.FC = () => {
  const mockOrders: Order[] = [
    { id: 1, time: '14:30', status: 'Recibido', client: 'Juan Pérez', phone: '+541123456789', items: 'Pizza Margherita', total: '$1500' },
    { id: 2, time: '15:00', status: 'Preparando', client: 'Ana Gómez', phone: '+541198765432', items: 'Coca-Cola', total: '$500' },
  ];

  const [orders, setOrders] = useState<Order[]>(mockOrders);
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
  const [moduleActive, setModuleActive] = useState<boolean>(true);


  const handleMessageChange = (key: 'recibido' | 'preparando' | 'enviado', value: string) => {
    setMessages(prev => ({ ...prev, [key]: value }));
  };

  const saveMessages = () => {
    setMessage('Mensajes guardados con éxito (simulado)');
    console.log('Mensajes guardados:', messages);
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
    setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
    setMessage(`Estado del pedido ${orderId} actualizado a ${newStatus} (simulado)`);
    const msgMap = {
      'Recibido': messages.recibido,
      'Preparando': messages.preparando,
      'Enviado': messages.enviado,
    };
    console.log('Simulando envío a n8n:', {
      pedidoId: orderId,
      nuevoEstado: newStatus,
      mensaje: msgMap[newStatus] || 'Tu pedido ha sido actualizado.',
    });
  };

  const addNewOrder = () => {
    const newOrder: Order = {
      id: orders.length + 1,
      time: new Date().toLocaleTimeString(),
      status: 'Recibido',
      client: 'Cliente Nuevo',
      phone: '+541123456789',
      items: 'Producto de prueba',
      total: '$1000',
    };
    setOrders([newOrder, ...orders]);
    setMessage('Pedido añadido con éxito (simulado)');
  };

  const refreshOrders = () => {
    setOrders(mockOrders);
    setMessage('Pedidos actualizados (simulado)');
  };

  const filteredOrders = orders
    .filter(order => {
      if (filter === 'Todos') return true;
      if (filter === 'Recibidos') return order.status === 'Recibido';
      if (filter === 'Enviados') return order.status === 'Enviado';
      return true;
    })
    .filter(order => order.client.toLowerCase().includes(searchTerm.toLowerCase()));

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
          onChange={e => handleMessageChange('recibido', e.target.value)}
        />
        <TextField
          label="Mensaje Pedido Preparando"
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 2 }}
          value={messages.preparando}
          onChange={e => handleMessageChange('preparando', e.target.value)}
        />
        <TextField
          label="Mensaje Pedido Enviado"
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 3 }}
          value={messages.enviado}
          onChange={e => handleMessageChange('enviado', e.target.value)}
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
          placeholder="Buscar pedidos..."
          variant="outlined"
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
          sx={{ width: 300 }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Box>
          {['Todos', 'Recibidos', 'Enviados'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'contained' : 'outlined'}
              sx={{
                mr: 1,
                backgroundColor: filter === f ? '#1E3A8A' : 'transparent',
                color: filter === f ? '#FFFFFF' : '#1E3A8A',
                '&:hover': { backgroundColor: '#153E6F', color: '#FFFFFF' },
                borderRadius: 2
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
          return toMinutes(b.time) - toMinutes(a.time);
        })
        .map(order => (
          <Card key={order.id} sx={{ boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)', borderRadius: 2, mb: 2, p: 2 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontWeight: 'bold' }}>Pedido {order.id}</Typography>
                <Typography color="text.secondary">{order.time}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['Recibido', 'Preparando', 'Enviado'].map(status => (
                  <Button
                    key={status}
                    onClick={() => updateStatus(order.id, status as any)}
                    sx={{
                      backgroundColor: order.status === status
                        ? status === 'Recibido' ? '#9CA3AF'
                        : status === 'Preparando' ? '#F59E0B'
                        : '#34C759'
                        : '#E5E7EB',
                      color: order.status === status ? '#FFFFFF' : '#666666',
                      borderRadius: 2,
                      textTransform: 'none',
                      minWidth: 90,
                      fontWeight: order.status === status ? '600' : 'normal',
                      fontSize: '0.875rem'
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
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>Detalles del Pedido</Typography>
          {selectedOrder && (
            <>
              <Typography>Cliente: {selectedOrder.client}</Typography>
              <Typography>Teléfono: {selectedOrder.phone}</Typography>
              <Typography>Productos: {selectedOrder.items}</Typography>
              <Typography>Total: {selectedOrder.total}</Typography>
            </>
          )}
        </Box>
      </Modal>

      {message && <Typography color={message.includes('Error') ? 'error' : 'success.main'} mt={2}>{message}</Typography>}
    </Box>
  );
};

export default Orders;