const { formatTime, app } = require('../index');
const supertest = require('supertest');
const { Pool } = require('pg');

// Mock de la base de datos
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn(),
    }),
    on: jest.fn(), // Mock the 'on' method for event listeners
  };
  return {
    Pool: jest.fn(() => mPool),
  };
});

// Mock express-jwt to bypass authentication
jest.mock('express-jwt', () => ({
    expressjwt: jest.fn((options) => (req, res, next) => {
      req.auth = { sub: 'mock-user-id' }; // Simula un usuario autenticado
      next();
    }),
  }));
// Mock axios for Auth0 user info requests
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { email: 'test@example.com', name: 'Test User' } }),
}));

// Prevent initializeClients from running during tests
jest.mock('../whatsapp/client', () => ({
  clients: {},
  initializeClients: jest.fn(),
}));

  

  
  describe('API Endpoints', () => {
    it('should return QR codes for unauthenticated clients', async () => {
      const response = await request.get('/api/qrs');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  
    // Agrega más pruebas según necesites
  });

describe('formatTime', () => {
  it('should format minutes correctly into HH:MM', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(120)).toBe('02:00');
  });
});

describe('GET /api/negocio/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return negocio data when found', async () => {
    const mockNegocio = {
      id: 1,
      nombre: 'Test Negocio',
      numero_telefono: '123456789',
    };
    const poolInstance = new (require('pg').Pool)();
    poolInstance.connect.mockResolvedValueOnce({
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Simula userResult
        .mockResolvedValueOnce({ rows: [mockNegocio] }), // Simula negocioResult
      release: jest.fn(),
    });

    const response = await supertest(app)
      .get('/api/negocio/1')
      .set('Authorization', 'Bearer mock-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockNegocio);
  });

  it('should return 404 when negocio not found', async () => {
    const poolInstance = new (require('pg').Pool)();
    poolInstance.connect.mockResolvedValueOnce({
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Simula userResult
        .mockResolvedValueOnce({ rows: [] }), // Simula negocio no encontrado
      release: jest.fn(),
    });

    const response = await supertest(app)
      .get('/api/negocio/999')
      .set('Authorization', 'Bearer mock-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Negocio no encontrado' });
  });
});

