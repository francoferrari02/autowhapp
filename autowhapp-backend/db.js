const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autowhapp.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS negocios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      numero_telefono TEXT NOT NULL,
      grupo_id TEXT,
      tipo_negocio TEXT,
      localidad TEXT,
      direccion TEXT,
      horarios TEXT,
      contexto TEXT,
      estado_bot INTEGER DEFAULT 1,
      modulo_pedidos INTEGER DEFAULT 0,
      modulo_reservas INTEGER DEFAULT 0,
      appointment_duration INTEGER DEFAULT 60,
      break_between INTEGER DEFAULT 15,
      hora_inicio_default TEXT DEFAULT '09:00',
      hora_fin_default TEXT DEFAULT '18:00'
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla negocios:', err.message);
    } else {
      console.log('Tabla negocios creada o ya existe');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      negocio_id INTEGER,
      fecha TEXT NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fin TEXT NOT NULL,
      ocupado INTEGER DEFAULT 0,
      cliente TEXT,
      telefono TEXT,
      descripcion TEXT,
      FOREIGN KEY (negocio_id) REFERENCES negocios(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla reservas:', err.message);
    } else {
      console.log('Tabla reservas creada o ya existe');
    }
  });

  // Crear otras tablas (faqs, productos, mensajes_pedidos, pedidos) sin cambios
  db.run(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      negocio_id INTEGER,
      pregunta TEXT NOT NULL,
      respuesta TEXT NOT NULL,
      FOREIGN KEY (negocio_id) REFERENCES negocios(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla faqs:', err.message);
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      negocio_id INTEGER,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio REAL,
      foto TEXT,
      FOREIGN KEY (negocio_id) REFERENCES negocios(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla productos:', err.message);
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS mensajes_pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      negocio_id INTEGER,
      tipo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      FOREIGN KEY (negocio_id) REFERENCES negocios(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla mensajes_pedidos:', err.message);
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      negocio_id INTEGER,
      numero_cliente TEXT NOT NULL,
      producto TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      estado TEXT DEFAULT 'recibido',
      FOREIGN KEY (negocio_id) REFERENCES negocios(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla pedidos:', err.message);
    }
  });
});

module.exports = db;