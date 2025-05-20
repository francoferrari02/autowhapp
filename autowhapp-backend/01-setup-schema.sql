-- Grant schema privileges
GRANT ALL ON SCHEMA public TO autowhapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autowhapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autowhapp_user; 