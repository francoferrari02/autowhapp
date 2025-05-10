const { Client } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode');
const db = require('../db');

const clients = {};

function initializeClients() {
  console.log('Inicializando clientes...');
  db.all('SELECT * FROM negocios', [], (err, negocios) => {
    if (err) {
      console.error('Error al obtener negocios:', err.message);
      return;
    }
    if (negocios.length === 0) {
      console.log('No se encontraron negocios en la base de datos.');
      return;
    }
    console.log('Negocios obtenidos de la base de datos:', negocios);
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
              negocio: { ...negocio }
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
          const negocioAutenticado = await identificarNegocio(clientNumber);
        
          if (negocioAutenticado && negocioAutenticado.id === negocioId) {
            clients[negocioId].authenticated = true;
            clients[negocioId].negocio = { ...negocioAutenticado };
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
        
          const faqs = await new Promise((resolve) => {
            db.all('SELECT * FROM faqs WHERE negocio_id = ?', [negocioId], (err, rows) => resolve(err ? [] : rows));
          });
        
          const productos = await new Promise((resolve) => {
            db.all('SELECT * FROM productos WHERE negocio_id = ?', [negocioId], (err, rows) => resolve(err ? [] : rows));
          });
        
          const reservas = await new Promise((resolve) => {
            db.all('SELECT * FROM reservas WHERE negocio_id = ? AND ocupado = 1', [negocioId], (err, rows) => resolve(err ? [] : rows));
          });
        
          const faqsTexto = faqs.length > 0 ? faqs.map(faq => `Pregunta: ${faq.pregunta} Respuesta: ${faq.respuesta}`).join('\n') : 'No hay FAQs disponibles.';
          const productosTexto = productos.length > 0 ? productos.map(p => `${p.nombre}: ${p.descripcion || ''} - $${p.precio}`).join('\n') : 'No hay productos disponibles.';
        
          // Generar slots disponibles
          const { appointment_duration, break_between, hora_inicio_default, hora_fin_default } = negocioDb;
          const toMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
          };
          const slots = [];
          let currentMinutes = toMinutes(hora_inicio_default);
          const endMinutes = toMinutes(hora_fin_default);
          const occupiedSlots = reservas.map(r => ({
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
        
          // Depuración del tipo de dato
          console.log('Tipo de modulo_reservas:', typeof negocioDb.modulo_reservas, negocioDb.modulo_reservas);
        
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
            appointment_duration: Number(negocioDb.appointment_duration),
            break_between: Number(negocioDb.break_between),
            hora_inicio_default: negocioDb.hora_inicio_default,
            hora_fin_default: negocioDb.hora_fin_default,
            faqs,
            productos,
            reservas,
            faqs_texto: faqsTexto,
            productos_texto: productosTexto,
            slots
          };
        
          let numeroCliente = chat.isGroup ? msg.author : msg.from;
          if (numeroCliente.startsWith('549')) {
            numeroCliente = '54' + numeroCliente.slice(3);
          }
          if (!numeroCliente.endsWith('@c.us')) {
            numeroCliente += '@c.us';
          }
        
          const webhookUrl = 'https://f88f-190-231-115-65.ngrok-free.app/webhook/procesar-mensaje';
          const payload = {
            mensaje: msg.body,
            numeroCliente,
            negocio: negocioActualizado
          };
        
          try {
            console.log('🔄 Enviando solicitud al webhook:', webhookUrl, JSON.stringify(payload, null, 2));
            const res = await axios.post(webhookUrl, payload);
            const respuesta = typeof res.data === 'string' && res.data.trim() ? res.data.trim() : '⚠️ No se pudo generar una respuesta válida.';
            console.log('✅ Respuesta recibida del webhook:', respuesta);
        
            // Detectar si la respuesta contiene una reserva
            const reservaMatch = respuesta.match(/\|\|RESERVA\|\|(.*?)\|\|END\|\|/);
            if (reservaMatch && reservaMatch[1]) {
              console.log('🔍 Reserva detectada en la respuesta:', reservaMatch[0]);
              const reservaData = JSON.parse(reservaMatch[1]);
              console.log('📋 Datos de la reserva extraídos:', reservaData);
              const backendUrl = `http://localhost:3000/api/reservas/${reservaData.negocioId}`;
              try {
                console.log('📤 Enviando reserva al backend:', backendUrl, {
                  fecha: reservaData.fecha,
                  hora_inicio: reservaData.hora_inicio,
                  hora_fin: reservaData.hora_fin,
                  ocupado: 1,
                  cliente: 'Cliente vía WhatsApp',
                  telefono: reservaData.numeroCliente || numeroCliente,
                  descripcion: 'Reserva confirmada por bot'
                });
                const backendRes = await axios.post(backendUrl, {
                  fecha: reservaData.fecha,
                  hora_inicio: reservaData.hora_inicio,
                  hora_fin: reservaData.hora_fin,
                  ocupado: 1,
                  cliente: 'Cliente vía WhatsApp',
                  telefono: reservaData.numeroCliente || numeroCliente,
                  descripcion: 'Reserva confirmada por bot'
                });
                console.log('📥 Respuesta del backend:', backendRes.status, backendRes.data);
                if (backendRes.status === 200 && backendRes.data.success) {
                  let confirmMessage = "¡Tu reserva ha sido confirmada con éxito!\nDetalle de la reserva:\n";
                  confirmMessage += `- Fecha: ${reservaData.fecha}\n`;
                  confirmMessage += `- Horario: ${reservaData.hora_inicio} a ${reservaData.hora_fin}\n`;
                  await client.sendMessage(msg.from, confirmMessage);
                  console.log('📨 Mensaje de confirmación enviado:', confirmMessage);
                } else {
                  console.error('❌ Registro de reserva falló en el backend:', backendRes.data);
                  await client.sendMessage(msg.from, 'Error al confirmar la reserva, intentá de nuevo.');
                }
              } catch (backendErr) {
                console.error('❌ Error al registrar reserva en el backend:', backendErr.message, backendErr.response?.data);
                await client.sendMessage(msg.from, 'Error al confirmar la reserva, intentá de nuevo.');
              }
            } else {
              await client.sendMessage(msg.from, respuesta);
              console.log('📨 Respuesta enviada (no es reserva):', respuesta);
            }
          } catch (err) {
            console.error('❌ Error al enviar a n8n:', err.message, err.response?.data);
            await client.sendMessage(msg.from, 'Ocurrió un error, intentá de nuevo.');
          }
        });

        client.initialize();
        console.log(`Cliente inicializado para negocio ${negocioId}`);
      }
    });
  });
}

function initializeClientForNegocio(negocio) {
  const negocioId = negocio.id;
  const client = new Client();
  client.on('qr', (qr) => {
    console.log(`Generando QR para negocio ${negocioId} (initializeClientForNegocio): ${negocio.nombre}`);
    qrcode.toDataURL(qr, (err, url) => {
      if (err) {
        console.error('Error al generar QR (initializeClientForNegocio):', err);
        return;
      }
      clients[negocioId] = { client, qr: url, authenticated: false, negocio: { ...negocio } };
      console.log(`QR generado exitosamente para negocio ${negocioId} (initializeClientForNegocio)`);
    });
  });
  client.initialize();
  console.log(`Cliente inicializado para negocio ${negocioId} (initializeClientForNegocio)`);
}

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
        console.log('Datos crudos de identificarNegocio:', negocio);
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
          estado_bot: Number(negocio.estado_bot) === 1,
          modulo_pedidos: Number(negocio.modulo_pedidos) === 1,
          modulo_reservas: Number(negocio.modulo_reservas) === 1,
          appointment_duration: Number(negocio.appointment_duration) || 60,
          break_between: Number(negocio.break_between) || 15,
          hora_inicio_default: negocio.hora_inicio_default || '09:00',
          hora_fin_default: negocio.hora_fin_default || '18:00',
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
      console.log('Datos crudos de identificarNegocioPorId:', negocio);
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
        estado_bot: Number(negocio.estado_bot) === 1,
        modulo_pedidos: Number(negocio.modulo_pedidos) === 1,
        modulo_reservas: Number(negocio.modulo_reservas) === 1,
        appointment_duration: Number(negocio.appointment_duration) || 60,
        break_between: Number(negocio.break_between) || 15,
        hora_inicio_default: negocio.hora_inicio_default || '09:00',
        hora_fin_default: negocio.hora_fin_default || '18:00',
      });
    });
  });
}

function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

initializeClients();

module.exports = { clients, initializeClients };
