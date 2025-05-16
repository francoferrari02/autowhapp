const { Pool } = require('pg');

const pool = new Pool({
  user: 'autowhapp_user',
  host: 'localhost',
  database: 'autowhapp',
  password: 'tu_contraseña_segura',
  port: 5432,
});

pool.connect((err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos PostgreSQL');
  }
});

// Crear tablas si no existen (solo una vez al iniciar)
pool.query(`
  CREATE TABLE IF NOT EXISTS negocios (
    id SERIAL PRIMARY KEY,
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
    modulo_recordatorios INTEGER DEFAULT 0,
    appointment_duration INTEGER DEFAULT 60,
    break_between INTEGER DEFAULT 15,
    hora_inicio_default TEXT DEFAULT '09:00',
    hora_fin_default TEXT DEFAULT '18:00'
  );

  CREATE TABLE IF NOT EXISTS reservas (
    id SERIAL PRIMARY KEY,
    negocio_id INTEGER,
    fecha TEXT NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    ocupado INTEGER DEFAULT 0,
    cliente TEXT,
    telefono TEXT,
    descripcion TEXT,
    CONSTRAINT fk_negocio_reservas FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_reservas_negocio_fecha ON reservas (negocio_id, fecha);

  CREATE TABLE IF NOT EXISTS recordatorios (
    id SERIAL PRIMARY KEY,
    negocio_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    frequency TEXT NOT NULL,
    time TEXT NOT NULL,
    day TEXT,
    activo INTEGER DEFAULT 1,
    last_sent TIMESTAMP,
    CONSTRAINT fk_negocio_recordatorios FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,
    negocio_id INTEGER,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    CONSTRAINT fk_negocio_faqs FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    negocio_id INTEGER,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL,
    foto TEXT,
    CONSTRAINT fk_negocio_productos FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS mensajes_pedidos (
    id SERIAL PRIMARY KEY,
    negocio_id INTEGER,
    tipo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    CONSTRAINT fk_negocio_mensajes_pedidos FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    negocio_id INTEGER,
    numero_cliente TEXT NOT NULL,
    items TEXT NOT NULL,
    estado TEXT DEFAULT 'recibido',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_negocio_pedidos FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
  );
`, (err) => {
  if (err) {
    console.error('Error al crear tablas:', err.message);
  } else {
    console.log('Tablas creadas o ya existen en PostgreSQL');
  }
});

module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback),
  get: (text, params, callback) => pool.query(text, params, (err, res) => callback(err, res ? res.rows[0] : null)),
  all: (text, params, callback) => pool.query(text, params, (err, res) => callback(err, res ? res.rows : [])),
  run: (text, params, callback) => pool.query(text, params, (err, res) => callback(err, res))
};