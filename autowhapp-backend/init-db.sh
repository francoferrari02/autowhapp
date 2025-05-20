#!/bin/bash
set -e

echo "Starting database initialization..."

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER" -h localhost; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 1
done

echo "PostgreSQL is ready. Creating user and database..."

# Create user and database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOF
DO
\$do\$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles
        WHERE  rolname = 'autowhapp_user'
    ) THEN
        CREATE USER autowhapp_user WITH PASSWORD 'tu_contraseña_segura';
    END IF;
END
\$do\$;

SELECT 'CREATE DATABASE autowhapp'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'autowhapp');

GRANT ALL PRIVILEGES ON DATABASE autowhapp TO autowhapp_user;
EOF

echo "User and database created. Setting up schema..."

# Connect to the new database and set up schema
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "autowhapp" <<EOF
GRANT ALL ON SCHEMA public TO autowhapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autowhapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autowhapp_user;
EOF

echo "Database initialization completed successfully." 