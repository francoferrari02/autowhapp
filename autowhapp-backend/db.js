const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'autowhapp_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'autowhapp',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432
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
    nombre VARCHAR(255) NOT NULL,
    numero_telefono VARCHAR(20) NOT NULL,
    tipo_negocio VARCHAR(50) NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    direccion TEXT NOT NULL,
    horarios JSONB,
    contexto TEXT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    negocio_id INTEGER NOT NULL REFERENCES negocios(id),
    fecha_recordatorio TIMESTAMP WITH TIME ZONE NOT NULL,
    mensaje TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

  REATE TABLE users (
    id SERIAL PRIMARY KEY,
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`, (err) => {
  if (err) {
    console.error('Error al crear/modificar tablas:', err.message);
  } else {
    console.log('Tablas actualizadas en PostgreSQL');
  }
});

module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback),
  get: (text, params, callback) => pool.query(text, params, (err, res) => callback(err, res ? res.rows[0] : null)),
  all: (text, params, callback) => pool.query(text, params, (err, res) => callback(err, res ? res.rows : [])),
  run: (text, params, callback) => pool.query(text, params, (err, res) => callback(err, res))
};