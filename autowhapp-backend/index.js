const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');
const { clients } = require('./whatsapp/client');
const cron = require('node-cron');

cron.schedule('*/30 * * * * *', () => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentDayName = now.toLocaleDateString('es-AR', { weekday: 'long' });
  const currentDayNumber = String(now.getDate());
  const currentDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
  console.log('🕒 Ejecutando CRON | Hora local:', now.toLocaleTimeString(), '| Minutos:', currentMinutes);

  const toMinutes = (timeString) => {
    const [hh, mm] = timeString.split(':').map(Number);
    return hh * 60 + mm;
  };

  db.all('SELECT * FROM recordatorios WHERE activo = 1', [], async (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener recordatorios:', err.message);
      return;
    }

    console.log(`📂 Recordatorios activos encontrados: ${rows.length}`);

    for (const recordatorio of rows) {
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

      try {
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
        const negocio = await new Promise((resolve) => db.get('SELECT grupo_id FROM negocios WHERE id = ?', [negocio_id], (err, row) => resolve(row)));
        if (negocio && negocio.grupo_id) {
          try {
            grupo = await client.getChatById(negocio.grupo_id);
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

          db.run('UPDATE recordatorios SET last_sent = ? WHERE id = ?', [currentDateTime, id], (err) => {
            if (err) console.error('❌ Error al actualizar last_sent:', err.message);
            else console.log(`✅ last_sent actualizado para recordatorio ID ${id}`);
          });
        } catch (sendErr) {
          console.error(`🚨 Error al enviar mensaje para recordatorio ID ${id}:`, sendErr.message);
        }
      } catch (e) {
        console.error(`❌ Error general al procesar recordatorio ID ${id}:`, e.message);
      }
    }
  });
});

const app = express();
app.use(express.json());
app.use(cors());

// Helper function to format minutes into HH:MM
const formatTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Endpoint para obtener la configuración del negocio
app.get('/api/negocio/:id', (req, res) => {
  const negocioId = req.params.id;
  console.log(`Solicitud GET /api/negocio/${negocioId}`);
  db.get('SELECT * FROM negocios WHERE id = ?', [negocioId], (err, row) => {
    if (err) {
      console.error('Error al obtener negocio:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      console.log('Negocio no encontrado:', negocioId);
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }
    // Obtener reservas
    db.all('SELECT * FROM reservas WHERE negocio_id = ?', [negocioId], (err, reservas) => {
      if (err) {
        console.error('Error al obtener reservas:', err.message);
        return res.status(500).json({ error: err.message });
      }
      // Obtener recordatorios
      db.all('SELECT * FROM recordatorios WHERE negocio_id = ?', [negocioId], (err, recordatorios) => {
        if (err) {
          console.error('Error al obtener recordatorios:', err.message);
          return res.status(500).json({ error: err.message });
        }
        res.json({
          ...row,
          reservas: reservas || [],
          recordatorios: recordatorios || [],
          modulo_reservas: row.modulo_reservas === 1,
          modulo_recordatorios: row.modulo_recordatorios === 1,
          appointmentDuration: row.appointment_duration,
          breakBetween: row.break_between,
          hora_inicio_default: row.hora_inicio_default,
          hora_fin_default: row.hora_fin_default,
        });
      });
    });
  });
});

// Endpoint para registrar reservas
app.post('/api/reservas/:negocioId', (req, res) => {
  const { negocioId } = req.params;
  const { fecha, hora_inicio, hora_fin, ocupado = 1, cliente, telefono, descripcion } = req.body;
  console.log('Datos recibidos en POST /api/reservas:', { negocioId, fecha, hora_inicio, hora_fin, ocupado, cliente, telefono, descripcion });

  if (!fecha || !hora_inicio || !hora_fin) {
    console.log('Faltan campos obligatorios: fecha, hora_inicio o hora_fin');
    return res.status(400).json({ error: 'fecha, hora_inicio y hora_fin son requeridos' });
  }

  db.get('SELECT modulo_reservas, appointment_duration, break_between, hora_inicio_default, hora_fin_default FROM negocios WHERE id = ?', [negocioId], (err, row) => {
    if (err) {
      console.error('Error al verificar negocio:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!row || row.modulo_reservas !== 1) {
      console.log('Módulo de reservas no activo para negocio:', negocioId);
      return res.status(403).json({ error: 'Módulo de reservas no activo' });
    }

    const { appointment_duration, break_between, hora_inicio_default, hora_fin_default } = row;

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

    db.all(
      'SELECT * FROM reservas WHERE negocio_id = ? AND fecha = ? AND ((hora_inicio <= ? AND hora_fin >= ?) OR (hora_inicio <= ? AND hora_fin >= ?))',
      [negocioId, fecha, hora_fin, hora_inicio, hora_fin, hora_inicio],
      (err, reservas) => {
        if (err) {
          console.error('Error al verificar superposición:', err.message);
          return res.status(500).json({ error: err.message });
        }
        if (reservas.length > 0) {
          console.log('Conflicto de horario con otra reserva');
          return res.status(409).json({ error: 'Conflicto de horario con otra reserva' });
        }

        db.run(
          'INSERT INTO reservas (negocio_id, fecha, hora_inicio, hora_fin, ocupado, cliente, telefono, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
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

// Endpoint para cancelar reservas
app.delete('/api/reservas/:negocioId/:reservaId', (req, res) => {
  const { negocioId, reservaId } = req.params;
  console.log(`Solicitud DELETE /api/reservas/${negocioId}/${reservaId}`);

  // Verificar si la reserva existe y pertenece al negocio
  db.get('SELECT * FROM reservas WHERE id = ? AND negocio_id = ?', [reservaId, negocioId], (err, reserva) => {
    if (err) {
      console.error('Error al verificar reserva:', err.message);
      return res.status(500).json({ error: 'Error al verificar la reserva: ' + err.message });
    }
    if (!reserva) {
      console.log(`Reserva ${reservaId} no encontrada para negocio ${negocioId}`);
      return res.status(404).json({ error: 'Reserva no encontrada o no pertenece a este negocio' });
    }

    // Proceder a eliminar la reserva
    db.run('DELETE FROM reservas WHERE id = ? AND negocio_id = ?', [reservaId, negocioId], function (err) {
      if (err) {
        console.error('Error al cancelar reserva:', err.message);
        return res.status(500).json({ error: 'Error al cancelar la reserva: ' + err.message });
      }
      if (this.changes === 0) {
        console.log(`Reserva ${reservaId} no encontrada para negocio ${negocioId}`);
        return res.status(404).json({ error: 'Reserva no encontrada o no pertenece a este negocio' });
      }
      console.log(`Reserva ${reservaId} cancelada con éxito para negocio ${negocioId}`);
      res.json({ success: true });
    });
  });
});

// Endpoint para actualizar configuración de reservas
app.put('/api/reservas/:negocioId', (req, res) => {
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

  db.run(
    'UPDATE negocios SET appointment_duration = ?, break_between = ?, hora_inicio_default = ?, hora_fin_default = ? WHERE id = ?',
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
app.delete('/api/pedidos/:negocioId/:pedidoId', (req, res) => {
  const { negocioId, pedidoId } = req.params;
  console.log(`Solicitud DELETE /api/pedidos/${negocioId}/${pedidoId}`);

  db.get('SELECT * FROM pedidos WHERE id = ? AND negocio_id = ?', [pedidoId, negocioId], (err, pedido) => {
    if (err) {
      console.error('Error al verificar pedido:', err.message);
      return res.status(500).json({ error: 'Error al verificar el pedido: ' + err.message });
    }
    if (!pedido) {
      console.log(`Pedido ${pedidoId} no encontrado para negocio ${negocioId}`);
      return res.status(404).json({ error: 'Pedido no encontrado o no pertenece a este negocio' });
    }

    db.run('DELETE FROM pedidos WHERE id = ? AND negocio_id = ?', [pedidoId, negocioId], function (err) {
      if (err) {
        console.error('Error al eliminar pedido:', err.message);
        return res.status(500).json({ error: 'Error al eliminar el pedido: ' + err.message });
      }
      if (this.changes === 0) {
        console.log(`Pedido ${pedidoId} no encontrado para negocio ${negocioId}`);
        return res.status(404).json({ error: 'Pedido no encontrado o no pertenece a este negocio' });
      }
      console.log(`Pedido ${pedidoId} eliminado con éxito para negocio ${negocioId}`);
      res.json({ success: true });
    });
  });
});

// Endpoint para actualizar el estado de un pedido
app.put('/api/pedido/:id/estado', (req, res) => {
  const { estado } = req.body;
  console.log(`Solicitud PUT /api/pedido/${req.params.id}/estado:`, { estado });

  db.run('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, req.params.id], async (err) => {
    if (err) {
      console.error('Error al actualizar estado del pedido:', err.message);
      return res.status(500).json({ error: err.message });
    }
    const pedido = await new Promise((resolve) => db.get('SELECT * FROM pedidos WHERE id = ?', [req.params.id], (e, r) => resolve(r)));
    const mensaje = await new Promise((resolve) => db.get('SELECT mensaje FROM mensajes_pedidos WHERE negocio_id = ? AND tipo = ?', [pedido.negocio_id, estado.toLowerCase()], (e, r) => resolve(r?.mensaje)));
    console.log(`Mensaje recuperado para estado ${estado}: ${mensaje}`);
    if (mensaje && clients[pedido.negocio_id]?.client) {
      console.log(`Buscando grupo "Prueba Autowhapp" para negocio ${pedido.negocio_id}`);
      let grupo;
      const negocio = await new Promise((resolve) => db.get('SELECT grupo_id FROM negocios WHERE id = ?', [pedido.negocio_id], (err, row) => resolve(row)));
      if (negocio && negocio.grupo_id) {
        try {
          grupo = await clients[pedido.negocio_id].client.getChatById(negocio.grupo_id);
          console.log(`✅ Chat del grupo obtenido: ${grupo.name}`);
        } catch (err) {
          console.error('❌ Error al obtener chat por ID:', err.message);
        }
      }
      if (!grupo) {
        const chats = await clients[pedido.negocio_id].client.getChats();
        grupo = chats.find(chat => chat.isGroup && chat.name === 'Prueba Autowhapp');
      }
      if (grupo) {
        console.log(`Enviando mensaje al grupo ${grupo.id._serialized}: ${mensaje}`);
        await clients[pedido.negocio_id].client.sendMessage(grupo.id._serialized, mensaje);
      } else {
        console.error(`❌ No se encontró el grupo "Prueba Autowhapp" para negocio ${pedido.negocio_id}`);
      }
    }
    console.log(`Estado del pedido ${req.params.id} actualizado a: ${estado}`);
    res.json({ success: true });
  });
});

// Otros endpoints
app.get('/api/qrs', (req, res) => {
  db.all('SELECT id, nombre FROM negocios', [], (err, negocios) => {
    if (err) {
      console.error('Error al obtener negocios:', err.message);
      return res.status(500).json({ error: err.message });
    }
    const qrs = negocios.map(negocio => {
      const negocioId = negocio.id;
      return {
        negocioId,
        qr: clients[negocioId]?.qr || null,
        authenticated: clients[negocioId]?.authenticated || false,
        nombre: negocio.nombre
      };
    }).filter(client => !client.authenticated && client.qr);
    res.json(qrs);
  });
});

app.post('/api/actualizar-estado-bot', (req, res) => {
  const { negocioId, estadoBot } = req.body;
  console.log('Datos recibidos en POST /api/actualizar-estado-bot:', { negocioId, estadoBot });

  if (!negocioId || estadoBot === undefined) {
    console.log('Faltan campos obligatorios: negocioId o estadoBot');
    return res.status(400).json({ error: 'negocioId y estadoBot son requeridos' });
  }

  db.run('UPDATE negocios SET estado_bot = ? WHERE id = ?', [estadoBot ? 1 : 0, negocioId], (err) => {
    if (err) {
      console.error('Error al actualizar estado del bot:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Estado del bot actualizado para negocio ${negocioId}:`, estadoBot);
    res.json({ success: true });
  });
});

app.post('/api/actualizar-modulo-pedidos', (req, res) => {
  const { negocioId, moduloPedidos } = req.body;
  console.log('Datos recibidos en POST /api/actualizar-modulo-pedidos:', { negocioId, moduloPedidos });

  if (!negocioId || moduloPedidos === undefined) {
    console.log('Faltan campos obligatorios: negocioId o moduloPedidos');
    return res.status(400).json({ error: 'negocioId y moduloPedidos son requeridos' });
  }

  db.run('UPDATE negocios SET modulo_pedidos = ? WHERE id = ?', [moduloPedidos ? 1 : 0, negocioId], (err) => {
    if (err) {
      console.error('Error al actualizar modulo de pedidos:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Estado del módulo de pedidos actualizado para negocio ${negocioId}:`, moduloPedidos);
    res.json({ success: true });
  });
});

app.post('/api/actualizar-modulo-reservas', (req, res) => {
  const { negocioId, moduloReservas } = req.body;
  console.log('Datos recibidos en POST /api/actualizar-modulo-reservas:', { negocioId, moduloReservas });

  if (!negocioId || moduloReservas === undefined) {
    console.log('Faltan campos obligatorios: negocioId o moduloReservas');
    return res.status(400).json({ error: 'negocioId y moduloReservas son requeridos' });
  }

  db.run('UPDATE negocios SET modulo_reservas = ? WHERE id = ?', [moduloReservas ? 1 : 0, negocioId], (err) => {
    if (err) {
      console.error('Error al actualizar modulo de reservas:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Estado del módulo de reservas actualizado para negocio ${negocioId}:`, moduloReservas);
    res.json({ success: true });
  });
});

app.post('/api/actualizar-modulo-recordatorios', (req, res) => {
  const { negocioId, moduloRecordatorios } = req.body;
  console.log('Datos recibidos en POST /api/actualizar-modulo-recordatorios:', { negocioId, moduloRecordatorios });

  if (!negocioId || moduloRecordatorios === undefined) {
    console.log('Faltan campos obligatorios: negocioId o moduloRecordatorios');
    return res.status(400).json({ error: 'negocioId y moduloRecordatorios son requeridos' });
  }

  db.run('UPDATE negocios SET modulo_recordatorios = ? WHERE id = ?', [moduloRecordatorios ? 1 : 0, negocioId], (err) => {
    if (err) {
      console.error('Error al actualizar módulo de recordatorios:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Estado del módulo de recordatorios actualizado para negocio ${negocioId}:`, moduloRecordatorios);
    res.json({ success: true });
  });
});

app.post('/api/negocios', (req, res) => {
  const {
    nombre,
    numero_telefono,
    tipo_negocio,
    localidad,
    direccion,
    horarios,
    contexto = '',
    estado_bot = 1,
    modulo_pedidos = 0,
    modulo_reservas = 0
  } = req.body;

  console.log('Datos recibidos en POST /api/negocios:', req.body);

  if (!nombre || !numero_telefono) {
    console.log('Faltan campos obligatorios: nombre o numero_telefono');
    return res.status(400).json({ error: 'Nombre y número de teléfono son requeridos' });
  }

  let normalizedNumeroTelefono = numero_telefono.replace(/[^0-9+]/g, '');
  if (normalizedNumeroTelefono.startsWith('54') && !normalizedNumeroTelefono.startsWith('549')) {
    normalizedNumeroTelefono = '549' + normalizedNumeroTelefono.slice(2);
  }
  if (!normalizedNumeroTelefono.startsWith('+')) {
    normalizedNumeroTelefono = '+' + normalizedNumeroTelefono;
  }

  const horariosString = JSON.stringify(horarios || {
    Lunes: { open: '09:00', close: '18:00' },
    Martes: { open: '09:00', close: '18:00' },
    Miércoles: { open: '09:00', close: '18:00' },
    Jueves: { open: '09:00', close: '18:00' },
    Viernes: { open: '09:00', close: '18:00' },
    Sábado: { open: '09:00', close: '18:00' },
    Domingo: { open: '09:00', close: '18:00' },
  });

  db.run(
    `INSERT INTO negocios (nombre, numero_telefono, tipo_negocio, localidad, direccion, horarios, contexto, estado_bot, modulo_pedidos, modulo_reservas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nombre,
      normalizedNumeroTelefono,
      tipo_negocio || 'personalizado',
      localidad || '',
      direccion || '',
      horariosString,
      contexto || '',
      estado_bot ? 1 : 0,
      modulo_pedidos ? 1 : 0,
      modulo_reservas ? 1 : 0
    ],
    function (err) {
      if (err) {
        console.error('Error al insertar negocio:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Negocio insertado con éxito, ID:', this.lastID);
      res.json({ success: true, negocioId: this.lastID });
    }
  );
});

app.put('/api/negocio/:id', (req, res) => {
  const { nombre, tipo_negocio, localidad, direccion, horarios, contexto, modulo_pedidos, estado_bot, modulo_reservas } = req.body;
  console.log(`Solicitud PUT /api/negocio/${req.params.id}:`, req.body);

  db.run(
    `UPDATE negocios SET nombre = ?, tipo_negocio = ?, localidad = ?, direccion = ?, horarios = ?, contexto = ?, modulo_pedidos = ?, estado_bot = ?, modulo_reservas = ? WHERE id = ?`,
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

app.get('/api/faqs/:negocioId', (req, res) => {
  const negocioId = req.params.negocioId;
  console.log(`Solicitud GET /api/faqs/${negocioId}`);
  db.all('SELECT * FROM faqs WHERE negocio_id = ?', [negocioId], (err, rows) => {
    if (err) {
      console.error('Error al obtener FAQs:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/faqs', (req, res) => {
  const { negocioId, pregunta, respuesta } = req.body;
  console.log('Datos recibidos en POST /api/faqs:', { negocioId, pregunta, respuesta });

  if (!negocioId || !pregunta || !respuesta) {
    console.log('Faltan campos obligatorios para crear FAQ');
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  db.run('INSERT INTO faqs (negocio_id, pregunta, respuesta) VALUES (?, ?, ?)',
    [negocioId, pregunta, respuesta],
    function(err) {
      if (err) {
        console.error('Error al crear FAQ:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('FAQ creada con éxito, ID:', this.lastID);
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.put('/api/faqs/:id', (req, res) => {
  const { pregunta, respuesta } = req.body;
  console.log(`Solicitud PUT /api/faqs/${req.params.id}:`, { pregunta, respuesta });

  db.run('UPDATE faqs SET pregunta = ?, respuesta = ? WHERE id = ?',
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

app.delete('/api/faqs/:id', (req, res) => {
  console.log(`Solicitud DELETE /api/faqs/${req.params.id}`);
  db.run('DELETE FROM faqs WHERE id = ?', [req.params.id], function(err) {
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
  db.all('SELECT * FROM negocios', [], (err, rows) => {
    if (err) {
      console.error('Error al listar negocios:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/productos', (req, res) => {
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

  db.run('INSERT INTO productos (negocio_id, nombre, descripcion, precio, foto) VALUES (?, ?, ?, ?, ?)',
    [negocio_id, nombre, descripcion, precio, foto], (err) => {
      if (err) {
        console.error('Error al crear producto:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Producto creado con éxito');
      res.json({ success: true });
    });
});

app.get('/api/productos/:negocioId', (req, res) => {
  console.log(`Solicitud GET /api/productos/${req.params.negocioId}`);
  db.all('SELECT * FROM productos WHERE negocio_id = ?', [req.params.negocioId], (err, rows) => {
    if (err) {
      console.error('Error al obtener productos:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.put('/api/productos/:id', (req, res) => {
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

  db.run('UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, foto = ? WHERE id = ?',
    [nombre, descripcion, precio, foto, req.params.id], (err) => {
      if (err) {
        console.error('Error al actualizar producto:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Producto ${req.params.id} actualizado con éxito`);
      res.json({ success: true });
    });
});

app.delete('/api/productos/:id', (req, res) => {
  console.log(`Solicitud DELETE /api/productos/${req.params.id}`);
  db.run('DELETE FROM productos WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      console.error('Error al eliminar producto:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Producto ${req.params.id} eliminado con éxito`);
    res.json({ success: true });
  });
});

app.post('/api/mensajes-pedidos', (req, res) => {
  const { negocio_id, mensajes } = req.body;
  console.log('Datos recibidos en POST /api/mensajes-pedidos:', { negocio_id, mensajes });

  const tipos = ['recibido', 'preparando', 'enviado'];
  db.serialize(() => {
    tipos.forEach(tipo => {
      db.run('INSERT OR REPLACE INTO mensajes_pedidos (negocio_id, tipo, mensaje) VALUES (?, ?, ?)',
        [negocio_id, tipo, mensajes[tipo]], (err) => {
          if (err) console.error('Error al insertar mensaje de pedido:', err.message);
          else console.log(`Mensaje para ${tipo} actualizado: ${mensajes[tipo]}`);
        });
    });
    console.log('Mensajes de pedidos actualizados con éxito');
    res.json({ success: true });
  });
});

app.get('/api/mensajes-pedidos/:negocioId', (req, res) => {
  console.log(`Solicitud GET /api/mensajes-pedidos/${req.params.negocioId}`);
  db.all('SELECT * FROM mensajes_pedidos WHERE negocio_id = ?', [req.params.negocioId], (err, rows) => {
    if (err) {
      console.error('Error al obtener mensajes de pedidos:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/pedidos/:negocioId', (req, res) => {
  console.log(`Solicitud GET /api/pedidos/${req.params.negocioId}`);
  db.all('SELECT * FROM pedidos WHERE negocio_id = ? ORDER BY created_at DESC', [req.params.negocioId], (err, rows) => {
    if (err) {
      console.error('Error al obtener pedidos:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/pedidos/:negocioId', (req, res) => {
  const { negocioId } = req.params;
  const { numero_cliente, items } = req.body;
  console.log('Datos recibidos en POST /api/pedidos:', { negocioId, numero_cliente, items });

  if (!negocioId || !numero_cliente || !items || !Array.isArray(items) || items.length === 0) {
    console.log('Faltan campos obligatorios o items no válidos');
    return res.status(400).json({ error: 'negocioId, numero_cliente y items son requeridos' });
  }

  const itemsString = JSON.stringify(items);

  db.run(
    'INSERT INTO pedidos (negocio_id, numero_cliente, items, estado) VALUES (?, ?, ?, ?)',
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

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});