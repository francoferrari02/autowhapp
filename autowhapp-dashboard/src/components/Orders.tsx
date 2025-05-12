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
  const { negocioId } = useNegocio();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'Todos' | 'Recibidos' | 'Enviados'>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [products, setProducts] = useState<{ id: number; nombre: string; precio: number }[]>([]); // Estado para los productos

  const [messages, setMessages] = useState({
    recibido: 'Tu pedido ha sido recibido, te avisaremos pronto...',
    preparando: 'Tu pedido está siendo preparado.',
    enviado: 'Tu pedido está listo y en camino.',
  });

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string>('');

  // Cargar productos al montar el componente
  useEffect(() => {
    if (negocioId !== null) {
      axios
        .get(`http://localhost:3000/api/productos/${negocioId}`)
        .then((res) => {
          setProducts(res.data as { id: number; nombre: string; precio: number }[]);
        })
        .catch((err) => {
          console.error('Error al cargar productos:', err);
          setMessage('Error al cargar productos');
        });
    }
  }, [negocioId]);

  // Cargar pedidos y mensajes al montar el componente
  useEffect(() => {
    if (negocioId !== null && products.length > 0) {
      // Cargar pedidos
      axios
        .get(`http://localhost:3000/api/pedidos/${negocioId}`)
        .then((res) => {
          const pedidos: Order[] = (res.data as any[]).map((pedido: any) => {
            // Parsear el campo items (es un JSON string)
            let itemsParsed: { nombre: string; cantidad: number }[] = [];
            try {
              itemsParsed = JSON.parse(pedido.items);
            } catch (err) {
              console.error('Error al parsear items:', err);
              itemsParsed = [];
            }

            // Calcular el total
            const total = itemsParsed.reduce((sum, item) => {
              const product = products.find((p) => p.nombre === item.nombre);
              const price = product ? product.precio : 0;
              return sum + price * item.cantidad;
            }, 0);

            // Formatear la fecha created_at
            let formattedTime = 'Desconocido';
            if (pedido.created_at) {
              const date = new Date(pedido.created_at);
              formattedTime = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            }

            return {
              id: pedido.id,
              time: formattedTime,
              status: pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1),
              client: 'Desconocido',
              phone: pedido.numero_cliente,
              items: itemsParsed, // Guardamos la lista de ítems
              total: total, // Total calculado
              cantidad: '', // Ya no usamos este campo
            };
          });
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
  }, [negocioId, products]);

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

    axios
      .put(`http://localhost:3000/api/pedido/${orderId}/estado`, {
        estado: newStatus.toLowerCase(),
      })
      .then(() => {
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
      numeroCliente: '+541123456789',
      items: [{ nombre: 'Producto de prueba', cantidad: 1 }],
    };

    axios
      .post('http://localhost:3000/api/pedidos/' + negocioId, newOrder)
      .then((res) => {
        const total = newOrder.items.reduce((sum, item) => {
          const product = products.find((p) => p.nombre === item.nombre);
          const price = product ? product.precio : 0;
          return sum + price * item.cantidad;
        }, 0);

        const createdOrder: Order = {
          id: (res.data as { id: number }).id || orders.length + 1,
          time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Recibido',
          client: 'Desconocido',
          phone: newOrder.numeroCliente,
          items: newOrder.items,
          total: total,
          cantidad: '',
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
            const date = new Date(pedido.created_at);
            formattedTime = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
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
    .filter((order) => (order.phone || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
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

      {filteredOrders.map((order) => (
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
              <Typography fontWeight="bold" mt={1}>Productos:</Typography>
              {selectedOrder.items.length > 0 ? (
                selectedOrder.items.map((item, index) => (
                  <Typography key={index}>
                    {item.nombre} - {item.cantidad}
                  </Typography>
                ))
              ) : (
                <Typography>N/A</Typography>
              )}
              <Typography fontWeight="bold" mt={1}>Total: ${selectedOrder.total.toFixed(2)}</Typography>
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