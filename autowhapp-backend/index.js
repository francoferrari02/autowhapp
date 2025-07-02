require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
const cron = require('node-cron');
const { clients, initializeClients } = require('./whatsapp/client');
const { expressjwt: jwt } = require('express-jwt');
const jwks = require('jwks-rsa');
const { auth } = require('express-oauth2-jwt-bearer');
const axios = require('axios');
const WebSocket = require('ws');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la base de datos
const dbConfig = {
  user: process.env.DB_USER || 'autowhapp_user',
  host: process.env.DB_HOST, /* || 'db', // Cambia 'localhost' por 'db' */
  database: process.env.DB_NAME || 'autowhapp',
  password: process.env.DB_PASSWORD || 'Autowhapp123',
  port: process.env.DB_PORT || 5432,
};

console.log('Database configuration:', {
  ...dbConfig,
  password: '****' // Ocultamos la contraseña en los logs
});

const db = new Pool(dbConfig);

initializeClients();

// Middleware
// Middleware
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'https://front-production-a39e.up.railway.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Maneja preflight requests

app.use(express.json());

// Configuración de Auth0
const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://dev-15eg10mp60jkcv6l.us.auth0.com/.well-known/jwks.json`
  }),
  audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/',
  issuer: `https://dev-15eg10mp60jkcv6l.us.auth0.com/`,
  algorithms: ['RS256']
}).unless({ path: ['/api/qrs', '/ws'], method: 'OPTIONS' }); // Excluye OPTIONS
// Middleware para logging de requests
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined
    },
    body: req.body
  });
  console.log('Authorization header:', req.headers.authorization);
  console.log('Auth payload:', req.auth);
  next();
});

// Función para verificar la conexión
async function testConnection() {
  let client;
  try {
    client = await db.connect();
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err);
    console.error('Database config:', {
      ...dbConfig,
      password: '****'
    });
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Función para obtener información del usuario de Auth0
async function getUserInfo(token) {
  try {
    const response = await axios.get('https://dev-15eg10mp60jkcv6l.us.auth0.com/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user info from Auth0:', error);
    throw error;
  }
}

function asyncHandler(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Endpoint para obtener negocios del usuario
app.get('/api/user/negocios', checkJwt, asyncHandler(async (req, res) => {
  console.log('Route /api/user/negocios req.auth:', req.auth);
  if (!req.auth) {
    console.error('No auth payload found in request');
    return res.status(401).json({ error: 'No authentication payload found' });
  }

  const auth0Id = req.auth.sub;
  console.log('Auth payload:', req.auth);

  // Obtener información del usuario de Auth0
  const userInfo = await getUserInfo(req.headers.authorization.split(' ')[1]);
  console.log('User info from Auth0:', userInfo);

  if (!userInfo.email) {
    console.error('No email found in user info');
    return res.status(400).json({ error: 'User email is required' });
  }

  let client;
  try {
    client = await db.connect();

    // Verificar si el usuario existe
    const userResult = await client.query(
      'SELECT id FROM users WHERE auth0_id = $1',
      [auth0Id]
    );

    console.log('User query result:', userResult.rows);

    if (userResult.rows.length === 0) {
      console.log('User not found, creating new user');
      // Crear nuevo usuario con la información de Auth0
      const newUserResult = await client.query(
        'INSERT INTO users (auth0_id, email, name) VALUES ($1, $2, $3) RETURNING id',
        [auth0Id, userInfo.email, userInfo.name || 'Usuario']
      );
      console.log('New user created:', newUserResult.rows[0]);
      return res.json([]); // Retornamos array vacío para nuevo usuario
    }

    const userId = userResult.rows[0].id;
    console.log('Found user ID:', userId);

    // Obtener negocios del usuario
    const negociosResult = await client.query(
      'SELECT * FROM negocios WHERE user_id = $1',
      [userId]
    );

    console.log('Negocios encontrados:', negociosResult.rows);
    res.json(negociosResult.rows);
  } catch (err) {
    console.error('Error fetching negocios:', err);
    console.error('Error stack:', err.stack);
    console.error('Request details:', {
      auth0Id: auth0Id,
      headers: req.headers,
      userInfo: userInfo || 'Not fetched'
    });
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: err.message,
      stack: err.stack,
      authPayload: req.auth?.payload
    });
  }
}));

// Inicializar la conexión al inicio
testConnection().then(isConnected => {
  if (!isConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
});

// Add error handler for the pool
db.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Configuración de WebSocket
const wss = new WebSocket.Server({ noServer: true });

// Manejar conexiones WebSocket
wss.on('connection', (ws, req) => {
  
  console.log('New WebSocket connection established');
  
  // Obtener el token del encabezado sec-websocket-protocol
  const token = req.headers['sec-websocket-protocol'];
  if (!token) {
    console.log('No token provided in WebSocket connection');
    ws.close(1008, 'Authentication required');
    return;
  }

  // Verificar el token
  jwt({
    secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://dev-15eg10mp60jkcv6l.us.auth0.com/.well-known/jwks.json`
    }),
    audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/',
    issuer: `https://dev-15eg10mp60jkcv6l.us.auth0.com/`,
    algorithms: ['RS256']
  })({ headers: { authorization: `Bearer ${token}` } }, {}, (err) => {
    if (err) {
      console.log('WebSocket authentication failed:', err);
      ws.close(1008, 'Authentication failed');
      return;
    }
    console.log('WebSocket authentication successful');
    ws.on('message', (message) => {
      console.log('Received:', message);
    });
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
});

// Configurar el servidor HTTP para manejar WebSocket
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Manejar upgrade de HTTP a WebSocket
server.on('upgrade', (request, socket, head) => {
  const token = request.headers['sec-websocket-protocol'];
  
  if (!token) {
    console.log('No token provided in upgrade request');
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Auth0 configuration
const checkJwtExpress = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

// Apply JWT check to all routes except public ones
//app.use(checkJwtExpress.unless({ path: ['/api/public'] }));

// Middleware para manejar errores de autenticación
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
  next(err);
});

cron.schedule('*/30 * * * * *', () => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentDayName = now.toLocaleDateString('es-AR', { weekday: 'long' });
  const currentDayNumber = String(now.getDate());
  const currentDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
  //console.log('🕒 Ejecutando CRON | Hora local:', now.toLocaleTimeString(), '| Minutos:', currentMinutes);

  const toMinutes = (timeString) => {
    const [hh, mm] = timeString.split(':').map(Number);
    return hh * 60 + mm;
  };

  db.query('SELECT * FROM recordatorios WHERE activo = 1', [], async (err, result) => {
    if (err) {
      //console.error('❌ Error al obtener recordatorios:', err.message);
      return;
    }

    const rows = result.rows;
    console.log(`📂 Recordatorios activos encontrados: ${rows.length}`);
    if (rows.length === 0) return;

    for (const recordatorio of rows) {
      try {
        const { id, message, frequency, time, day, negocio_id, last_sent } = recordatorio;
        const reminderMinutes = toMinutes(time);
        const diffMinutes = Math.abs(currentMinutes - reminderMinutes);

        console.log(`🔍 Evaluando recordatorio ID ${id} → "${message}"`);
        console.log(`   - Frecuencia: ${frequency}, Día: ${day}, Hora: ${time}, diffMinutes: ${diffMinutes}`);

        let debeEnviar = false;

        if (last_sent) {
          const lastSentDate = new Date(last_sent);
          const timeSinceLastSent = (now - lastSentDate) / (1000 * 60);
          const isDuplicate = 
            (frequency === 'daily' && lastSentDate.toDateString() === now.toDateString()) ||
            (frequency === 'weekly' && lastSentDate.getDay() === now.getDay()) ||
            (frequency === 'monthly' && lastSentDate.getDate() === now.getDate()) ||
            (frequency === 'once' && lastSentDate.toISOString().slice(0, 10) === now.toISOString().slice(0, 10));

          if (isDuplicate) {
            console.log(`⏸️ Recordatorio ID ${id} ya enviado recientemente`);
            continue;
          }
          if (timeSinceLastSent < 2) {
            console.log(`⏸️ Recordatorio ID ${id} enviado hace menos de 2 minutos (${timeSinceLastSent.toFixed(1)} min)`);
            continue;
          }
        }

        if (frequency === 'daily' && diffMinutes === 0) {
          debeEnviar = true;
        } else if (frequency === 'weekly' && day?.toLowerCase() === currentDayName.toLowerCase() && diffMinutes === 0) {
          debeEnviar = true;
        } else if (frequency === 'monthly' && day === currentDayNumber && diffMinutes === 0) {
          debeEnviar = true;
        } else if (frequency === 'once') {
          const targetDateTime = `${day} ${time}:00`;
          const fullMatch = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}:00`;
          if (targetDateTime === fullMatch) debeEnviar = true;
        }

        if (!debeEnviar) {
          console.log(`⏸️ No se debe enviar el recordatorio ID ${id}`);
          continue;
        }

        console.log(`🚀 Se debe enviar el recordatorio ID ${id}`);
        console.log(`🔎 Buscando cliente autenticado para negocio ${negocio_id}...`);

        const clientObj = clients[negocio_id];
        if (!clientObj || !clientObj.client || !clientObj.authenticated) {
          console.error(`❌ No hay cliente autenticado para negocio ${negocio_id}`);
          continue;
        }

        const client = clientObj.client;
        console.log('✅ Cliente autenticado encontrado');

        console.log('📡 Verificando estado del cliente...');
        const state = await client.getState();
        console.log(`📡 Estado del cliente: ${state}`);
        if (state !== 'CONNECTED') {
          console.error(`❌ Cliente no conectado para negocio ${negocio_id}. Estado: ${state}`);
          continue;
        }

        console.log('Obteniendo chat del grupo...');
        let grupo;
        const negocio = await new Promise((resolve) => db.query('SELECT grupo_id FROM negocios WHERE id = $1', [negocio_id], (err, row) => resolve(row)));
        if (negocio && negocio.rows[0] && negocio.rows[0].grupo_id) {
          try {
            grupo = await client.getChatById(negocio.rows[0].grupo_id);
            console.log(`✅ Chat del grupo obtenido directamente: ${grupo.name}`);
          } catch (err) {
            console.error('❌ Error al obtener chat por ID:', err.message);
          }
        }

        if (!grupo) {
          console.log('🔍 No se encontró groupId o falló getChatById, obteniendo todos los chats...');
          let chats;
          const maxAttempts = 3;
          let attempt = 0;
          while (attempt < maxAttempts) {
            try {
              console.time(`getChats intento ${attempt + 1}`);
              chats = await Promise.race([
                client.getChats(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout al obtener chats')), 15000))
              ]);
              console.timeEnd(`getChats intento ${attempt + 1}`);
              break;
            } catch (chatErr) {
              attempt++;
              console.error(`❌ Error al obtener chats (intento ${attempt}/${maxAttempts}):`, chatErr.message);
              if (attempt === maxAttempts) continue;
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          if (!chats) {
            console.error(`❌ No se pudieron obtener chats después de ${maxAttempts} intentos`);
            continue;
          }
          grupo = chats.find(chat => chat.isGroup && chat.name === 'Prueba Autowhapp');
        }

        if (!grupo) {
          console.error(`❌ No se encontró el grupo "Prueba Autowhapp" para negocio ${negocio_id}`);
          continue;
        }

        console.log(`📤 Enviando mensaje al grupo ID: ${grupo.id._serialized}`);
        console.time(`🕐 Tiempo envío recordatorio ID ${id}`);

        try {
          await client.sendMessage(grupo.id._serialized, `🔔 Recordatorio: ${message}`);
          console.timeEnd(`🕐 Tiempo envío recordatorio ID ${id}`);
          console.log(`✉️ Recordatorio enviado con éxito para ID ${id}`);

          db.query('UPDATE recordatorios SET last_sent = $1 WHERE id = $2', [currentDateTime, id], (err) => {
            if (err) console.error('❌ Error al actualizar last_sent:', err.message);
            else console.log(`✅ last_sent actualizado para recordatorio ID ${id}`);
          });
        } catch (sendErr) {
          console.error(`🚨 Error al enviar mensaje para recordatorio ID ${id}:`, sendErr.message);
        }
      } catch (err) {
        console.error(`❌ Error procesando recordatorio ID ${recordatorio.id}:`, err.message);
      }
    }
  });
});

// Helper function to format minutes into HH:MM
const formatTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Endpoint para obtener la configuración del negocio
app.get('/api/negocio/:id', checkJwt, async (req, res) => {
  const { id } = req.params;
  const auth0Id = req.auth.sub;

  try {
    const result = await db.query(
      `SELECT n.* FROM negocios n
       JOIN users u ON n.user_id = u.id
       WHERE n.id = $1 AND u.auth0_id = $2`,
      [id, auth0Id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener negocio:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para registrar reservas
app.post('/api/reservas/:negocioId', checkJwt, (req, res) => {
  const { negocioId } = req.params;
  const { fecha, hora_inicio, hora_fin, ocupado = 1, cliente, telefono, descripcion } = req.body;
  console.log('Datos recibidos en POST /api/reservas:', { negocioId, fecha, hora_inicio, hora_fin, ocupado, cliente, telefono, descripcion });

  if (!fecha || !hora_inicio || !hora_fin) {
    console.log('Faltan campos obligatorios: fecha, hora_inicio o hora_fin');
    return res.status(400).json({ error: 'fecha, hora_inicio y hora_fin son requeridos' });
  }

  db.query('SELECT modulo_reservas, appointment_duration, break_between, hora_inicio_default, hora_fin_default FROM negocios WHERE id = $1', [negocioId], (err, row) => {
    if (err) {
      console.error('Error al verificar negocio:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!row || row.rows[0] && row.rows[0].modulo_reservas !== 1) {
      console.log('Módulo de reservas no activo para negocio:', negocioId);
      return res.status(403).json({ error: 'Módulo de reservas no activo' });
    }

    const { appointment_duration, break_between, hora_inicio_default, hora_fin_default } = row.rows[0];

    // Convertir horas a minutos para calcular duración
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const startMinutes = toMinutes(hora_inicio);
    const endMinutesReserva = toMinutes(hora_fin);
    const duration = endMinutesReserva - startMinutes;

    if (duration !== appointment_duration) {
      console.log('Duración de la reserva no coincide con appointment_duration');
      return res.status(400).json({ error: `La duración debe ser de ${appointment_duration} minutos` });
    }

    // Generar slots posibles para el día
    const slots = [];
    let currentMinutes = toMinutes(hora_inicio_default);
    const endMinutes = toMinutes(hora_fin_default);

    while (currentMinutes + appointment_duration <= endMinutes) {
      const start = formatTime(currentMinutes);
      const end = formatTime(currentMinutes + appointment_duration);
      slots.push({ start, end });
      currentMinutes += appointment_duration + break_between;
    }

    // Verificar si el rango solicitado coincide con un slot
    const requestedSlot = { start: hora_inicio, end: hora_fin };
    const isValidSlot = slots.some(slot => slot.start === requestedSlot.start && slot.end === requestedSlot.end);
    if (!isValidSlot) {
      console.log('Horario solicitado no coincide con un slot disponible:', slots, requestedSlot);
      return res.status(400).json({ error: 'El horario no coincide con un slot válido' });
    }

    db.query(
      'SELECT * FROM reservas WHERE negocio_id = $1 AND fecha = $2 AND ((hora_inicio <= $3 AND hora_fin >= $4) OR (hora_inicio <= $5 AND hora_fin >= $6))',
      [negocioId, fecha, hora_fin, hora_inicio, hora_fin, hora_inicio],
      (err, reservas) => {
        if (err) {
          console.error('Error al verificar superposición:', err.message);
          return res.status(500).json({ error: err.message });
        }
        if (reservas.rows.length > 0) {
          console.log('Conflicto de horario con otra reserva');
          return res.status(409).json({ error: 'Conflicto de horario con otra reserva' });
        }

        db.query(
          'INSERT INTO reservas (negocio_id, fecha, hora_inicio, hora_fin, ocupado, cliente, telefono, descripcion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [negocioId, fecha, hora_inicio, hora_fin, ocupado ? 1 : 0, cliente || '', telefono || '', descripcion || ''],
          function (err) {
            if (err) {
              console.error('Error al registrar reserva:', err.message);
              return res.status(500).json({ error: err.message });
            }
            console.log('Reserva registrada con éxito, ID:', this.lastID);
            res.json({ success: true, id: this.lastID });
          }
        );
      }
    );
  });
});



app.get('/api/cantReservas/:negocioId', checkJwt, asyncHandler(async (req, res) => {
  try {
    const { negocioId } = req.params;
    const { year, month } = req.query;
    console.log(`Solicitud GET /api/cantReservas/${negocioId})`);
    // Si falta algún parámetro, devuelve 0
    if (!negocioId || !year || !month) {
      return res.json({ count: 0 });
    }

    // Si no hay autenticación, devuelve 0
    if (!req.auth || !req.auth.sub) {
      return res.json({ count: 0 });
    }

    const auth0Id = req.auth.sub;
    let client;

    try {
      client = await db.connect();

      // Busca el usuario
      const userResult = await client.query(
        'SELECT id FROM users WHERE auth0_id = $1',
        [auth0Id]
      );

      // Si no existe el usuario, devuelve 10
      if (userResult.rows.length === 0) {
        return res.json({ count: 10 });
      }

      const userId = userResult.rows[0].id;

      // Verifica si el negocio pertenece al usuario
      const negocioResult = await client.query(
        'SELECT id FROM negocios WHERE id = $1 AND user_id = $2',
        [negocioId, userId]
      );

      // Si el negocio no pertenece al usuario, devuelve 0
      if (negocioResult.rows.length === 0) {
        return res.json({ count: 0 });
      }

      // Cuenta las ventas
      const reservasResult = await client.query(
        `SELECT COUNT(*) as count 
         FROM reservas 
         WHERE negocio_id = $1 `,
        [negocioId]
         
      );

      const count = parseInt(reservasResult.rows[0].count, 10);
      return res.json({ count });

    } catch (dbError) {
      // Si hay error en la base de datos, devuelve -1
      console.error('Error en la base de datos:', dbError);
      if(client){
        return res.json({ count: -400 });
      }
      return res.json({ count: -300 });
    } finally {
      if (client) client.release();
    }
  } catch (err) {
    // Si hay cualquier otro error, devuelve -2
    console.error('Error inesperado:', err);
    return res.json({ count: -2 });
  }
}));

// Endpoint para cancelar reservas
app.delete('/api/reservas/:negocioId/:reservaId', checkJwt, (req, res) => {
  const { negocioId, reservaId } = req.params;
  console.log(`Solicitud DELETE /api/reservas/${negocioId}/${reservaId}`);

  db.query('SELECT * FROM reservas WHERE id = $1 AND negocio_id = $2', [reservaId, negocioId], (err, reserva) => {
    if (err) {
      console.error('Error al verificar reserva:', err.message);
      return res.status(500).json({ error: 'Error al verificar la reserva: ' + err.message });
    }
    if (!reserva.rows[0]) {
      console.log(`Reserva ${reservaId} no encontrada para negocio ${negocioId}`);
      return res.status(404).json({ error: 'Reserva no encontrada o no pertenece a este negocio' });
    }

    db.query('DELETE FROM reservas WHERE id = $1 AND negocio_id = $2', [reservaId, negocioId], function (err) {
      if (err) {
        console.error('Error al cancelar reserva:', err.message);
        return res.status(500).json({ error: 'Error al cancelar la reserva: ' + err.message });
      }
      if (this.rowCount === 0) {
        console.log(`Reserva ${reservaId} no encontrada para negocio ${negocioId}`);
        return res.status(404).json({ error: 'Reserva no encontrada o no pertenece a este negocio' });
      }
      console.log(`Reserva ${reservaId} cancelada con éxito para negocio ${negocioId}`);
      res.json({ success: true });
    });
  });
});

// Endpoint para actualizar configuración de reservas
app.put('/api/reservas/:negocioId', checkJwt, (req, res) => {
  const { negocioId } = req.params;
  const { appointmentDuration, breakBetween, hora_inicio_default, hora_fin_default } = req.body;
  console.log('Datos recibidos en PUT /api/reservas:', { negocioId, appointmentDuration, breakBetween, hora_inicio_default, hora_fin_default });

  if (appointmentDuration == null || breakBetween == null || hora_inicio_default == null || hora_fin_default == null) {
    console.log('Faltan campos obligatorios');
    return res.status(400).json({ error: 'appointmentDuration, breakBetween, hora_inicio_default y hora_fin_default son requeridos' });
  }

  if (appointmentDuration <= 0 || breakBetween < 0) {
    console.log('Valores inválidos para appointmentDuration o breakBetween');
    return res.status(400).json({ error: 'appointmentDuration debe ser mayor que 0 y breakBetween no puede ser negativo' });
  }

  db.query(
    'UPDATE negocios SET appointment_duration = $1, break_between = $2, hora_inicio_default = $3, hora_fin_default = $4 WHERE id = $5',
    [appointmentDuration, breakBetween, hora_inicio_default, hora_fin_default, negocioId],
    (err) => {
      if (err) {
        console.error('Error al actualizar configuración de reservas:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Configuración de reservas actualizada para negocio ${negocioId}`);
      res.json({ success: true });
    }
  );
});

// Endpoint para eliminar pedidos
app.delete('/api/pedidos/:negocioId/:pedidoId', checkJwt, (req, res) => {
  const { negocioId, pedidoId } = req.params;
  console.log(`Solicitud DELETE /api/pedidos/${negocioId}/${pedidoId}`);

  db.query('SELECT * FROM pedidos WHERE id = $1 AND negocio_id = $2', [pedidoId, negocioId], (err, pedido) => {
    if (err) {
      console.error('Error al verificar pedido:', err.message);
      return res.status(500).json({ error: 'Error al verificar el pedido: ' + err.message });
    }
    if (!pedido.rows[0]) {
      console.log(`Pedido ${pedidoId} no encontrado para negocio ${negocioId}`);
      return res.status(404).json({ error: 'Pedido no encontrado o no pertenece a este negocio' });
    }

    db.query('DELETE FROM pedidos WHERE id = $1 AND negocio_id = $2', [pedidoId, negocioId], function (err) {
      if (err) {
        console.error('Error al eliminar pedido:', err.message);
        return res.status(500).json({ error: 'Error al eliminar el pedido: ' + err.message });
      }
      if (this.rowCount === 0) {
        console.log(`Pedido ${pedidoId} no encontrado para negocio ${negocioId}`);
        return res.status(404).json({ error: 'Pedido no encontrado o no pertenece a este negocio' });
      }
      console.log(`Pedido ${pedidoId} eliminado con éxito para negocio ${negocioId}`);
      res.json({ success: true });
    });
  });
});

// Endpoint para actualizar el estado de un pedido
app.put('/api/pedido/:id/estado', checkJwt, (req, res) => {
  const { estado } = req.body;
  console.log(`Solicitud PUT /api/pedido/${req.params.id}/estado:`, { estado });

  db.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [estado, req.params.id], async (err) => {
    if (err) {
      console.error('Error al actualizar estado del pedido:', err.message);
      return res.status(500).json({ error: err.message });
    }
    const pedido = await new Promise((resolve) => db.query('SELECT * FROM pedidos WHERE id = $1', [req.params.id], (e, r) => resolve(r)));
    const mensaje = await new Promise((resolve) => db.query('SELECT mensaje FROM mensajes_pedidos WHERE negocio_id = $1 AND tipo = $2', [pedido.rows[0].negocio_id, estado.toLowerCase()], (e, r) => resolve(r?.rows[0]?.mensaje)));
    console.log(`Mensaje recuperado para estado ${estado}: ${mensaje}`);
    if (mensaje && clients[pedido.rows[0].negocio_id]?.client) {
      console.log(`Buscando grupo "Prueba Autowhapp" para negocio ${pedido.rows[0].negocio_id}`);
      let grupo;
      const negocio = await new Promise((resolve) => db.query('SELECT grupo_id FROM negocios WHERE id = $1', [pedido.rows[0].negocio_id], (err, row) => resolve(row)));
      if (negocio && negocio.rows[0] && negocio.rows[0].grupo_id) {
        try {
          grupo = await clients[pedido.rows[0].negocio_id].client.getChatById(negocio.rows[0].grupo_id);
          console.log(`✅ Chat del grupo obtenido: ${grupo.name}`);
        } catch (err) {
          console.error('❌ Error al obtener chat por ID:', err.message);
        }
      }
      if (!grupo) {
        const chats = await clients[pedido.rows[0].negocio_id].client.getChats();
        grupo = chats.find(chat => chat.isGroup && chat.name === 'Prueba Autowhapp');
      }
      if (grupo) {
        console.log(`Enviando mensaje al grupo ${grupo.id._serialized}: ${mensaje}`);
        await clients[pedido.rows[0].negocio_id].client.sendMessage(grupo.id._serialized, mensaje);
      } else {
        console.error(`❌ No se encontró el grupo "Prueba Autowhapp" para negocio ${pedido.rows[0].negocio_id}`);
      }
    }
    console.log(`Estado del pedido ${req.params.id} actualizado a: ${estado}`);
    res.json({ success: true });
  });
});

// Otros endpoints
// index.js
app.get('/api/qrs', (req, res) => {
  db.query('SELECT id, nombre FROM negocios', [], (err, negocios) => {
    if (err) {
      console.error('Error al obtener negocios:', err.message);
      return res.status(500).json({ error: err.message });
    }

    const qrs = negocios.rows.map(negocio => {
      const negocioId = negocio.id;
      return {
        negocioId,
        qr: clients[negocioId]?.qr || null,
        authenticated: clients[negocioId]?.authenticated || false,
        nombre: negocio.nombre
      };
    }).filter(client => !client.authenticated && client.qr); // Solo devolver QR si no está autenticado y tiene QR
    console.log('QRs generados:', qrs);
    res.json(qrs);
  });
});
app.post('/api/actualizar-estado-bot', checkJwt, async (req, res) => {
  const { negocioId, estadoBot } = req.body;
  const auth0Id = req.auth.sub;

  console.log('Datos recibidos en POST /api/actualizar-estado-bot:', { negocioId, estadoBot });

  if (!negocioId || estadoBot === undefined) {
    console.log('Faltan campos obligatorios: negocioId o estadoBot');
    return res.status(400).json({ error: 'negocioId y estadoBot son requeridos' });
  }

  let client;
  try {
    client = await db.connect();

    // Verificar que el negocio pertenezca al usuario autenticado
    const userResult = await client.query(
      'SELECT n.id FROM negocios n JOIN users u ON n.user_id = u.id WHERE n.id = $1 AND u.auth0_id = $2',
      [negocioId, auth0Id]
    );

    if (userResult.rows.length === 0) {
      console.log('Negocio no encontrado o no pertenece al usuario');
      return res.status(404).json({ error: 'Negocio no encontrado o no autorizado' });
    }

    // Actualizar el estado del bot
    await client.query(
      'UPDATE negocios SET estado_bot = $1 WHERE id = $2',
      [estadoBot ? 1 : 0, negocioId]
    );

    console.log(`Estado del bot actualizado para negocio ${negocioId}:`, estadoBot);
    res.json({ success: true });
  } catch (err) {
    console.error('Error al actualizar estado del bot:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

app.post('/api/actualizar-modulo-pedidos', checkJwt, (req, res) => {
  const { negocioId, moduloPedidos } = req.body;
  console.log('Datos recibidos en POST /api/actualizar-modulo-pedidos:', { negocioId, moduloPedidos });

  if (!negocioId || moduloPedidos === undefined) {
    console.log('Faltan campos obligatorios: negocioId o moduloPedidos');
    return res.status(400).json({ error: 'negocioId y moduloPedidos son requeridos' });
  }

  db.query('UPDATE negocios SET modulo_pedidos = $1 WHERE id = $2', [moduloPedidos ? 1 : 0, negocioId], (err) => {
    if (err) {
      console.error('Error al actualizar modulo de pedidos:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Estado del módulo de pedidos actualizado para negocio ${negocioId}:`, moduloPedidos);
    res.json({ success: true });
  });
});

app.post('/api/actualizar-modulo-reservas', checkJwt, (req, res) => {
  const { negocioId, moduloReservas } = req.body;
  console.log('Datos recibidos en POST /api/actualizar-modulo-reservas:', { negocioId, moduloReservas });

  if (!negocioId || moduloReservas === undefined) {
    console.log('Faltan campos obligatorios: negocioId o moduloReservas');
    return res.status(400).json({ error: 'negocioId y moduloReservas son requeridos' });
  }

  db.query('UPDATE negocios SET modulo_reservas = $1 WHERE id = $2', [moduloReservas ? 1 : 0, negocioId], (err) => {
    if (err) {
      console.error('Error al actualizar modulo de reservas:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Estado del módulo de reservas actualizado para negocio ${negocioId}:`, moduloReservas);
    res.json({ success: true });
  });
});

app.post('/api/actualizar-modulo-recordatorios', checkJwt, (req, res) => {
  const { negocioId, moduloRecordatorios } = req.body;
  console.log('Datos recibidos en POST /api/actualizar-modulo-recordatorios:', { negocioId, moduloRecordatorios });

  if (!negocioId || moduloRecordatorios === undefined) {
    console.log('Faltan campos obligatorios: negocioId o moduloRecordatorios');
    return res.status(400).json({ error: 'negocioId y moduloRecordatorios son requeridos' });
  }

  db.query('UPDATE negocios SET modulo_recordatorios = $1 WHERE id = $2', [moduloRecordatorios ? 1 : 0, negocioId], (err) => {
    if (err) {
      console.error('Error al actualizar módulo de recordatorios:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Estado del módulo de recordatorios actualizado para negocio ${negocioId}:`, moduloRecordatorios);
    res.json({ success: true });
  });
});

const mercadoPago = require('./mercado-pago');

app.use(express.json());

// Endpoint para crear link de pago
app.post('/api/mercadopago/create', async (req, res) => {
  try {
    const { title, price, quantity } = req.body;

    const link = await mercadoPago.createPaymentPreference({
      title,
      price,
      quantity
    });

    res.json({ link });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/negocios', checkJwt, async (req, res) => {
  let client;
  try {
    const { nombre, numero_telefono, tipo_negocio, localidad, direccion, horarios, contexto, plan } = req.body;
    
    if (!nombre || !numero_telefono || !tipo_negocio || !localidad || !direccion) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const auth0Id = req.auth.sub;
    client = await db.connect();
    
    // Buscar el ID del usuario basado en auth0_id
    const userResult = await client.query(
      'SELECT id FROM users WHERE auth0_id = $1',
      [auth0Id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const userId = userResult.rows[0].id;

    // Insertar el negocio
    const result = await client.query(
      `INSERT INTO negocios (nombre, numero_telefono, tipo_negocio, localidad, direccion, horarios, contexto, user_id, plan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [nombre, numero_telefono, tipo_negocio, localidad, direccion, horarios, contexto, userId, plan]
    );

    await initializeClients();

    res.status(201).json({ 
      message: 'Negocio creado exitosamente',
      id: result.rows[0].id 
    });
  } catch (error) {
    console.error('Error al crear el negocio:', error);
    res.status(500).json({ 
      error: 'Error al crear el negocio',
      details: error.message 
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.put('/api/negocio/:id', checkJwt, (req, res) => {
  const { nombre, tipo_negocio, localidad, direccion, horarios, contexto, modulo_pedidos, estado_bot, modulo_reservas } = req.body;
  console.log(`Solicitud PUT /api/negocio/${req.params.id}:`, req.body);

  db.query(
    `UPDATE negocios SET nombre = $1, tipo_negocio = $2, localidad = $3, direccion = $4, horarios = $5, contexto = $6, modulo_pedidos = $7, estado_bot = $8, modulo_reservas = $9 WHERE id = $10`,
    [nombre, tipo_negocio, localidad, direccion, JSON.stringify(horarios), contexto, modulo_pedidos ? 1 : 0, estado_bot ? 1 : 0, modulo_reservas ? 1 : 0, req.params.id],
    (err) => {
      if (err) {
        console.error('Error al actualizar negocio:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Negocio ${req.params.id} actualizado con éxito`);
      res.json({ success: true });
    }
  );
});

app.get('/api/faqs/:negocioId', checkJwt, (req, res) => {
  const negocioId = req.params.negocioId;
  console.log(`Solicitud GET /api/faqs/${negocioId}`);
  db.query('SELECT * FROM faqs WHERE negocio_id = $1', [negocioId], (err, rows) => {
    if (err) {
      console.error('Error al obtener FAQs:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.rows);
  });
});

app.post('/api/faqs', checkJwt, async (req, res) => {
  const { negocioId, pregunta, respuesta } = req.body;
  if (!negocioId || !pregunta || !respuesta) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const result = await db.query(
      `INSERT INTO faqs (negocio_id, pregunta, respuesta)
       VALUES ($1, $2, $3) RETURNING id`,
       [negocioId, pregunta, respuesta]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Error al crear FAQ:', err);
    res.status(500).json({ error: err.message });
  }
});


app.put('/api/faqs/:id', checkJwt, (req, res) => {
  const { pregunta, respuesta } = req.body;
  console.log(`Solicitud PUT /api/faqs/${req.params.id}:`, { pregunta, respuesta });

  db.query('UPDATE faqs SET pregunta = $1, respuesta = $2 WHERE id = $3',
    [pregunta, respuesta, req.params.id],
    function(err) {
      if (err) {
        console.error('Error al actualizar FAQ:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`FAQ ${req.params.id} actualizada con éxito`);
      res.json({ success: true });
    }
  );
});

app.delete('/api/faqs/:id', checkJwt, (req, res) => {
  console.log(`Solicitud DELETE /api/faqs/${req.params.id}`);
  db.query('DELETE FROM faqs WHERE id = $1', [req.params.id], function(err) {
    if (err) {
      console.error('Error al eliminar FAQ:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`FAQ ${req.params.id} eliminada con éxito`);
    res.json({ success: true });
  });
});

app.get('/api/negocios', (req, res) => {
  console.log('Solicitud GET /api/negocios');
  db.query('SELECT * FROM negocios', [], (err, rows) => {
    if (err) {
      console.error('Error al listar negocios:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.rows);
  });
});

app.post('/api/productos', checkJwt, (req, res) => {
  const { negocio_id, nombre, descripcion, precio, foto } = req.body;
  console.log('Datos recibidos en POST /api/productos:', { negocio_id, nombre, descripcion, precio, foto });

  if (!negocio_id || !nombre || precio == null) {
    console.log('Faltan campos obligatorios para crear producto');
    return res.status(400).json({ error: 'negocio_id, nombre y precio son requeridos' });
  }

  if (typeof precio !== 'number' || isNaN(precio) || precio <= 0) {
    console.log('El precio debe ser un número válido mayor que 0');
    return res.status(400).json({ error: 'El precio debe ser un número válido mayor que 0' });
  }

  db.query('INSERT INTO productos (negocio_id, nombre, descripcion, precio, foto) VALUES ($1, $2, $3, $4, $5)',
    [negocio_id, nombre, descripcion, precio, foto], (err) => {
      if (err) {
        console.error('Error al crear producto:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Producto creado con éxito');
      res.json({ success: true });
    });
});

app.get('/api/productos/:negocioId', checkJwt, (req, res) => {
  console.log(`Solicitud GET /api/productos/${req.params.negocioId}`);
  db.query('SELECT * FROM productos WHERE negocio_id = $1', [req.params.negocioId], (err, rows) => {
    if (err) {
      console.error('Error al obtener productos:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.rows);
  });
});

app.put('/api/productos/:id', checkJwt, (req, res) => {
  const { nombre, descripcion, precio, foto } = req.body;
  console.log(`Solicitud PUT /api/productos/${req.params.id}:`, { nombre, descripcion, precio, foto });

  if (!nombre || precio == null) {
    console.log('Faltan campos obligatorios para actualizar producto');
    return res.status(400).json({ error: 'nombre y precio son requeridos' });
  }

  if (typeof precio !== 'number' || isNaN(precio) || precio <= 0) {
    console.log('El precio debe ser un número válido mayor que 0');
    return res.status(400).json({ error: 'El precio debe ser un número válido mayor que 0' });
  }

  db.query('UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, foto = $4 WHERE id = $5',
    [nombre, descripcion, precio, foto, req.params.id], (err) => {
      if (err) {
        console.error('Error al actualizar producto:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Producto ${req.params.id} actualizado con éxito`);
      res.json({ success: true });
    });
});

app.delete('/api/productos/:id', checkJwt, (req, res) => {
  console.log(`Solicitud DELETE /api/productos/${req.params.id}`);
  db.query('DELETE FROM productos WHERE id = $1', [req.params.id], (err) => {
    if (err) {
      console.error('Error al eliminar producto:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Producto ${req.params.id} eliminado con éxito`);
    res.json({ success: true });
  });
});

app.post('/api/mensajes-pedidos', checkJwt, (req, res) => {
  const { negocio_id, mensajes } = req.body;
  console.log('Datos recibidos en POST /api/mensajes-pedidos:', { negocio_id, mensajes });

  const tipos = ['recibido', 'preparando', 'enviado'];
  db.query('BEGIN', (err) => {
    if (err) {
      console.error('Error al iniciar transacción:', err.message);
      return res.status(500).json({ error: err.message });
    }
    tipos.forEach(tipo => {
      db.query('INSERT OR REPLACE INTO mensajes_pedidos (negocio_id, tipo, mensaje) VALUES ($1, $2, $3)',
        [negocio_id, tipo, mensajes[tipo]], (err) => {
          if (err) {
            console.error(`Error al insertar mensaje de pedido para ${tipo}:`, err.message);
          } else {
            console.log(`Mensaje para ${tipo} actualizado: ${mensajes[tipo]}`);
          }
        });
    });
    db.query('COMMIT', (err) => {
      if (err) {
        console.error('Error al confirmar transacción:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Mensajes de pedidos actualizados con éxito');
      res.json({ success: true });
    });
  });
});

// Endpoint para crear un recordatorio
app.post('/api/recordatorios/:negocioId', checkJwt, (req, res) => {
  const { negocioId } = req.params;
  const { message, frequency, time, day, activo = 1 } = req.body;
  console.log('Datos recibidos en POST /api/recordatorios/:negocioId:', { negocioId, message, frequency, time, day, activo });

  if (!message || !frequency || !time) {
    console.log('Faltan campos obligatorios: message, frequency o time');
    return res.status(400).json({ error: 'message, frequency y time son requeridos' });
  }

  // Validar el formato de time (HH:MM)
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.log('Formato de hora inválido:', time);
    return res.status(400).json({ error: 'El formato de hora debe ser HH:MM válido' });
  }

  // Ajustar day según la frecuencia
  const normalizedDay = frequency === 'once' && day ? new Date(day).toISOString().slice(0, 10) : day;

  db.query(
    'INSERT INTO recordatorios (negocio_id, message, frequency, time, day, activo, last_sent) VALUES ($1, $2, $3, $4, $5, $6, NULL)',
    [negocioId, message, frequency, time, normalizedDay, activo ? 1 : 0],
    function (err) {
      if (err) {
        console.error('Error al crear recordatorio:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Recordatorio creado con éxito, ID:', this.lastID);
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Endpoint para actualizar un recordatorio
app.put('/api/recordatorios/:id', checkJwt, (req, res) => {
  const { id } = req.params;
  const { message, frequency, time, day, activo = 1 } = req.body;
  console.log('Datos recibidos en PUT /api/recordatorios/:id:', { id, message, frequency, time, day, activo });

  if (!message || !frequency || !time) {
    console.log('Faltan campos obligatorios: message, frequency o time');
    return res.status(400).json({ error: 'message, frequency y time son requeridos' });
  }

  // Validar el formato de time (HH:MM)
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.log('Formato de hora inválido:', time);
    return res.status(400).json({ error: 'El formato de hora debe ser HH:MM válido' });
  }

  // Ajustar day según la frecuencia
  const normalizedDay = frequency === 'once' && day ? new Date(day).toISOString().slice(0, 10) : day;

  db.query(
    'UPDATE recordatorios SET message = $1, frequency = $2, time = $3, day = $4, activo = $5 WHERE id = $6',
    [message, frequency, time, normalizedDay, activo ? 1 : 0, id],
    function (err) {
      if (err) {
        console.error('Error al actualizar recordatorio:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (this.rowCount === 0) {
        console.log('Recordatorio no encontrado:', id);
        return res.status(404).json({ error: 'Recordatorio no encontrado' });
      }
      console.log('Recordatorio actualizado con éxito, ID:', id);
      res.json({ success: true });
    }
  );
});

// Endpoint para activar/desactivar un recordatorio
app.put('/api/recordatorios/:id/activo', checkJwt, (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;
  console.log('Datos recibidos en PUT /api/recordatorios/:id/activo:', { id, activo });

  if (activo === undefined) {
    console.log('Falta el campo obligatorio: activo');
    return res.status(400).json({ error: 'activo es requerido' });
  }

  db.query(
    'UPDATE recordatorios SET activo = $1 WHERE id = $2',
    [activo ? 1 : 0, id],
    function (err) {
      if (err) {
        console.error('Error al actualizar estado del recordatorio:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (this.rowCount === 0) {
        console.log('Recordatorio no encontrado:', id);
        return res.status(404).json({ error: 'Recordatorio no encontrado' });
      }
      console.log('Estado del recordatorio actualizado con éxito, ID:', id);
      res.json({ success: true });
    }
  );
});

// Endpoint para eliminar un recordatorio
app.delete('/api/recordatorios/:id', checkJwt, (req, res) => {
  const { id } = req.params;
  console.log('Solicitud DELETE /api/recordatorios/:id:', { id });

  db.query('DELETE FROM recordatorios WHERE id = $1', [id], function (err) {
    if (err) {
      console.error('Error al eliminar recordatorio:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.rowCount === 0) {
      console.log('Recordatorio no encontrado:', id);
      return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }
    console.log('Recordatorio eliminado con éxito, ID:', id);
    res.json({ success: true });
  });
});

app.get('/api/mensajes-pedidos/:negocioId', checkJwt, (req, res) => {
  console.log(`Solicitud GET /api/mensajes-pedidos/${req.params.negocioId}`);
  db.query('SELECT * FROM mensajes_pedidos WHERE negocio_id = $1', [req.params.negocioId], (err, rows) => {
    if (err) {
      console.error('Error al obtener mensajes de pedidos:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.rows);
  });
});

app.get('/api/pedidos/:negocioId', checkJwt, (req, res) => {
  console.log(`Solicitud GET /api/pedidos/${req.params.negocioId}`);
  db.query('SELECT * FROM pedidos WHERE negocio_id = $1 ORDER BY created_at DESC', [req.params.negocioId], (err, rows) => {
    if (err) {
      console.error('Error al obtener pedidos:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.rows);
  });
});

app.post('/api/pedidos/:negocioId', checkJwt, (req, res) => {
  const { negocioId } = req.params;
  const { numero_cliente, items } = req.body;
  console.log('Datos recibidos en POST /api/pedidos:', { negocioId, numero_cliente, items });

  if (!negocioId || !numero_cliente || !items || !Array.isArray(items) || items.length === 0) {
    console.log('Faltan campos obligatorios o items no válidos');
    return res.status(400).json({ error: 'negocioId, numero_cliente y items son requeridos' });
  }

  const itemsString = JSON.stringify(items);

  db.query(
    'INSERT INTO pedidos (negocio_id, numero_cliente, items, estado) VALUES ($1, $2, $3, $4)',
    [negocioId, numero_cliente, itemsString, 'recibido'],
    function (err) {
      if (err) {
        console.error('Error al registrar pedido:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Pedido registrado con éxito, ID:', this.lastID);
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.get('/api/ingresos/:negocioId', checkJwt, asyncHandler(async (req, res) => {
  try {
    const { negocioId } = req.params;
    const { year, month } = req.query;
    console.log("Solicitud GET /api/ingresos/${negocioId} con year: ${year}, month: ${month}");
    // Si falta algún parámetro, devuelve 0
    if (!negocioId || !year || !month) {
      return res.json({ count: 0 });
    }

    // Si no hay autenticación, devuelve 0
    if (!req.auth || !req.auth.sub) {
      return res.json({ count: 0 });
    }

    const auth0Id = req.auth.sub;
    let client;

    try {
      client = await db.connect();

      // Busca el usuario
      const userResult = await client.query(
        'SELECT id FROM users WHERE auth0_id = $1',
        [auth0Id]
      );

      // Si no existe el usuario, devuelve 10
      if (userResult.rows.length === 0) {
        return res.json({ count: 10 });
      }

      const userId = userResult.rows[0].id;

      // Verifica si el negocio pertenece al usuario
      const negocioResult = await client.query(
        'SELECT id FROM negocios WHERE id = $1 AND user_id = $2',
        [negocioId, userId]
      );

      // Si el negocio no pertenece al usuario, devuelve 0
      if (negocioResult.rows.length === 0) {
        return res.json({ count: 0 });
      }

      // Cuenta las ventas
      const ventasResult = await client.query(
        `select coalesce(sum(precio), 0) as count from pedidos 
        join productos on pedidos.items = productos.nombre 
        where pedidos.negocio_id = $1 and productos.negocio_id = $1`,
        [negocioId]
         
      );

      const count = parseInt(ventasResult.rows[0].count, 10);
      return res.json({ count });

    } catch (dbError) {
      // Si hay error en la base de datos, devuelve -1
      console.error('Error en la base de datos:', dbError);
      if(client){
        return res.json({ count: -400 });
      }
      return res.json({ count: -300 });
    } finally {
      if (client) client.release();
    }
  } catch (err) {
    // Si hay cualquier otro error, devuelve -2
    console.error('Error inesperado:', err);
    return res.json({ count: -2 });
  }
}));


app.get('/api/masVendido/:negocioId', checkJwt, asyncHandler(async (req, res) => {
  try {
    const { negocioId } = req.params;
    const { year, month } = req.query;
    console.log("Solicitud GET /api/masVendido/${negocioId} con year: ${year}, month: ${month}");
    // Si falta algún parámetro, devuelve 0
    if (!negocioId || !year || !month) {
      return res.json({ count: "0" });
    }

    // Si no hay autenticación, devuelve 0
    if (!req.auth || !req.auth.sub) {
      return res.json({ count: "0" });
    }

    const auth0Id = req.auth.sub;
    let client;

    try {
      client = await db.connect();

      // Busca el usuario
      const userResult = await client.query(
        'SELECT id FROM users WHERE auth0_id = $1',
        [auth0Id]
      );

      // Si no existe el usuario, devuelve 10
      if (userResult.rows.length === 0) {
        return res.json({ count: "-33" });
      }

      const userId = userResult.rows[0].id;

      // Verifica si el negocio pertenece al usuario
      const negocioResult = await client.query(
        'SELECT id FROM negocios WHERE id = $1 AND user_id = $2',
        [negocioId, userId]
      );

      // Si el negocio no pertenece al usuario, devuelve 0
      if (negocioResult.rows.length === 0) {
        return res.json({ count: "-5" });
      }

      // Cuenta las ventas
      const ventasResult = await client.query(
        `WITH conteos AS (
        SELECT productos.nombre, COALESCE(COUNT(pedidos.items), 0) AS count
        FROM productos
        LEFT JOIN pedidos ON pedidos.items = productos.nombre 
            AND pedidos.negocio_id = $1
        WHERE productos.negocio_id = $1
        GROUP BY productos.nombre
        )
        SELECT nombre, count
        FROM conteos
        WHERE count = (SELECT MAX(count) FROM conteos);`,
        [negocioId]
         
      );
      if(ventasResult.rows.length === 0) {
        return res.json({ count: "not available" });
      }
      const co = (ventasResult.rows[0].nombre);
      return res.json({ count: co });

    } catch (dbError) {
      // Si hay error en la base de datos, devuelve -1
      console.error('Error en la base de datos:', dbError);
      if(client){
        return res.json({ count: "111"});
      }
      return res.json({ count: "-300" });
    } finally {
      if (client) client.release();
    }
  } catch (err) {
    // Si hay cualquier otro error, devuelve -2
    console.error('Error inesperado:', err);
    return res.json({ count: "-2" });
  }
}));


app.get('/api/menosVendido/:negocioId', checkJwt, asyncHandler(async (req, res) => {
  try {
    const { negocioId } = req.params;
    const { year, month } = req.query;
    console.log("Solicitud GET /api/menosVendido/${negocioId} con year: ${year}, month: ${month}");
    // Si falta algún parámetro, devuelve 0
    if (!negocioId || !year || !month) {
      return res.json({ count: "0" });
    }

    // Si no hay autenticación, devuelve 0
    if (!req.auth || !req.auth.sub) {
      return res.json({ count: "0" });
    }

    const auth0Id = req.auth.sub;
    let client;

    try {
      client = await db.connect();

      // Busca el usuario
      const userResult = await client.query(
        'SELECT id FROM users WHERE auth0_id = $1',
        [auth0Id]
      );

      // Si no existe el usuario, devuelve 10
      if (userResult.rows.length === 0) {
        return res.json({ count: "-33" });
      }

      const userId = userResult.rows[0].id;

      // Verifica si el negocio pertenece al usuario
      const negocioResult = await client.query(
        'SELECT id FROM negocios WHERE id = $1 AND user_id = $2',
        [negocioId, userId]
      );

      // Si el negocio no pertenece al usuario, devuelve 0
      if (negocioResult.rows.length === 0) {
        return res.json({ count: "-5" });
      }

      // Cuenta las ventas
      const ventasResult = await client.query(
        `WITH conteos AS (
        SELECT productos.nombre, COALESCE(COUNT(pedidos.items), 0) AS count
        FROM productos
        LEFT JOIN pedidos ON pedidos.items = productos.nombre 
            AND pedidos.negocio_id = $1
        WHERE productos.negocio_id = $1
        GROUP BY productos.nombre
        )
        SELECT nombre, count
        FROM conteos
        WHERE count = (SELECT MIN(count) FROM conteos);`,
        [negocioId]
         
      );
      if(ventasResult.rows.length === 0) {
        return res.json({ count: "not available" });
      }
      const co = (ventasResult.rows[0].nombre);
      return res.json({ count: co });

    } catch (dbError) {
      // Si hay error en la base de datos, devuelve -1
      console.error('Error en la base de datos:', dbError);
      if(client){
        return res.json({ count: "111"});
      }
      return res.json({ count: "-300" });
    } finally {
      if (client) client.release();
    }
  } catch (err) {
    // Si hay cualquier otro error, devuelve -2
    console.error('Error inesperado:', err);
    return res.json({ count: "-2" });
  }
}));
/*
app.get('/api/ingresos/:negocioId', checkJwt, (req, res) => {
    const { negocioId } = req.params;
    const { year, month } = req.query;

    if (!negocioId) {
        return res.status(400).json({ error: 'negocioId es requerido' });
    }

    db.query(
        'SELECT items FROM pedidos WHERE negocio_id = $1',
        [negocioId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const productosVendidos = {};

            for (const row of rows.rows) {
                try {
                    const items = JSON.parse(row.items);
                    for (const item of items) {
                        const nombre = item.nombre;
                        const cantidad = item.cantidad;

                        if (!productosVendidos[nombre]) {
                        productosVendidos[nombre] = 0;
                        }
                        productosVendidos[nombre] += cantidad;
                    }
                } catch (e) {
                    console.error('Error al parsear JSON:', row.items);
                }
            }

            const nombres = Object.keys(productosVendidos);
            if (nombres.length === 0) {
                return res.json({ total: 0 });
            }

            const placeholders = nombres.map((_, i) => `$${i + 2}`).join(',');
            db.query(
                `SELECT nombre, precio FROM productos WHERE negocio_id = $1 AND nombre IN (${placeholders})`,
                [negocioId, ...nombres],
                (err, productosConPrecio) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                let total = 0;
                for (const producto of productosConPrecio.rows) {
                    const cantidad = productosVendidos[producto.nombre] || 0;
                    total += cantidad * producto.precio;
                }

                res.json({ total });
                }
            );
        }
    );
});
*/
app.get('/api/cantVentas/:negocioId', checkJwt, asyncHandler(async (req, res) => {
  try {
    const { negocioId } = req.params;
    const { year, month } = req.query;
    console.log("Solicitud GET /api/cantVentas/${negocioId} con year: ${year}, month: ${month}");
    // Si falta algún parámetro, devuelve 0
    if (!negocioId || !year || !month) {
      return res.json({ count: 0 });
    }

    // Si no hay autenticación, devuelve 0
    if (!req.auth || !req.auth.sub) {
      return res.json({ count: 0 });
    }

    const auth0Id = req.auth.sub;
    let client;

    try {
      client = await db.connect();

      // Busca el usuario
      const userResult = await client.query(
        'SELECT id FROM users WHERE auth0_id = $1',
        [auth0Id]
      );

      // Si no existe el usuario, devuelve 10
      if (userResult.rows.length === 0) {
        return res.json({ count: 10 });
      }

      const userId = userResult.rows[0].id;

      // Verifica si el negocio pertenece al usuario
      const negocioResult = await client.query(
        'SELECT id FROM negocios WHERE id = $1 AND user_id = $2',
        [negocioId, userId]
      );

      // Si el negocio no pertenece al usuario, devuelve 0
      if (negocioResult.rows.length === 0) {
        return res.json({ count: 0 });
      }

      // Cuenta las ventas
      const ventasResult = await client.query(
        `SELECT COUNT(*) as count 
         FROM pedidos 
         WHERE negocio_id = $1 
         AND EXTRACT(YEAR FROM created_at) = $2
         AND EXTRACT(MONTH FROM created_at) = $3`,
        [negocioId, year, month]
         
      );

      const count = parseInt(ventasResult.rows[0].count, 10);
      return res.json({ count });

    } catch (dbError) {
      // Si hay error en la base de datos, devuelve -1
      console.error('Error en la base de datos:', dbError);
      if(client){
        return res.json({ count: -400 });
      }
      return res.json({ count: -300 });
    } finally {
      if (client) client.release();
    }
  } catch (err) {
    // Si hay cualquier otro error, devuelve -2
    console.error('Error inesperado:', err);
    return res.json({ count: -2 });
  }
}));

/*app.get('/api/cantVentas/:negocioId', checkJwt, (req, res) => {
    const { negocioId } = req.params;
    const { year, month } = req.query;
    console.log(`Solicitud GET /api/cantVentas/${negocioId})`);
    if (!negocioId) {
        return res.status(400).json({ error: 'negocioId es requerido' });
    }

    db.query(
        'SELECT count(*) as count FROM pedidos WHERE negocio_id = $1',
        [negocioId],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ count: row.rows[0].count });
        }
    );
});*/

app.get('/api/productosVendidos/:negocioId', checkJwt, (req, res) => {
    const { negocioId } = req.params;
    const { year, month } = req.query;

    if (!negocioId) {
        return res.status(400).json({ error: 'negocioId es requerido' });
    }

    db.query(
        'SELECT items FROM pedidos WHERE negocio_id = $1',
        [negocioId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const productosVendidos = {};

            for (const row of rows.rows) {
                try {
                    const items = JSON.parse(row.items);
                    for (const item of items) {
                        const nombre = item.nombre;
                        const cantidad = item.cantidad;

                        if (!productosVendidos[nombre]) {
                        productosVendidos[nombre] = 0;
                        }
                        productosVendidos[nombre] += cantidad;
                    }
                } catch (e) {
                    console.error('Error al parsear JSON:', row.items);
                }
            }
            res.json({ productosVendidos });
        }
    );
});

app.get('/api/ventasPorSemana/:negocioId', checkJwt, (req, res) => {
  const { negocioId } = req.params;
  const { year, month } = req.query;
  console.log(`Solicitud GET /api/ventasPorSemana/${negocioId}`, { year, month });

  if (!negocioId) {
    return res.status(400).json({ error: 'negocioId es requerido' });
  }

  let query = 'SELECT created_at, items FROM pedidos WHERE negocio_id = $1';
  const params = [negocioId];

  if (year && month) {
    query += ' AND EXTRACT(YEAR FROM created_at) = $2 AND EXTRACT(MONTH FROM created_at) = $3';
    params.push(year, month);
  }

  db.query(query, params, (err, rows) => {
    if (err) {
      console.error('Error al obtener pedidos:', err.message);
      return res.status(500).json({ error: err.message });
    }

    const ventasPorSemana = {};
    for (const row of rows.rows) {
      const date = new Date(row.created_at);
      const weekNumber = getWeekNumber(date);
      const key = `${date.getFullYear()}-W${weekNumber}`;

      if (!ventasPorSemana[key]) {
        ventasPorSemana[key] = { total: 0, items: {} };
      }

      try {
        const items = JSON.parse(row.items);
        for (const item of items) {
          const { nombre, cantidad } = item;
          ventasPorSemana[key].items[nombre] = (ventasPorSemana[key].items[nombre] || 0) + cantidad;
          ventasPorSemana[key].total += cantidad;
        }
      } catch (e) {
        console.error('Error al parsear items:', row.items);
      }
    }

    res.json(ventasPorSemana);
  });
});

//actualiza el plan del negocio
app.put('/api/negocio/:id/plan', checkJwt, async (req, res) => {
  console.log('Solicitud PUT recibida para /api/negocio/:id/plan', {
    params: req.params,
    body: req.body,
    method: req.method,
    headers: req.headers
  });

  const { id } = req.params;
  const { plan } = req.body;
  const auth0Id = req.auth.sub;

  if (!plan) {
    return res.status(400).json({ error: 'Plan es requerido' });
  }

  let client;
  try {
    client = await db.connect();
    console.log('Conexión a la base de datos establecida');

    const userResult = await client.query(
      'SELECT n.id FROM negocios n JOIN users u ON n.user_id = u.id WHERE n.id = $1 AND u.auth0_id = $2',
      [id, auth0Id]
    );
    console.log('Resultado de verificación de usuario:', userResult.rows);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Negocio no encontrado o no autorizado' });
    }

    let modulos = {
      modulo_pedidos: 0,
      modulo_reservas: 0,
      modulo_recordatorios: 0,
      modulo_analiticas: 0,
      modulo_pagos: 0,
    };

    switch (plan) {
      case 'Plan Servicios':
        modulos.modulo_reservas = 1;
        modulos.modulo_recordatorios = 1;
        break;
      case 'Plan Servicios Plus':
        modulos.modulo_reservas = 1;
        modulos.modulo_recordatorios = 1;
        modulos.modulo_analiticas = 1;
        break;
      case 'Plan Tienda':
        modulos.modulo_pedidos = 1;
        modulos.modulo_analiticas = 1;
        break;
      case 'Plan Tienda Plus':
        modulos.modulo_pedidos = 1;
        modulos.modulo_analiticas = 1;
        modulos.modulo_pagos = 1;
        break;
      case 'Plan Premium':
        modulos.modulo_pedidos = 1;
        modulos.modulo_reservas = 1;
        modulos.modulo_recordatorios = 1;
        modulos.modulo_analiticas = 1;
        modulos.modulo_pagos = 1;
        break;
      default:
        return res.status(400).json({ error: 'Plan inválido' });
    }

    console.log('Actualizando plan y módulos para negocio ID:', id, 'con plan:', plan, 'módulos:', modulos);
    await client.query(
      `UPDATE negocios SET plan = $1, modulo_pedidos = $2, modulo_reservas = $3, modulo_recordatorios = $4, modulo_analiticas = $5, modulo_pagos = $6 WHERE id = $7`,
      [plan, modulos.modulo_pedidos, modulos.modulo_reservas, modulos.modulo_recordatorios, modulos.modulo_analiticas, modulos.modulo_pagos, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error al actualizar plan:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
    console.log('Conexión a la base de datos liberada');
  }
});

// Helper function to get ISO week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

console.log('Current clients:', clients);

function initializeClientForNegocio(negocio) {
  const negocioId = negocio.id;
  console.log(`Initializing client for negocio ${negocioId}: ${negocio.nombre}`);

  // Delegate initialization to client.js to avoid duplication
  const { initializeClientForNegocio: initClient } = require('./whatsapp/client');
  initClient(negocio);
}