#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q'; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

>&2 echo "PostgreSQL is up - executing schema"

# Execute the schema
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /usr/src/app/init_schema.sql

>&2 echo "Schema executed successfully" 