const { handlePedido, handleReserva } = require('../whatsapp/client');
const axios = require('axios');

// Mock de axios
jest.mock('axios');

// Mock de client.sendMessage
const mockSendMessage = jest.fn();
const client = {
  sendMessage: mockSendMessage
};

// Datos de prueba
const pedidoData = {
  negocioId: 1,
  numeroCliente: '5491112345678@c.us',
  items: [{ nombre: 'Producto 1', cantidad: 2 }]
};

const reservaData = {
  negocioId: 1,
  numeroCliente: '5491112345678@c.us',
  fecha: '2023-06-01',
  hora_inicio: '10:00',
  hora_fin: '11:00'
};

const token = 'mock-token';

describe('handlePedido', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envía mensaje de confirmación si el pedido se registra correctamente', async () => {
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { success: true }
    });

    await handlePedido(pedidoData, token, client);

    expect(mockSendMessage).toHaveBeenCalledWith(
      pedidoData.numeroCliente,
      expect.stringContaining('¡Tu pedido ha sido registrado con éxito!')
    );
  });

  it('envía mensaje de error si falla el registro del pedido', async () => {
    axios.post.mockRejectedValueOnce(new Error('Error de red'));

    await handlePedido(pedidoData, token, client);

    expect(mockSendMessage).toHaveBeenCalledWith(
      pedidoData.numeroCliente,
      'Error al registrar el pedido, intentá de nuevo.'
    );
  });
});

describe('handleReserva', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envía mensaje de confirmación si la reserva se registra correctamente', async () => {
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { success: true }
    });

    await handleReserva(reservaData, token, client);

    expect(mockSendMessage).toHaveBeenCalledWith(
      reservaData.numeroCliente,
      expect.stringContaining('¡Tu reserva ha sido confirmada con éxito!')
    );
  });

  it('envía mensaje de error si falla el registro de la reserva', async () => {
    axios.post.mockRejectedValueOnce(new Error('Error de red'));

    await handleReserva(reservaData, token, client);

    expect(mockSendMessage).toHaveBeenCalledWith(
      reservaData.numeroCliente,
      'Error al confirmar la reserva, intentá de nuevo.'
    );
  });
});