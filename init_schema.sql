-- Crear usuario y base de datos (ejecutar como superusuario, e.g., postgres)
DO $$ 
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'autowhapp_user') THEN
      CREATE USER autowhapp_user WITH PASSWORD 'Autowhapp123';
   END IF;
END $$;

-- Crear la base de datos si no existe
DO $$ 
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'autowhapp') THEN
      CREATE DATABASE autowhapp;
   END IF;
END $$;

-- Conectar a la base de datos
\c autowhapp

-- Otorgar permisos al usuario autowhapp_user
GRANT CONNECT ON DATABASE autowhapp TO autowhapp_user;
GRANT USAGE ON SCHEMA public TO autowhapp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autowhapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autowhapp_user;

-- Crear tabla usuarios (debe crearse primero porque otras tablas dependen de ella)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla negocios
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

-- Crear tabla reservas
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

-- Crear índice para reservas
CREATE INDEX IF NOT EXISTS idx_reservas_negocio_fecha ON reservas (negocio_id, fecha);

-- Crear tabla recordatorios
CREATE TABLE IF NOT EXISTS recordatorios (
  id SERIAL PRIMARY KEY,
  negocio_id INTEGER NOT NULL REFERENCES negocios(id),
  fecha_recordatorio TIMESTAMP WITH TIME ZONE NOT NULL,
  mensaje TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla faqs
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  negocio_id INTEGER,
  pregunta TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  CONSTRAINT fk_negocio_faqs FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

-- Crear tabla productos
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  negocio_id INTEGER,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio REAL,
  foto TEXT,
  CONSTRAINT fk_negocio_productos FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

-- Crear tabla mensajes_pedidos
CREATE TABLE IF NOT EXISTS mensajes_pedidos (
  id SERIAL PRIMARY KEY,
  negocio_id INTEGER,
  tipo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  CONSTRAINT fk_negocio_mensajes_pedidos FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

-- Crear tabla pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  negocio_id INTEGER,
  numero_cliente TEXT NOT NULL,
  items TEXT NOT NULL,
  estado TEXT DEFAULT 'recibido',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_negocio_pedidos FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);