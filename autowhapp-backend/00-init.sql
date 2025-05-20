-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'autowhapp_user') THEN
      CREATE USER autowhapp_user WITH PASSWORD 'tu_contraseña_segura';
   END IF;
END
$do$;

-- Create database
CREATE DATABASE autowhapp;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE autowhapp TO autowhapp_user;

-- Connect to the new database
\c autowhapp

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO autowhapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autowhapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autowhapp_user; 