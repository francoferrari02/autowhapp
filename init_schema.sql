-- Create user and database
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'autowhapp_user') THEN
      CREATE USER autowhapp_user WITH PASSWORD 'Autowhapp123';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE autowhapp TO autowhapp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autowhapp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO autowhapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autowhapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autowhapp_user;

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla negocios
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
  modulo_analiticas INTEGER DEFAULT 0,  -- Agregado para el módulo de analíticas
  modulo_pagos INTEGER DEFAULT 0,       -- Agregado para el módulo de pagos
  plan TEXT DEFAULT 'Plan Servicios',   -- Nuevo campo para el plan
  appointment_duration INTEGER DEFAULT 60,
  break_between INTEGER DEFAULT 0,
  hora_inicio_default TEXT DEFAULT '09:00',
  hora_fin_default TEXT DEFAULT '18:00',
  user_id INTEGER NOT NULL REFERENCES users(id),
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

-- Crear tabla contactos_negocio
CREATE TABLE IF NOT EXISTS contactos_negocio (
  id SERIAL PRIMARY KEY,
  negocio_id INTEGER NOT NULL,
  contact_id TEXT NOT NULL, -- WhatsApp contact ID, e.g., '5491123456789@c.us'
  nombre TEXT, -- Nombre del contacto para referencia
  responder BOOLEAN DEFAULT FALSE, -- TRUE para responder, FALSE para ignorar
  CONSTRAINT fk_negocio_contactos FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  UNIQUE (negocio_id, contact_id) -- Evita duplicados por negocio y contacto
);

-- Crear tabla carpetas_contactos
CREATE TABLE IF NOT EXISTS carpetas_contactos (
  id SERIAL PRIMARY KEY,
  negocio_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  contactos TEXT[] DEFAULT '{}', -- Array de contact_ids, inicializado como array vacío
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_negocio_carpetas FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

-- Crear índice único para evitar duplicados de nombres de carpeta por negocio
CREATE UNIQUE INDEX IF NOT EXISTS idx_carpetas_contactos_negocio_nombre 
ON carpetas_contactos (negocio_id, nombre);

-- Crear tabla recordatorios
CREATE TABLE IF NOT EXISTS recordatorios (
  id SERIAL PRIMARY KEY,
  negocio_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  frequency TEXT NOT NULL,
  time TEXT NOT NULL,
  day TEXT,
  activo INTEGER DEFAULT 1,
  last_sent TIMESTAMP,
  carpeta_id INTEGER, -- Referencias a carpetas_contactos
  contactos TEXT[], -- Array de contact_ids para contactos individuales
  CONSTRAINT fk_negocio_recordatorios FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  CONSTRAINT fk_carpeta_recordatorios FOREIGN KEY (carpeta_id) REFERENCES carpetas_contactos(id) ON DELETE SET NULL
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
  CONSTRAINT fk_negocio_mensajes_pedidos FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  UNIQUE (negocio_id, tipo) -- Evita duplicados por negocio y tipo de mensaje
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

