const { Client } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const db = require('../db');

const client = new Client();
let negocioGlobal = null; // Variable global para almacenar el ID del negocio identificado

client.on('qr', (qr) => {
  console.log('Escaneá este código QR con el número del negocio:');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', async (session) => {
  console.log('✅ Cliente autenticado');

  // Intentar obtener el número del cliente
  let clientNumber;
  try {
    clientNumber = await client.getNumberId();
    console.log('Número del cliente (getNumberId):', clientNumber ? clientNumber._serialized : 'No disponible');
  } catch (err) {
    console.error('Error al obtener el número del cliente con getNumberId:', err);
  }

  // Si getNumberId falla, intentar obtener el número desde client.info
  let cleanNumero;
  if (!clientNumber || !clientNumber._serialized) {
    console.log('Intentando obtener el número desde client.info...');
    if (client.info && client.info.wid && client.info.wid._serialized) {
      clientNumber = client.info.wid;
      console.log('Número del cliente (client.info):', clientNumber._serialized);
      cleanNumero = clientNumber._serialized.replace('@c.us', '').replace(/\D/g, '');
    } else {
      console.error('No se pudo obtener el número del cliente automáticamente.');
      // Configurar manualmente como respaldo (ajusta según el número de BarberBros)
      cleanNumero = '541128704037';
      console.log('Usando número manual como respaldo:', cleanNumero);
    }
  } else {
    cleanNumero = clientNumber._serialized.replace('@c.us', '').replace(/\D/g, '');
  }

  // Identificar el negocio una sola vez para obtener el ID
  const negocio = await identificarNegocio(cleanNumero);

  if (!negocio) {
    console.error('⚠️ No se pudo identificar el negocio asociado al número del cliente. Deteniendo el proceso.');
    process.exit(1);
  }

  // Guardar solo el ID del negocio en negocioGlobal
  negocioGlobal = { id: negocio.id };
  console.log('Negocio identificado al iniciar (ID):', negocioGlobal.id);
});

client.on('ready', () => {
  console.log('✅ Cliente de WhatsApp listo');
});

client.on('message', async (msg) => {
  const chat = await msg.getChat();
  console.log(`📩 Mensaje recibido: "${msg.body}" del chat "${chat.name}"`);

  // Filtro de chat (personaliza según tus pruebas)
  if (chat.name !== 'Prueba Autowhapp') {
    console.log(`🔕 Ignorando mensaje de otro chat: ${chat.name}`);
    return;
  }

  console.log('Número del remitente (msg.from):', msg.from);
  console.log('Es chat de grupo:', chat.isGroup);
  console.log('Autor del mensaje (msg.author):', msg.author);

  // Verificar que tenemos el ID del negocio
  if (!negocioGlobal || !negocioGlobal.id) {
    console.log('⚠️ Negocio no identificado');
    await client.sendMessage(msg.from, 'Ocurrió un error, intentá de nuevo (no se identificó negocio)');
    return;
  }

  // Consultar la información del negocio dinámicamente usando el negocioId
  const negocioId = negocioGlobal.id;
  const negocio = await identificarNegocioPorId(negocioId);

  if (!negocio || typeof negocio.estado_bot === 'undefined') {
    console.log('⚠️ Negocio no identificado o estado_bot indefinido');
    await client.sendMessage(msg.from, 'Ocurrió un error, intentá de nuevo (no se identificó negocio)');
    return;
  }

  // 🚨 Si el bot está APAGADO, enviar mensaje default y abortar el flujo:
  if (!negocio.estado_bot) {
    console.log('🤖 Bot desactivado (negocio.estado_bot es false), enviando mensaje predeterminado');
    await client.sendMessage(msg.from, 'Disculpa, no estamos atendiendo en este momento.');
    return;
  }

  // Consultar FAQs y productos dinámicamente usando el negocioId
  const faqs = await new Promise((resolve) => {
    db.all('SELECT * FROM faqs WHERE negocio_id = ?', [negocioId], (err, rows) => {
      if (err) {
        console.error('Error al obtener FAQs:', err);
        resolve([]);
      } else {
        console.log(`FAQs obtenidas para negocio_id ${negocioId}:`, rows);
        resolve(rows);
      }
    });
  });

  const productos = await new Promise((resolve) => {
    db.all('SELECT * FROM productos WHERE negocio_id = ?', [negocioId], (err, rows) => {
      if (err) {
        console.error('Error al obtener productos:', err);
        resolve([]);
      } else {
        console.log(`Productos obtenidos para negocio_id ${negocioId}:`, rows);
        resolve(rows);
      }
    });
  });

  const faqsTexto = faqs.length > 0
    ? faqs.map(faq => `Pregunta: ${faq.pregunta} Respuesta: ${faq.respuesta}`).join('\n')
    : 'No hay FAQs disponibles.';

  const productosTexto = productos.length > 0
    ? productos.map(producto => `${producto.nombre}: ${producto.descripcion} - $${producto.precio}`).join('\n')
    : 'No hay productos disponibles.';

  const negocioActualizado = {
    ...negocio,
    faqs: faqs || [],
    productos: productos || [],
    faqs_texto: faqsTexto,
    productos_texto: productosTexto
  };

  const webhookUrl = 'https://c73f-190-189-158-117.ngrok-free.app/webhook/procesar-mensaje';

  const payload = {
    mensaje: msg.body,
    numeroCliente: chat.isGroup ? msg.author : msg.from,
    negocio: negocioActualizado
  };

  try {
    console.log('📤 Enviando a n8n:', JSON.stringify(payload, null, 2));
    const res = await axios.post(webhookUrl, payload);
    const respuesta = res.data;

    if (respuesta) {
      // Verificar si la respuesta contiene un pedido
      if (respuesta.pedido) {
        const pedido = respuesta.pedido;
        console.log('📦 Pedido detectado, registrando en el backend:', pedido);

        // Registrar el pedido en el backend
        try {
          const registrarRes = await axios.post('http://localhost:3000/api/registrar-pedido', pedido);
          console.log('✅ Pedido registrado con éxito:', registrarRes.data);
        } catch (err) {
          console.error('❌ Error al registrar el pedido en el backend:', err.response?.data || err.message);
          await client.sendMessage(msg.from, 'Ocurrió un error al registrar tu pedido, intentá de nuevo.');
          return;
        }
      } else {
        console.log('📝 Respuesta normal, no se detectó pedido:', respuesta);
      }

      // Enviar el mensaje al cliente de WhatsApp
      await client.sendMessage(msg.from, respuesta.message);
      console.log('📨 Respuesta enviada al cliente:', respuesta.message);
    } else {
      await client.sendMessage(msg.from, '⚠️ No recibí respuesta del servidor.');
      console.log('⚠️ No se recibió respuesta del servidor');
    }
  } catch (err) {
    console.error('❌ Error al enviar a n8n:', err.response?.data || err.message);
    await client.sendMessage(msg.from, 'Ocurrió un error, intentá de nuevo.');
  }
});

client.initialize();

// Función para identificar el negocio por número (usada al autenticar)
function identificarNegocio(cleanNumero) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM negocios WHERE replace(replace(numero_telefono, "+", ""), "-", "") = ?',
      [cleanNumero],
      async (err, negocio) => {
        if (err) {
          console.error('Error al buscar negocio:', err);
          resolve(null);
          return;
        }

        if (!negocio) {
          console.warn(`No se encontró negocio con número: ${cleanNumero}`);
          resolve(null);
          return;
        }

        console.log('Negocio encontrado en DB:', negocio);

        resolve({
          id: negocio.id,
          nombre: negocio.nombre,
          numero_telefono: negocio.numero_telefono,
          grupo_id: negocio.grupo_id,
          tipo_negocio: negocio.tipo_negocio,
          localidad: negocio.localidad,
          direccion: negocio.direccion,
          horarios: negocio.horarios ? JSON.parse(negocio.horarios) : {},
          contexto: negocio.contexto || '',
          estado_bot: negocio.estado_bot === 1,
          modulo_pedidos: negocio.modulo_pedidos === 1
        });
      }
    );
  });
}

// Nueva función para identificar el negocio por ID (usada en cada mensaje)
function identificarNegocioPorId(negocioId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM negocios WHERE id = ?',
      [negocioId],
      async (err, negocio) => {
        if (err) {
          console.error('Error al buscar negocio por ID:', err);
          resolve(null);
          return;
        }

        if (!negocio) {
          console.warn(`No se encontró negocio con ID: ${negocioId}`);
          resolve(null);
          return;
        }

        console.log('Negocio encontrado en DB por ID:', negocio);

        // Obtener mensajes de pedidos
        const mensajesPedidos = await new Promise((resolve) => {
          db.all('SELECT * FROM mensajes_pedidos WHERE negocio_id = ?', [negocio.id], (err, rows) => {
            if (err) {
              console.error('Error al obtener mensajes de pedidos:', err);
              resolve([]);
            } else {
              console.log(`Mensajes de pedidos obtenidos para negocio_id ${negocio.id}:`, rows);
              resolve(rows);
            }
          });
        });

        resolve({
          id: negocio.id,
          nombre: negocio.nombre,
          numero_telefono: negocio.numero_telefono,
          grupo_id: negocio.grupo_id,
          tipo_negocio: negocio.tipo_negocio,
          localidad: negocio.localidad,
          direccion: negocio.direccion,
          horarios: negocio.horarios ? JSON.parse(negocio.horarios) : {},
          contexto: negocio.contexto || '',
          estado_bot: negocio.estado_bot === 1,
          modulo_pedidos: negocio.modulo_pedidos === 1,
          mensajes_pedidos: mensajesPedidos || []
        });
      }
    );
  });
}

module.exports = client;