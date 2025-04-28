const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autowhapp.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

// Crear tabla negocios
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS negocios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      numero_telefono TEXT NOT NULL,
      grupo_id TEXT,  -- Nueva columna para almacenar el ID del grupo
      tipo_negocio TEXT,
      localidad TEXT,
      direccion TEXT,
      horarios TEXT,
      contexto TEXT,
      estado_bot INTEGER DEFAULT 1,
      modulo_pedidos INTEGER DEFAULT 0
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla negocios:', err.message);
    } else {
      console.log('Tabla negocios creada o ya existe');
    }
  });

  // Agregar la columna grupo_id si no existe
  db.run(`
    ALTER TABLE negocios ADD COLUMN grupo_id TEXT
  `, (err) => {
    if (err) {
      console.log('Columna grupo_id ya existe o no se pudo agregar:', err.message);
    } else {
      console.log('Columna grupo_id agregada a la tabla negocios');
    }
  });

  // Crear tabla faqs
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
    } else {
      console.log('Tabla faqs creada o ya existe');
    }
  });

  // Crear tabla productos
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
    } else {
      console.log('Tabla productos creada o ya existe');
    }
  });

  // Crear tabla mensajes_pedidos
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
    } else {
      console.log('Tabla mensajes_pedidos creada o ya existe');
    }
  });

  // Crear tabla pedidos
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
    } else {
      console.log('Tabla pedidos creada o ya existe');
    }
  });
});

module.exports = db;
