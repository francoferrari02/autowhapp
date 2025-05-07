const { Client } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode');
const db = require('../db');

const clients = {}; // Mapa de clientes: { negocioId: { client, qr, authenticated, negocio } }

function initializeClients() {
  db.all('SELECT * FROM negocios', [], (err, negocios) => {
    if (err) {
      console.error('Error al obtener negocios:', err.message);
      return;
    }
    negocios.forEach(negocio => {
      const negocioId = negocio.id;
      if (!clients[negocioId]) {
        const client = new Client();
        
        client.on('qr', (qr) => {
          console.log(`Generando QR para negocio ${negocioId}: ${negocio.nombre}`);
          qrcode.toDataURL(qr, (err, url) => {
            if (err) {
              console.error('Error al generar QR:', err);
              return;
            }
            clients[negocioId] = { 
              client, 
              qr: url, 
              authenticated: false,
              negocio: { ...negocio } // Almacenar una copia del negocio
            };
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
          const negocioAutenticado = await identificarNegocio(clientNumber);
        
          if (negocioAutenticado && negocioAutenticado.id === negocioId) {
            clients[negocioId].authenticated = true;
            clients[negocioId].negocio = { ...negocioAutenticado }; // Actualizar con datos autenticados
            console.log(`Negocio ${negocioId} autenticado con número ${clientNumber}`);
          } else {
            console.error('⚠️ Número no asociado a este negocio:', clientNumber);
            client.destroy();
            delete clients[negocioId];
            initializeClientForNegocio(negocio);
          }
        });

        client.on('ready', () => {
          console.log(`✅ Cliente de WhatsApp listo para negocio ${negocioId}`);
        });

        client.on('message', async (msg) => {
          const chat = await msg.getChat();
          const negocio = clients[negocioId].negocio;
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
        
          const faqs = await new Promise((resolve) => {
            db.all('SELECT * FROM faqs WHERE negocio_id = ?', [negocioId], (err, rows) => {
              resolve(err ? [] : rows);
            });
          });
        
          const productos = await new Promise((resolve) => {
            db.all('SELECT * FROM productos WHERE negocio_id = ?', [negocioId], (err, rows) => {
              resolve(err ? [] : rows);
            });
          });
        
          const faqsTexto = faqs.length > 0 ? faqs.map(faq => `Pregunta: ${faq.pregunta} Respuesta: ${faq.respuesta}`).join('\n') : 'No hay FAQs disponibles.';
          const productosTexto = productos.length > 0 ? productos.map(p => `${p.nombre}: ${p.descripcion} - $${p.precio}`).join('\n') : 'No hay productos disponibles.';
        
          const negocioActualizado = {
            ...negocioDb,
            faqs,
            productos,
            faqs_texto: faqsTexto,
            productos_texto: productosTexto,
          };
        
          let numeroCliente = chat.isGroup ? msg.author : msg.from;
          if (numeroCliente.startsWith('549')) {
            numeroCliente = '54' + numeroCliente.slice(3);
          }
        
          const webhookUrl = 'https://a958-190-189-158-117.ngrok-free.app/webhook/procesar-mensaje';
          const payload = {
            mensaje: msg.body,
            numeroCliente,
            negocio: negocioActualizado,
          };
        
          try {
            const res = await axios.post(webhookUrl, payload);
            const respuesta = typeof res.data === 'string' && res.data.trim() ? res.data.trim() : '⚠️ No se pudo generar una respuesta válida.';
            await client.sendMessage(msg.from, respuesta);
            console.log('📨 Respuesta enviada:', respuesta);
          } catch (err) {
            console.error('❌ Error al enviar a n8n:', err.message);
            await client.sendMessage(msg.from, 'Ocurrió un error, intentá de nuevo.');
          }
        });

        client.initialize();
      }
    });
  });
}

function initializeClientForNegocio(negocio) {
  const negocioId = negocio.id;
  const client = new Client();
  client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      if (err) {
        console.error('Error al generar QR:', err);
        return;
      }
      clients[negocioId] = { client, qr: url, authenticated: false, negocio: { ...negocio } };
    });
  });
  client.initialize();
}

initializeClients();

function identificarNegocio(cleanNumero) {
  return new Promise((resolve) => {
    let normalizedNumero = cleanNumero;
    if (!normalizedNumero.startsWith('549') && normalizedNumero.startsWith('54')) {
      normalizedNumero = '549' + normalizedNumero.slice(2);
    }
    db.get(
      'SELECT * FROM negocios WHERE replace(replace(numero_telefono, "+", ""), "-", "") = ?',
      [normalizedNumero],
      (err, negocio) => {
        if (err || !negocio) {
          console.error('Error o negocio no encontrado:', err || 'No existe');
          resolve(null);
          return;
        }
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
        });
      }
    );
  });
}

function identificarNegocioPorId(negocioId) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM negocios WHERE id = ?', [negocioId], (err, negocio) => {
      if (err || !negocio) {
        console.error('Error o negocio no encontrado por ID:', err || 'No existe');
        resolve(null);
        return;
      }
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
      });
    });
  });
}

module.exports = { clients, initializeClients };