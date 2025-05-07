const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');
const { clients } = require('./whatsapp/client');

const app = express();
app.use(express.json());
app.use(cors());

// Endpoint para obtener los QRs de los negocios no autenticados con nombres actualizados
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
    // Obtener reservas asociadas
    db.all('SELECT * FROM reservas WHERE negocio_id = ?', [negocioId], (err, reservas) => {
      if (err) {
        console.error('Error al obtener reservas:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({
        ...row,
        reservas: reservas || [],
        modulo_reservas: row.modulo_reservas === 1,
        appointmentDuration: row.appointment_duration,
        breakBetween: row.break_between
      });
    });
  });
});

// Endpoint para crear un negocio
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

// Endpoint para actualizar el estado del bot
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

// Endpoint para actualizar el estado del módulo de pedidos
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

// Endpoint para actualizar el estado del módulo de reservas
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

// Endpoint para registrar reservas
app.post('/api/reservas/:negocioId', (req, res) => {
  const { negocioId } = req.params;
  const { fecha_inicio, fecha_fin, cliente, telefono, descripcion } = req.body;
  console.log('Datos recibidos en POST /api/reservas:', { negocioId, fecha_inicio, fecha_fin, cliente, telefono, descripcion });

  if (!fecha_inicio || !fecha_fin) {
    console.log('Faltan campos obligatorios: fecha_inicio o fecha_fin');
    return res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos' });
  }

  // Verificar si el módulo de reservas está activo
  db.get('SELECT modulo_reservas FROM negocios WHERE id = ?', [negocioId], (err, row) => {
    if (err) {
      console.error('Error al verificar negocio:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!row || row.modulo_reservas !== 1) {
      console.log('Módulo de reservas no activo para negocio:', negocioId);
      return res.status(403).json({ error: 'Módulo de reservas no activo' });
    }

    // Verificar si hay superposición con otras reservas
    db.all(
      'SELECT * FROM reservas WHERE negocio_id = ? AND ((fecha_inicio <= ? AND fecha_fin >= ?) OR (fecha_inicio <= ? AND fecha_fin >= ?))',
      [negocioId, fecha_inicio, fecha_inicio, fecha_fin, fecha_fin],
      (err, reservas) => {
        if (err) {
          console.error('Error al verificar superposición:', err.message);
          return res.status(500).json({ error: err.message });
        }
        if (reservas.length > 0) {
          console.log('Conflicto de horario con otra reserva');
          return res.status(409).json({ error: 'Conflicto de horario con otra reserva' });
        }

        // Registrar la reserva
        db.run(
          'INSERT INTO reservas (negocio_id, fecha_inicio, fecha_fin, cliente, telefono, descripcion) VALUES (?, ?, ?, ?, ?, ?)',
          [negocioId, fecha_inicio, fecha_fin, cliente || '', telefono || '', descripcion || ''],
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

// Endpoint para actualizar configuración de reservas
app.put('/api/reservas/:negocioId', (req, res) => {
  const { negocioId } = req.params;
  const { appointmentDuration, breakBetween } = req.body;
  console.log('Datos recibidos en PUT /api/reservas:', { negocioId, appointmentDuration, breakBetween });

  if (appointmentDuration == null || breakBetween == null) {
    console.log('Faltan campos obligatorios: appointmentDuration o breakBetween');
    return res.status(400).json({ error: 'appointmentDuration y breakBetween son requeridos' });
  }

  if (appointmentDuration <= 0 || breakBetween < 0) {
    console.log('Valores inválidos para appointmentDuration o breakBetween');
    return res.status(400).json({ error: 'appointmentDuration debe ser mayor que 0 y breakBetween no puede ser negativo' });
  }

  db.run(
    'UPDATE negocios SET appointment_duration = ?, break_between = ? WHERE id = ?',
    [appointmentDuration, breakBetween, negocioId],
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

// Endpoint para registrar pedidos
app.post('/api/registrar-pedido', (req, res) => {
  const { negocioId, numeroCliente, producto, cantidad } = req.body;
  console.log('Datos recibidos en POST /api/registrar-pedido:', { negocioId, numeroCliente, producto, cantidad });

  if (!negocioId || !numeroCliente || !producto || !cantidad) {
    console.log('Faltan campos obligatorios para registrar pedido');
    return res.status(400).json({ error: 'negocioId, numeroCliente, producto y cantidad son requeridos' });
  }

  db.run('INSERT INTO pedidos (negocio_id, numero_cliente, producto, cantidad) VALUES (?, ?, ?, ?)',
    [negocioId, numeroCliente, producto, cantidad], (err) => {
      if (err) {
        console.error('Error al registrar pedido:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Pedido registrado con éxito');
      res.json({ success: true });
    });
});

// Actualizar negocio completo
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

// GET FAQs
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

// Crear una FAQ (POST)
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

// Actualizar una FAQ (PUT)
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

// Eliminar una FAQ (DELETE)
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

// Listar negocios
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

// Gestionar productos
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

// Gestionar mensajes de pedidos
app.post('/api/mensajes-pedidos', (req, res) => {
  const { negocio_id, mensajes } = req.body;
  console.log('Datos recibidos en POST /api/mensajes-pedidos:', { negocio_id, mensajes });

  const tipos = ['recibido', 'preparando', 'enviado'];
  db.serialize(() => {
    tipos.forEach(tipo => {
      db.run('INSERT OR REPLACE INTO mensajes_pedidos (negocio_id, tipo, mensaje) VALUES (?, ?, ?)',
        [negocio_id, tipo, mensajes[tipo]], (err) => {
          if (err) console.error('Error al insertar mensaje de pedido:', err.message);
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

// Gestionar pedidos
app.get('/api/pedidos/:negocioId', (req, res) => {
  console.log(`Solicitud GET /api/pedidos/${req.params.negocioId}`);
  db.all('SELECT * FROM pedidos WHERE negocio_id = ?', [req.params.negocioId], (err, rows) => {
    if (err) {
      console.error('Error al obtener pedidos:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

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
    if (mensaje && clients[pedido.negocio_id]?.client) {
      console.log(`Enviando mensaje al cliente ${pedido.numero_cliente}:`, mensaje);
      clients[pedido.negocio_id].client.sendMessage(pedido.numero_cliente, mensaje);
    }
    console.log(`Estado del pedido ${req.params.id} actualizado a:`, estado);
    res.json({ success: true });
  });
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../autowhapp-dashboard/build')));

// Manejar todas las demás rutas devolviendo el index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../autowhapp-dashboard/build', 'index.html'));
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Backend corriendo en puerto 3000');
});