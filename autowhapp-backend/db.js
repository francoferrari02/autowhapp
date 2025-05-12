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
  db.all(`PRAGMA table_info(negocios)`, (err, columns) => {
    if (err) {
      console.error('Error al obtener columnas de negocios:', err.message);
      return;
    }
    const columnExists = columns.some(col => col.name === 'modulo_recordatorios');
    if (!columnExists) {
      db.run(`ALTER TABLE negocios ADD COLUMN modulo_recordatorios INTEGER DEFAULT 0`, (err) => {
        if (err) {
          console.error('Error al agregar columna modulo_recordatorios:', err.message);
        } else {
          console.log('Columna modulo_recordatorios agregada a negocios');
        }
      });
    } else {
      console.log('Columna modulo_recordatorios ya existe en negocios');
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

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_reservas_negocio_fecha 
    ON reservas (negocio_id, fecha)
  `, (err) => {
    if (err) {
      console.error('Error al crear índice idx_reservas_negocio_fecha:', err.message);
    } else {
      console.log('Índice idx_reservas_negocio_fecha creado o ya existe');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS recordatorios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      negocio_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      frequency TEXT NOT NULL,
      time TEXT NOT NULL,
      day TEXT,
      activo INTEGER DEFAULT 1,
      last_sent TEXT,
      FOREIGN KEY (negocio_id) REFERENCES negocios(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla recordatorios:', err.message);
    } else {
      console.log('Tabla recordatorios creada o ya existe');
      db.all(`PRAGMA table_info(recordatorios)`, (err, columns) => {
        if (err) {
          console.error('Error al obtener columnas de recordatorios:', err.message);
          return;
        }
        const lastSentExists = columns.some(col => col.name === 'last_sent');
        if (!lastSentExists) {
          db.run(`ALTER TABLE recordatorios ADD COLUMN last_sent TEXT`, (err) => {
            if (err) {
              console.error('Error al agregar columna last_sent:', err.message);
            } else {
              console.log('Columna last_sent agregada a recordatorios');
            }
          });
        }
      });
    }
  });

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
      items TEXT NOT NULL,
      estado TEXT DEFAULT 'recibido',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (negocio_id) REFERENCES negocios(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla pedidos:', err.message);
    }
  });
});

module.exports = db;