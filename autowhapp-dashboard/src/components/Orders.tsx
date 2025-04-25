import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, TextField, Table, TableBody, TableRow, TableCell, Modal, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { Order } from '../types';

const Orders: React.FC = () => {
  // Datos mockeados para simular los pedidos
  const mockOrders: Order[] = [
    { id: 1, time: '14:30', status: 'Recibido', client: 'Juan Pérez', phone: '+541123456789', items: 'Pizza Margherita', total: '$1500' },
    { id: 2, time: '15:00', status: 'Preparando', client: 'Ana Gómez', phone: '+541198765432', items: 'Coca-Cola', total: '$500' },
  ];

  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderMessage, setOrderMessage] = useState<string>('Tu pedido ha sido actualizado.');
  const [message, setMessage] = useState<string>('');
  const [filter, setFilter] = useState<'Todos' | 'Recibidos' | 'Enviados'>('Todos');

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
    // Simular envío a n8n
    console.log('Simulando envío a n8n:', {
      pedidoId: orderId,
      nuevoEstado: newStatus,
      mensaje: orderMessage || 'Tu pedido ha sido actualizado.',
    });
  };

  const saveOrderMessage = () => {
    setMessage('Mensaje de pedido guardado con éxito (simulado)');
    console.log('Simulando envío a n8n:', { mensaje: orderMessage });
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
    setOrders([...orders, newOrder]);
    setMessage('Pedido añadido con éxito (simulado)');
  };

  const refreshOrders = () => {
    setOrders(mockOrders);
    setMessage('Pedidos actualizados (simulado)');
  };

  const filteredOrders = filter === 'Todos' 
    ? orders 
    : orders.filter(order => 
        filter === 'Recibidos' ? order.status === 'Recibido' : order.status === 'Enviado'
      );

  return (
    <Box sx={{ padding: '24px' }}>
      <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', marginBottom: '16px' }}>
        Módulo de Pedidos
      </Typography>
      <TextField
        fullWidth
        label="Mensaje de Pedido"
        value={orderMessage}
        onChange={(e) => setOrderMessage(e.target.value)}
        placeholder="Ej: Tu pedido ha sido recibido, te avisaremos pronto..."
        variant="outlined"
        sx={{ marginBottom: '16px' }}
      />
      <Button
        variant="contained"
        sx={{ backgroundColor: '#34C759', marginBottom: '16px', borderRadius: '8px', '&:hover': { backgroundColor: '#2EA44F' } }}
        onClick={saveOrderMessage}
      >
        Guardar Mensaje
      </Button>
      <Box display="flex" justifyContent="space-between" marginBottom="16px">
        <TextField
          placeholder="Buscar pedidos..."
          variant="outlined"
          InputProps={{ startAdornment: <SearchIcon sx={{ marginRight: '8px' }} /> }}
          sx={{ width: '300px' }}
        />
        <Box>
          <Button
            variant={filter === 'Todos' ? 'contained' : 'outlined'}
            sx={{
              marginRight: '8px',
              backgroundColor: filter === 'Todos' ? '#1E3A8A' : 'transparent',
              color: filter === 'Todos' ? '#FFFFFF' : '#1E3A8A',
              '&:hover': { backgroundColor: '#153E6F', color: '#FFFFFF' },
            }}
            onClick={() => setFilter('Todos')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'Recibidos' ? 'contained' : 'outlined'}
            sx={{
              marginRight: '8px',
              backgroundColor: filter === 'Recibidos' ? '#1E3A8A' : 'transparent',
              color: filter === 'Recibidos' ? '#FFFFFF' : '#1E3A8A',
              '&:hover': { backgroundColor: '#153E6F', color: '#FFFFFF' },
            }}
            onClick={() => setFilter('Recibidos')}
          >
            Recibidos
          </Button>
          <Button
            variant={filter === 'Enviados' ? 'contained' : 'outlined'}
            sx={{
              marginRight: '8px',
              backgroundColor: filter === 'Enviados' ? '#1E3A8A' : 'transparent',
              color: filter === 'Enviados' ? '#FFFFFF' : '#1E3A8A',
              '&:hover': { backgroundColor: '#153E6F', color: '#FFFFFF' },
            }}
            onClick={() => setFilter('Enviados')}
          >
            Enviados
          </Button>
          <Button
            startIcon={<RefreshIcon />}
            variant="contained"
            sx={{ marginRight: '8px', backgroundColor: '#1E3A8A', '&:hover': { backgroundColor: '#153E6F' } }}
            onClick={refreshOrders}
          >
            Actualizar
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            sx={{ backgroundColor: '#34C759', '&:hover': { backgroundColor: '#2EA44F' } }}
            onClick={addNewOrder}
          >
            Nuevo Pedido
          </Button>
        </Box>
      </Box>
      {filteredOrders.map(order => (
        <Card key={order.id} sx={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '12px', marginBottom: '16px', padding: '16px' }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Pedido {order.id}</Typography>
              <Typography sx={{ fontFamily: 'Poppins', color: '#4B5563' }}>{order.time}</Typography>
            </Box>
            <Box>
              <Button
                onClick={() => updateStatus(order.id, 'Recibido')}
                sx={{
                  backgroundColor: order.status === 'Recibido' ? '#9CA3AF' : '#E5E7EB',
                  color: '#FFFFFF',
                  marginRight: '8px',
                  borderRadius: '8px',
                }}
              >
                Recibido
              </Button>
              <Button
                onClick={() => updateStatus(order.id, 'Preparando')}
                sx={{
                  backgroundColor: order.status === 'Preparando' ? '#F59E0B' : '#E5E7EB',
                  color: '#FFFFFF',
                  marginRight: '8px',
                  borderRadius: '8px',
                }}
              >
                Preparando
              </Button>
              <Button
                onClick={() => updateStatus(order.id, 'Enviado')}
                sx={{
                  backgroundColor: order.status === 'Enviado' ? '#34C759' : '#E5E7EB',
                  color: '#FFFFFF',
                  marginRight: '8px',
                  borderRadius: '8px',
                }}
              >
                Enviado
              </Button>
              <Button
                onClick={() => handleOpenModal(order)}
                variant="contained"
                sx={{ backgroundColor: '#1E3A8A', '&:hover': { backgroundColor: '#153E6F' }, borderRadius: '8px' }}
              >
                Ver Detalles
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'white', boxShadow: 24, p: 4, borderRadius: '12px' }}>
          <Typography sx={{ fontFamily: 'Poppins', fontWeight: 'bold', marginBottom: '16px' }}>Detalles del Pedido</Typography>
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
      {message && (
        <Typography sx={{ color: message.includes('Error') ? 'red' : 'green', marginTop: '16px' }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default Orders;