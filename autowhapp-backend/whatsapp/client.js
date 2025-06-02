const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode');
const { Pool } = require('pg');

// Usar la misma configuración de base de datos que en index.js
const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Test database connection
db.connect()
  .then(() => {
    console.log('✅ WhatsApp client database connection successful');
    console.log('Database config:', {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
  })
  .catch(err => {
    console.error('❌ WhatsApp client database connection error:', err);
    console.error('Database config:', {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
  });

const clients = {};

async function initializeClients() {
  console.log('Inicializando clientes...');
  try {
    const { rows: negocios } = await db.query('SELECT * FROM negocios');
    if (negocios.length === 0) {
      console.log('No se encontraron negocios en la base de datos.');
      return;
    }
    console.log('Negocios obtenidos de la base de datos:', negocios);
    negocios.forEach(negocio => {
      const negocioId = negocio.id;
      if (!clients[negocioId]) {
        initializeClientForNegocio(negocio);
      }
    });
  } catch (err) {
    console.error('Error al obtener negocios:', err.message);
  }
}

function initializeClientForNegocio(negocio) {
  const negocioId = negocio.id;
  console.log(`Inicializando cliente para negocio ${negocioId}: ${negocio.nombre}`);

  // Initialize clients[negocioId] immediately with a default structure
  if (!clients[negocioId]) {
    clients[negocioId] = {
      client: null,
      qr: null,
      authenticated: false,
      negocio: { ...negocio },
    };
  }

  const client = new Client({
  authStrategy: new LocalAuth({ 
    clientId: `negocio-${negocioId}`,
    dataPath: `/tmp/.wwebjs_auth_${negocioId}` // Use /tmp - always writable
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--user-data-dir=/tmp/chrome-user-data-${negocioId}-${Date.now()}'
    ],
    pipe: true,
    timeout: 60000
  }
});

  // Update the client reference in clients[negocioId]
  clients[negocioId].client = client;

  client.on('qr', (qr) => {
    console.log(`Generando QR para negocio ${negocioId}: ${negocio.nombre}`);
    qrcode.toDataURL(qr, (err, url) => {
      if (err) {
        console.error('Error al generar QR:', err);
        return;
      }
      // Update the existing clients[negocioId] object
      clients[negocioId] = {
        ...clients[negocioId],
        qr: url,
        authenticated: false,
      };
      console.log(`QR generado exitosamente para negocio ${negocioId}`);
    });
  });

  client.on('authenticated', async () => {
    console.log(`✅ Cliente autenticado para negocio ${negocioId}`);
    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts && (!client.info || !client.info.wid)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      console.log(`Intento ${attempts} de obtener client.info para negocio ${negocioId}`);
    }

    if (!client.info || !client.info.wid) {
      console.error('⚠️ No se pudo obtener client.info después de varios intentos');
      client.destroy();
      delete clients[negocioId];
      initializeClientForNegocio(negocio);
      return;
    }

    const clientNumber = client.info.wid._serialized.replace('@c.us', '').replace(/\D/g, '');
    console.log(`Número del cliente autenticado: ${clientNumber}`);
    const negocioAutenticado = await identificarNegocio(clientNumber);

    if (negocioAutenticado && negocioAutenticado.id === negocioId) {
      // Update the existing clients[negocioId] object
      clients[negocioId] = {
        ...clients[negocioId],
        authenticated: true,
        negocio: { ...negocioAutenticado },
        qr: null,
      };
      console.log(`Negocio ${negocioId} autenticado con número ${clientNumber}`);
    } else {
      console.error('⚠️ Número no asociado a este negocio:', clientNumber);
      console.log('Negocio esperado:', negocio);
      console.log('Negocio encontrado:', negocioAutenticado);
      client.destroy();
      delete clients[negocioId];
      initializeClientForNegocio(negocio);
    }
  });

  client.on('ready', async () => {
    console.log(`✅ Cliente de WhatsApp listo para negocio ${negocioId}`);
    try {
      const chats = await client.getChats();
      const grupo = chats.find(chat => chat.isGroup && chat.name === 'Prueba Autowhapp');
      if (grupo) {
        const groupId = grupo.id._serialized;
        await db.query('UPDATE negocios SET grupo_id = $1 WHERE id = $2', [groupId, negocioId]);
        console.log(`✅ groupId guardado para negocio ${negocioId}: ${groupId}`);
      } else {
        console.error('❌ No se encontró el grupo "Prueba Autowhapp"');
      }
    } catch (err) {
      console.error('❌ Error al obtener chats para guardar groupId:', err.message);
    }
  });

  client.on('disconnected', (reason) => {
    console.log(`⚠️ Cliente desconectado para negocio ${negocioId}. Razón: ${reason}`);
    client.destroy();
    delete clients[negocioId];
    initializeClientForNegocio(negocio);
  });

  client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const negocioId = Object.keys(clients).find(id => clients[id].client === client);
    if (!negocioId) {
      console.log('⚠️ Negocio no encontrado para este cliente');
      return;
    }

    console.log(`📩 Mensaje recibido para negocio ${negocioId}: "${msg.body}" del chat "${chat.name}"`);

    if (chat.isGroup && chat.name !== 'Prueba Autowhapp') {
      console.log(`⚠️ Mensaje ignorado: No proviene del grupo "Prueba Autowhapp" (chat: ${chat.name})`);
      return;
    }

    if (!chat.isGroup) {
      console.log(`⚠️ Mensaje ignorado: No proviene de un grupo (chat: ${chat.name})`);
      return;
    }

    const negocioDb = await identificarNegocioPorId(negocioId);
    if (!negocioDb || typeof negocioDb.estado_bot === 'undefined') {
      console.log('⚠️ Negocio no identificado o estado_bot indefinido');
      await client.sendMessage(msg.from, 'Ocurrió un error, intentá de nuevo.');
      return;
    }

    if (!negocioDb.estado_bot) {
      console.log('🤖 Bot desactivado');
      await client.sendMessage(msg.from, 'Disculpa, no estamos atendiendo en este momento.');
      return;
    }

    const { rows: faqs } = await db.query('SELECT * FROM faqs WHERE negocio_id = $1', [negocioId]);
    const { rows: productos } = await db.query('SELECT * FROM productos WHERE negocio_id = $1', [negocioId]);
    const { rows: reservas } = await db.query('SELECT * FROM reservas WHERE negocio_id = $1 AND ocupado = 1', [negocioId]);

    const faqsTexto = faqs.length > 0 ? faqs.map(faq => `Pregunta: ${faq.pregunta} Respuesta: ${faq.respuesta}`).join('\n') : 'No hay FAQs disponibles.';
    const productosTexto = productos.length > 0 ? productos.map(p => `${p.nombre}: ${p.descripcion || ''} - $${p.precio}`).join('\n') : 'No hay productos disponibles.';

    const { appointment_duration, break_between, hora_inicio_default, hora_fin_default } = negocioDb;
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const slotsPorDia = {};
    const hoy = new Date();
    for (let i = 0; i < 14; i++) {
      const dia = new Date(hoy);
      dia.setDate(hoy.getDate() + i);
      const fecha = dia.toISOString().split('T')[0];
      
      const slots = [];
      let currentMinutes = toMinutes(hora_inicio_default);
      const endMinutes = toMinutes(hora_fin_default);
      const occupiedSlots = reservas
        .filter(r => r.fecha === fecha)
        .map(r => ({
          start: toMinutes(r.hora_inicio),
          end: toMinutes(r.hora_fin),
        }));

      while (currentMinutes + appointment_duration <= endMinutes) {
        const start = formatTime(currentMinutes);
        const end = formatTime(currentMinutes + appointment_duration);
        const isOccupied = occupiedSlots.some(slot => 
          currentMinutes < slot.end && currentMinutes + appointment_duration > slot.start
        );
        if (!isOccupied) {
          slots.push({ start, end });
        }
        currentMinutes += appointment_duration + break_between;
      }
      slotsPorDia[fecha] = slots;
    }

    const negocioActualizado = {
      id: negocioDb.id,
      nombre: negocioDb.nombre,
      numero_telefono: negocioDb.numero_telefono,
      grupo_id: negocioDb.grupo_id,
      tipo_negocio: negocioDb.tipo_negocio,
      localidad: negocioDb.localidad,
      direccion: negocioDb.direccion,
      horarios: negocioDb.horarios,
      contexto: negocioDb.contexto,
      estado_bot: Number(negocioDb.estado_bot) === 1,
      modulo_pedidos: Number(negocioDb.modulo_pedidos) === 1,
      modulo_reservas: Number(negocioDb.modulo_reservas) === 1,
      modulo_recordatorios: Number(negocioDb.modulo_recordatorios) === 1, // Campo añadido
      modulo_analiticas: Number(negocioDb.modulo_analiticas) === 1,      // Campo añadido
      modulo_pagos: Number(negocioDb.modulo_pagos) === 1,                // Campo añadido
      plan: negocioDb.plan || 'SinPlan',                         // Campo añadido
      appointment_duration: Number(negocioDb.appointment_duration),
      break_between: Number(negocioDb.break_between),
      hora_inicio_default: negocioDb.hora_inicio_default,
      hora_fin_default: negocioDb.hora_fin_default,
      created_at: negocioDb.created_at,                                 // Campo añadido
      updated_at: negocioDb.updated_at,                                 // Campo añadido
      faqs,
      productos,
      reservas,
      faqs_texto: faqsTexto,
      productos_texto: productosTexto,
      slotsPorDia
    };
    

    let numeroCliente = chat.isGroup ? msg.author : msg.from;
    if (numeroCliente.startsWith('549')) {
      numeroCliente = '54' + numeroCliente.slice(3);
    }
    if (!numeroCliente.endsWith('@c.us')) {
      numeroCliente += '@c.us';
    }

    const webhookUrl = 'http://n8n:5678/webhook/procesar-mensaje';
    const payload = {
      mensaje: msg.body,
      numeroCliente,
      negocio: negocioActualizado,
      plan: negocioActualizado.plan,
      fechaActual: new Date().toISOString().split('T')[0]
    };

    try {
      console.log('🔄 Enviando solicitud al webhook:', webhookUrl, JSON.stringify(payload, null, 2));
      const res = await axios.post(webhookUrl, payload);
      const respuesta = typeof res.data === 'string' && res.data.trim() ? res.data.trim() : '⚠️ No se pudo generar una respuesta válida.';
      console.log('✅ Respuesta recibida del webhook:', respuesta);

      const reservaData = detectarReserva(respuesta);
      const pedidoData = detectarPedido(respuesta);

      // Aquí deberías obtener el token de acceso de alguna manera
      // Por ejemplo, pasándolo desde el frontend en la solicitud
      const token = msg.token; // Asegúrate de que el token se pase correctamente

      if (reservaData) {
        console.log('🔍 Reserva detectada:', reservaData);
        await handleReserva(reservaData, token); // Pasar el token aquí
      } else if (pedidoData) {
        console.log('🔍 Pedido detectado:', pedidoData);
        await handlePedido(pedidoData, token); // Pasar el token aquí
      } else {
        await client.sendMessage(msg.from, respuesta);
        console.log('📨 Respuesta enviada (no es reserva ni pedido):', respuesta);
      }
    } catch (err) {
      console.error('❌ Error al enviar a n8n:', err.message);
      await client.sendMessage(msg.from, 'Ocurrió un error, intentá de nuevo.');
    }
  });

  client.initialize();
  console.log(`Cliente inicializado para negocio ${negocioId}`);
}

/* async function identificarNegocio(cleanNumero) {
  console.log(`Buscando negocio con número: ${cleanNumero}`);
  try {
    const { rows } = await db.query(
      'SELECT * FROM negocios WHERE regexp_replace(numero_telefono, \'[^0-9]\', \'\', \'g\') = regexp_replace($1, \'[^0-9]\', \'\', \'g\')',
      [cleanNumero]
    );
    const negocio = rows[0];
    if (!negocio) {
      console.log('Negocio no encontrado para número:', cleanNumero);
      return null;
    }
    console.log('Datos crudos de identificarNegocio:', negocio);
    return {
      id: negocio.id,
      nombre: negocio.nombre,
      numero_telefono: negocio.numero_telefono,
      grupo_id: negocio.grupo_id,
      tipo_negocio: negocio.tipo_negocio,
      localidad: negocio.localidad,
      direccion: negocio.direccion,
      horarios: negocio.horarios ? JSON.parse(negocio.horarios) : {},
      contexto: negocio.contexto || '',
      estado_bot: Number(negocio.estado_bot) === 1,
      modulo_pedidos: Number(negocio.modulo_pedidos) === 1,
      modulo_reservas: Number(negocio.modulo_reservas) === 1,
      appointment_duration: Number(negocio.appointment_duration) || 60,
      break_between: Number(negocio.break_between) || 15,
      hora_inicio_default: negocio.hora_inicio_default || '09:00',
      hora_fin_default: negocio.hora_fin_default || '18:00',
    };
  } catch (err) {
    console.error('Error al buscar negocio:', err.message);
    return null;
  }
}

async function identificarNegocioPorId(negocioId) {
  try {
    const { rows } = await db.query('SELECT * FROM negocios WHERE id = $1', [negocioId]);
    const negocio = rows[0];
    if (!negocio) {
      console.log('Negocio no encontrado por ID:', negocioId);
      return null;
    }
    console.log('Datos crudos de identificarNegocioPorId:', negocio);
    return {
      id: negocio.id,
      nombre: negocio.nombre,
      numero_telefono: negocio.numero_telefono,
      grupo_id: negocio.grupo_id,
      tipo_negocio: negocio.tipo_negocio,
      localidad: negocio.localidad,
      direccion: negocio.direccion,
      horarios: negocio.horarios ? JSON.parse(negocio.horarios) : {},
      contexto: negocio.contexto || '',
      estado_bot: Number(negocio.estado_bot) === 1,
      modulo_pedidos: Number(negocio.modulo_pedidos) === 1,
      modulo_reservas: Number(negocio.modulo_reservas) === 1,
      appointment_duration: Number(negocio.appointment_duration) || 60,
      break_between: Number(negocio.break_between) || 15,
      hora_inicio_default: negocio.hora_inicio_default || '09:00',
      hora_fin_default: negocio.hora_fin_default || '18:00',
    };
  } catch (err) {
    console.error('Error al buscar negocio por ID:', err.message);
    return null;
  }
} */

  async function identificarNegocio(cleanNumero) {
  console.log(`Buscando negocio con número: ${cleanNumero}`);
  try {
    // Remove + sign and any non-numeric characters for comparison
    const normalizedInput = cleanNumero.replace(/[^0-9]/g, '');
    
    const { rows } = await db.query(
      'SELECT * FROM negocios WHERE regexp_replace(numero_telefono, \'[^0-9]\', \'\', \'g\') = $1',
      [normalizedInput]
    );
    const negocio = rows[0];
    if (!negocio) {
      console.log('Negocio no encontrado para número:', cleanNumero);
      return null;
    }
    console.log('Datos crudos de identificarNegocio:', negocio);
    return {
      id: negocio.id,
      nombre: negocio.nombre,
      numero_telefono: negocio.numero_telefono,
      grupo_id: negocio.grupo_id,
      tipo_negocio: negocio.tipo_negocio,
      localidad: negocio.localidad,
      direccion: negocio.direccion,
      // Fix JSON parsing - check if it's already an object or string
      horarios: typeof negocio.horarios === 'string' ? JSON.parse(negocio.horarios) : negocio.horarios || {},
      contexto: negocio.contexto || '',
      estado_bot: Number(negocio.estado_bot) === 1,
      modulo_pedidos: Number(negocio.modulo_pedidos) === 1,
      modulo_reservas: Number(negocio.modulo_reservas) === 1,
      appointment_duration: Number(negocio.appointment_duration) || 60,
      break_between: Number(negocio.break_between) || 15,
      hora_inicio_default: negocio.hora_inicio_default || '09:00',
      hora_fin_default: negocio.hora_fin_default || '18:00',
    };
  } catch (err) {
    console.error('Error al buscar negocio:', err.message);
    return null;
  }
}

async function identificarNegocioPorId(negocioId) {
  try {
    const { rows } = await db.query('SELECT * FROM negocios WHERE id = $1', [negocioId]);
    const negocio = rows[0];
    if (!negocio) {
      console.log('Negocio no encontrado por ID:', negocioId);
      return null;
    }
    console.log('Datos crudos de identificarNegocioPorId:', negocio);
    return {
      id: negocio.id,
      nombre: negocio.nombre,
      numero_telefono: negocio.numero_telefono,
      grupo_id: negocio.grupo_id,
      tipo_negocio: negocio.tipo_negocio,
      localidad: negocio.localidad,
      direccion: negocio.direccion,
      horarios: typeof negocio.horarios === 'string' ? JSON.parse(negocio.horarios) : negocio.horarios || {},
      contexto: negocio.contexto || '',
      estado_bot: Number(negocio.estado_bot) === 1,
      modulo_pedidos: Number(negocio.modulo_pedidos) === 1,
      modulo_reservas: Number(negocio.modulo_reservas) === 1,
      modulo_recordatorios: Number(negocio.modulo_recordatorios) === 1, // Campo añadido
      modulo_analiticas: Number(negocio.modulo_analiticas) === 1,    // Campo añadido
      modulo_pagos: Number(negocio.modulo_pagos) === 1,             // Campo añadido
      plan: negocio.plan || 'SinPlan',                       // Campo añadido
      appointment_duration: Number(negocio.appointment_duration) || 60,
      break_between: Number(negocio.break_between) || 15,
      hora_inicio_default: negocio.hora_inicio_default || '09:00',
      hora_fin_default: negocio.hora_fin_default || '18:00',
      created_at: negocio.created_at,                               // Campo añadido
      updated_at: negocio.updated_at                                // Campo añadido
    };
  } catch (err) {
    console.error('Error al buscar negocio por ID:', err.message);
    return null;
  }
}

function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function detectarReserva(respuesta) {
  const reservaMatch = respuesta.match(/\|\|RESERVA\|\|(.*?)\|\|END\|\|/);
  if (reservaMatch && reservaMatch[1]) {
    try {
      return JSON.parse(reservaMatch[1]);
    } catch (err) {
      console.error('❌ Error al parsear datos de reserva:', err.message);
      return null;
    }
  }
  return null;
}

function detectarPedido(respuesta) {
  const pedidoMatch = respuesta.match(/\|\|PEDIDO\|\|(.*?)\|\|END\|\|/);
  if (pedidoMatch && pedidoMatch[1]) {
    try {
      return JSON.parse(pedidoMatch[1]);
    } catch (err) {
      console.error('❌ Error al parsear datos de pedido:', err.message);
      return null;
    }
  }
  return null;
}

async function handleReserva(reservaData, token, client) {
  const backendUrl = `${process.env.REACT_APP_API_URL}/api/reservas/${reservaData.negocioId}`;
  try {
    const backendRes = await axios.post(backendUrl, {
      fecha: reservaData.fecha,
      hora_inicio: reservaData.hora_inicio,
      hora_fin: reservaData.hora_fin,
      ocupado: 1,
      cliente: 'Cliente vía WhatsApp',
      telefono: reservaData.numeroCliente,
      descripcion: 'Reserva confirmada por bot'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📥 Respuesta del backend:', backendRes.status, backendRes.data);
    if (backendRes.status === 200 && backendRes.data.success) {
      let confirmMessage = "¡Tu reserva ha sido confirmada con éxito!\nDetalle de la reserva:\n";
      confirmMessage += `- Fecha: ${reservaData.fecha}\n`;
      confirmMessage += `- Horario: ${reservaData.hora_inicio} a ${reservaData.hora_fin}\n`;
      await client.sendMessage(reservaData.numeroCliente, confirmMessage);
      console.log('📨 Mensaje de confirmación enviado:', confirmMessage);
    } else {
      console.error('❌ Registro de reserva falló en el backend:', backendRes.data);
      await client.sendMessage(reservaData.numeroCliente, 'Error al confirmar la reserva, intentá de nuevo.');
    }
  } catch (backendErr) {
    console.error('❌ Error al registrar reserva en el backend:', backendErr.message);
    await client.sendMessage(reservaData.numeroCliente, 'Error al confirmar la reserva, intentá de nuevo.');
  }
}

async function handlePedido(pedidoData, token, client) {
  const backendUrl = `http://localhost:3000/api/pedidos/${pedidoData.negocioId}`;
  try {
    const backendRes = await axios.post(backendUrl, {
      numero_cliente: pedidoData.numeroCliente,
      items: pedidoData.items,
      estado: 'recibido',
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📥 Respuesta del backend:', backendRes.status, backendRes.data);
    if (backendRes.status === 200 && backendRes.data.success) {
      let total = pedidoData.items.reduce((sum, item) => sum + item.cantidad, 0); // Calcular total simple
      let confirmMessage = "¡Tu pedido ha sido registrado con éxito!\nDetalle del pedido:\n";
      pedidoData.items.forEach(item => {
        confirmMessage += `- ${item.nombre} (cantidad: ${item.cantidad})\n`;
      });
      confirmMessage += `Total: $${total}\n`; // Usar total calculado
      await client.sendMessage(pedidoData.numeroCliente, confirmMessage);
      console.log('📨 Mensaje de confirmación enviado:', confirmMessage);
    } else {
      console.error('❌ Registro de pedido falló en el backend:', backendRes.data);
      await client.sendMessage(pedidoData.numeroCliente, 'Error al registrar el pedido, intentá de nuevo.');
    }
  } catch (backendErr) {
    console.error('❌ Error al registrar pedido en el backend:', backendErr.message);
    await client.sendMessage(pedidoData.numeroCliente, 'Error al registrar el pedido, intentá de nuevo.');
  }
}

module.exports = {
  clients,
  initializeClients,
  identificarNegocio,
  identificarNegocioPorId,
  handlePedido,
  handleReserva
};