import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, TextField, Box, Modal, Switch, FormControlLabel } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Order } from '../types';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';
import { useAuth0 } from '@auth0/auth0-react';

const BotStatusPedido: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => (
  <FormControlLabel
    control={<Switch checked={active} onChange={onToggle} color="primary" />}
    label={active ? "Módulo Pedido Activado" : "Módulo Pedido Desactivado"}
    sx={{ fontWeight: 'bold', userSelect: 'none', fontFamily: 'Poppins, sans-serif' }}
  />
);

const Orders: React.FC = () => {
  const { negocioId } = useNegocio();
  const { getAccessTokenSilently } = useAuth0();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'Todos' | 'Recibidos' | 'Enviados'>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [products, setProducts] = useState<{ id: number; nombre: string; precio: number }[]>([]);
  const [messages, setMessages] = useState({
    recibido: 'Tu pedido ha sido recibido, te avisaremos pronto...',
    preparando: 'Tu pedido está siendo preparado.',
    enviado: 'Tu pedido está listo y en camino.',
  });
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (negocioId !== null) {
      const fetchProducts = async () => {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
            }
          });
          const res = await axios.get(`http://localhost:3000/api/productos/${negocioId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProducts(res.data as { id: number; nombre: string; precio: number }[]);
        } catch (err) {
          setMessage('Error al cargar productos');
        }
      };
      fetchProducts();
    }
  }, [negocioId, getAccessTokenSilently]);

  useEffect(() => {
    if (negocioId !== null && products.length > 0) {
      const fetchOrders = async () => {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
            }
          });
          const res = await axios.get(`http://localhost:3000/api/pedidos/${negocioId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const pedidos: Order[] = (res.data as any[]).map((pedido: any) => {
            let itemsParsed: { nombre: string; cantidad: number }[] = [];
            try {
              itemsParsed = JSON.parse(pedido.items);
            } catch (err) {
              console.error('Error al parsear items:', err);
              itemsParsed = [];
            }

            const total = itemsParsed.reduce((sum, item) => {
              const product = products.find((p) => p.nombre === item.nombre);
              const price = product ? product.precio : 0;
              return sum + price * item.cantidad;
            }, 0);

            let formattedTime = 'Desconocido';
            if (pedido.created_at) {
              const date = new Date(pedido.created_at + 'Z'); // Asumimos UTC
              formattedTime = date.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Argentina/Buenos_Aires',
              });
            }

            return {
              id: pedido.id,
              time: formattedTime,
              status: pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1),
              client: 'Desconocido',
              phone: pedido.numero_cliente,
              items: itemsParsed,
              total: total,
              cantidad: '',
            };
          });
          setOrders(pedidos);
        } catch (err) {
          setMessage('Error al cargar pedidos');
        }
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
            }
          });
          const res = await axios.get(`http://localhost:3000/api/mensajes-pedidos/${negocioId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const mensajesGuardados = (res.data as { tipo: string; mensaje: string }[]).reduce((acc: any, msg: any) => {
            acc[msg.tipo] = msg.mensaje;
            return acc;
          }, {});
          setMessages((prev) => ({ ...prev, ...mensajesGuardados }));
        } catch (err) {
          setMessage('Error al cargar mensajes de pedidos');
        }
      };
      fetchOrders();
    }
  }, [negocioId, products, getAccessTokenSilently]);

  const handleMessageChange = (key: 'recibido' | 'preparando' | 'enviado', value: string) => {
    setMessages((prev) => ({ ...prev, [key]: value }));
  };

  const saveMessages = async () => {
    if (negocioId === null) {
      setMessage('Error: Negocio no identificado');
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      await axios.post('http://localhost:3000/api/mensajes-pedidos', {
        negocio_id: negocioId,
        mensajes: messages,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Mensajes guardados con éxito');
      // Forzar recarga de mensajes
      const res = await axios.get(`http://localhost:3000/api/mensajes-pedidos/${negocioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mensajesGuardados = (res.data as { tipo: string; mensaje: string }[]).reduce((acc: any, msg: any) => {
        acc[msg.tipo] = msg.mensaje;
        return acc;
      }, {});
      setMessages((prev) => ({ ...prev, ...mensajesGuardados }));
    } catch (err) {
      setMessage('Error al guardar mensajes');
    }
  };

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedOrder(null);
  };

  const updateStatus = async (orderId: number, newStatus: 'Recibido' | 'Preparando' | 'Enviado') => {
    if (negocioId === null) {
      setMessage('Error: Negocio no identificado');
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      await axios.put(`http://localhost:3000/api/pedido/${orderId}/estado`, {
        estado: newStatus.toLowerCase(),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      setMessage(`Estado del pedido ${orderId} actualizado a ${newStatus}`);
    } catch (err) {
      setMessage('Error al actualizar estado del pedido');
    }
  };

  const deleteOrder = async (orderId: number) => {
    if (negocioId === null) {
      setMessage('Error: Negocio no identificado');
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      await axios.delete(`http://localhost:3000/api/pedidos/${negocioId}/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
      setMessage(`Pedido ${orderId} eliminado con éxito`);
    } catch (err) {
      setMessage('Error al eliminar pedido');
    }
  };

  const addNewOrder = async () => {
    if (negocioId === null) {
      setMessage('Error: Negocio no identificado');
      return;
    }
    const newOrder = {
      negocioId,
      numeroCliente: '+541123456789',
      items: [{ nombre: 'Producto de prueba', cantidad: 1 }],
    };
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const res = await axios.post('http://localhost:3000/api/pedidos/' + negocioId, newOrder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const total = newOrder.items.reduce((sum, item) => {
        const product = products.find((p) => p.nombre === item.nombre);
        const price = product ? product.precio : 0;
        return sum + price * item.cantidad;
      }, 0);
      const now = new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
      const date = new Date(now);
      const createdOrder: Order = {
        id: (res.data as { id: number }).id || orders.length + 1,
        time: date.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Argentina/Buenos_Aires',
        }),
        status: 'Recibido',
        client: 'Desconocido',
        phone: newOrder.numeroCliente,
        items: newOrder.items,
        total: total,
        cantidad: '',
      };
      setOrders([createdOrder, ...orders]);
      setMessage('Pedido añadido con éxito');
    } catch (err) {
      setMessage('Error al registrar pedido');
    }
  };

  const refreshOrders = async () => {
    if (negocioId === null) {
      setMessage('Error: Negocio no identificado');
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const res = await axios.get(`http://localhost:3000/api/pedidos/${negocioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pedidos: Order[] = (res.data as any[]).map((pedido: any) => {
        let itemsParsed: { nombre: string; cantidad: number }[] = [];
        try {
          itemsParsed = JSON.parse(pedido.items);
        } catch (err) {
          console.error('Error al parsear items:', err);
          itemsParsed = [];
        }

        const total = itemsParsed.reduce((sum, item) => {
          const product = products.find((p) => p.nombre === item.nombre);
          const price = product ? product.precio : 0;
          return sum + price * item.cantidad;
        }, 0);

        let formattedTime = 'Desconocido';
        if (pedido.created_at) {
          const date = new Date(pedido.created_at + 'Z'); // Asumimos UTC
          formattedTime = date.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Argentina/Buenos_Aires',
          });
        }

        return {
          id: pedido.id,
          time: formattedTime,
          status: pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1),
          client: 'Desconocido',
          phone: pedido.numero_cliente,
          items: itemsParsed,
          total: total,
          cantidad: '',
        };
      });
      setOrders(pedidos);
      setMessage('Pedidos actualizados');
    } catch (err) {
      setMessage('Error al actualizar pedidos');
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      if (filter === 'Todos') return true;
      if (filter === 'Recibidos') return order.status === 'Recibido';
      if (filter === 'Enviados') return order.status === 'Enviado';
      return true;
    })
    .filter((order) => (order.phone || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', fontFamily: 'Poppins, sans-serif' }}>
  <Card sx={{ p: 3, mb: 4, boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)', borderRadius: '4xl', width: 'full' }}>
    <Typography variant="subtitle1" fontWeight="bold" fontFamily="Poppins, sans-serif" mb={1}>
      Mensaje Pedido Preparando
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{ width: 8, height: '100%', backgroundColor: '#F59E0B', mr: 0 }} />
      <TextField
        label=""
        fullWidth
        multiline
        rows={2}
        sx={{
          mb: 2,
          fontFamily: 'Poppins, sans-serif',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          '&:hover': { borderColor: '#a3a3a3' },
          '& .MuiOutlinedInput-root': { borderRadius: '8px' },
        }}
        value={messages.preparando}
        onChange={(e) => handleMessageChange('preparando', e.target.value)}
      />
    </Box>
    <Typography variant="subtitle1" fontWeight="bold" fontFamily="Poppins, sans-serif" mb={1}>
      Mensaje Pedido Enviado
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <Box sx={{ width: 8, height: '100%', backgroundColor: '#34C759', mr: 0 }} />
      <TextField
        label=""
        fullWidth
        multiline
        rows={2}
        sx={{
          mb: 3,
          fontFamily: 'Poppins, sans-serif',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          '&:hover': { borderColor: '#a3a3a3' },
          '& .MuiOutlinedInput-root': { borderRadius: '8px' },
        }}
        value={messages.enviado}
        onChange={(e) => handleMessageChange('enviado', e.target.value)}
      />
    </Box>
    <Button
      variant="contained"
      sx={{
        backgroundColor: '#34C759',
        '&:hover': { backgroundColor: '#2EA44F' },
        borderRadius: '4xl',
        fontFamily: 'Poppins, sans-serif',
        fontWeight: 'bold',
        textTransform: 'none',
      }}
      onClick={saveMessages}
    >
      Guardar Mensajes
    </Button>
  </Card>

  <Box sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: '4xl', boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'full' }}>
    <TextField
      placeholder="Buscar pedidos por teléfono..."
      variant="outlined"
      InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
      sx={{ width: 400, fontFamily: 'Poppins, sans-serif' }}
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
            borderRadius: '4xl',
            fontFamily: 'Poppins, sans-serif',
          }}
          onClick={() => setFilter(f as any)}
        >
          {f}
        </Button>
      ))}
      <Button
        startIcon={<RefreshIcon />}
        variant="contained"
        sx={{ mr: 1, backgroundColor: '#1E3A8A', '&:hover': { backgroundColor: '#153E6F' }, borderRadius: '4xl', fontFamily: 'Poppins, sans-serif' }}
        onClick={refreshOrders}
      >
        Actualizar
      </Button>
      <Button
        startIcon={<AddIcon />}
        variant="contained"
        sx={{ backgroundColor: '#34C759', '&:hover': { backgroundColor: '#2EA44F' }, borderRadius: '4xl', fontFamily: 'Poppins, sans-serif' }}
        onClick={addNewOrder}
      >
        Nuevo Pedido
      </Button>
    </Box>
  </Box>

  {filteredOrders.map((order) => (
    <Card key={order.id} sx={{ boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)', borderRadius: '4xl', mb: 2, display: 'flex', alignItems: 'center', width: 'full' }}>
      <Box
        sx={{
          width: 6,
          height: '100%',
          backgroundColor:
            order.status === 'Recibido' ? '#9CA3AF' : order.status === 'Preparando' ? '#F59E0B' : '#34C759',
          borderRadius: '4px 0 0 4px',
        }}
      />
      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Box>
          <Typography sx={{ fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }}>Pedido {order.id}</Typography>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif' }} color="text.secondary">
            Hora: {order.time}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }} mt={1}>
            Productos:
          </Typography>
          {order.items.map((item, index) => (
            <Typography key={index} sx={{ fontFamily: 'Poppins, sans-serif' }}>
              • {item.nombre} - Cantidad: {item.cantidad}
            </Typography>
          ))}
          <Typography sx={{ fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }} mt={1}>
            Total: ${order.total.toFixed(2)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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
                borderRadius: '4xl',
                textTransform: 'none',
                minWidth: 90,
                fontWeight: order.status === status ? '600' : 'normal',
                fontSize: '0.875rem',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {status}
            </Button>
          ))}
          <Button
            variant="contained"
            sx={{ backgroundColor: '#1E3A8A', '&:hover': { backgroundColor: '#153E6F' }, borderRadius: '4xl', fontFamily: 'Poppins, sans-serif' }}
            onClick={() => handleOpenModal(order)}
          >
            Ver Detalles
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            variant="contained"
            sx={{ backgroundColor: '#EF4444', '&:hover': { backgroundColor: '#DC2626' }, borderRadius: '4xl', fontFamily: 'Poppins, sans-serif' }}
            onClick={() => deleteOrder(order.id)}
          >
            Eliminar
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
        borderRadius: '4xl',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <Typography variant="h6" fontWeight="bold" mb={2} fontFamily="Poppins, sans-serif">
        Detalles del Pedido
      </Typography>
      {selectedOrder && (
        <>
          <Typography fontFamily="Poppins, sans-serif">Cliente: {selectedOrder.client}</Typography>
          <Typography fontFamily="Poppins, sans-serif">Teléfono: {selectedOrder.phone}</Typography>
          <Typography fontWeight="bold" mt={1} fontFamily="Poppins, sans-serif">
            Productos:
          </Typography>
          {selectedOrder.items.length > 0 ? (
            selectedOrder.items.map((item, index) => (
              <Typography key={index} fontFamily="Poppins, sans-serif">
                • {item.nombre} - Cantidad: {item.cantidad}
              </Typography>
            ))
          ) : (
            <Typography fontFamily="Poppins, sans-serif">N/A</Typography>
          )}
          <Typography fontWeight="bold" mt={1} fontFamily="Poppins, sans-serif">
            Total: ${selectedOrder.total.toFixed(2)}
          </Typography>
        </>
      )}
    </Box>
  </Modal>

  {message && (
    <Typography
      color={message.includes('Error') ? 'error' : 'success.main'}
      mt={2}
      fontFamily="Poppins, sans-serif"
    >
      {message}
    </Typography>
  )}
</Box>
  );
};

export default Orders;