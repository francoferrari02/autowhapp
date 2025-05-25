# AutoWhapp

AutoWhapp es un proyecto que implementa un chatbot automatizado para WhatsApp, con un dashboard en React para configurarlo y un backend en n8n para manejar flujos de trabajo. Este repositorio contiene tanto el frontend (`autowhapp-dashboard`) como el backend (`autowhapp-backend`).

## Estructura

- `autowhapp-dashboard/`: Frontend del proyecto, un dashboard en React con TypeScript para configurar el chatbot.
- `autowhapp-backend/`: Backend del proyecto, implementado con n8n para manejar flujos de trabajo, como procesar y enviar mensajes a WhatsApp.

## Requisitos

- **Node.js** (versión 18 o superior) y **npm** para el frontend.
- **Docker** para correr n8n en el backend.
- **Git** para clonar el repositorio.
- **PostgreSQL** para la base de datos.

## Instalación

### Configuración de la Base de Datos

1. Asegúrate de que PostgreSQL esté instalado y en ejecución en tu máquina.

2. Ejecuta el script `init_schema.sql` como superusuario (por ejemplo, `postgres`) para configurar la base de datos y el usuario:

   ```bash
   psql -U postgres -f init_schema.sql
   ```

   Este script:

   - Crea el usuario `autowhapp_user` con contraseña `Autowhapp123`.
   - Crea la base de datos `autowhapp`.
   - Otorga los permisos necesarios a `autowhapp_user`.
   - Configura todas las tablas requeridas.

3. Verifica que la base de datos sea accesible con las siguientes credenciales:

   - Usuario: `autowhapp_user`
   - Contraseña: `Autowhapp123`
   - Host: `localhost`
   - Base de datos: `autowhapp`
   - Puerto: `5432`

### Configuración del Backend

1. Navega a `autowhapp-backend/`.

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Inicia Ngrok para exponer el backend:

   ```bash
   ngrok http 5678
   ```

4. Actualiza el valor de `webhookUrl` en `autowhapp-backend/whatsapp/client.js` con la URL de Ngrok, por ejemplo:

   ```javascript
   const webhookUrl = 'https://TU_URL_DE_NGROK/webhook/procesar-mensaje';
   ```

5. Ejecuta el backend de WhatsApp y escanea el código QR para vincularlo:

   ```bash
   node index.js
   ```

6. Ejecuta n8n en Docker:

   ```bash
   docker run -it --rm --name n8n -p 5678:5678 -v $(pwd)/n8n-workflows:/home/node/.n8n -e WEBHOOK_URL=TU_URL_DE_NGROK -e N8N_TRUST_PROXY=true -e N8N_LOG_LEVEL=debug n8nio/n8n:1.86.1
   ```

7. Abre `http://localhost:5678` para configurar los flujos de trabajo, asegurándote de que la URL del webhook coincida con la de Ngrok.

### Configuración del Frontend

1. Navega a `autowhapp-dashboard/`.

2. Instala las dependencias:

   ```bash
   yarn install
   ```

3. Inicia el dashboard:

   ```bash
   yarn start
   ```

   - El puerto 3000 va a estar en uso por el backend, predeterminadamente debería sugerir correr en el 3001, es donde debe correr.

## Notas

- El bot está configurado para responder solo en un chat llamado "Prueba facultad". Crea un grupo con este nombre y otro número para probarlo.
- Asegúrate de que `autowhapp_user` tenga todos los permisos en la base de datos `autowhapp` como se configura en `init_schema.sql`.

## Pruebas

- Para ejecutar pruebas de cada componente, asegúrate de que no haya registros (por ejemplo, recordatorios) en la base de datos.

- Desde el directorio raíz, ejecuta:

  ```bash
  npx playwright test --ui
  ```

- Selecciona las pruebas que deseas ejecutar.

## Ejecución con Docker Compose

El proyecto ahora está configurado para ejecutarse usando Docker Compose, lo que permite iniciar todos los servicios (backend, frontend, base de datos y n8n) con un solo comando. Sigue estos pasos para ejecutarlo:

### Requisitos

- **Docker**: Asegúrate de tener Docker instalado y en ejecución en tu máquina.
- **Docker Compose**: Verifica que Docker Compose esté disponible (generalmente viene incluido con Docker Desktop).

### Pasos para Ejecutar

1. **Navega al directorio del backend**:

   ```bash
   cd autowhapp-backend
   ```

2. **Construye e inicia los servicios**:

   ```bash
   docker-compose up --build -d
   ```

   - `--build`: Fuerza la reconstrucción de las imágenes si es necesario.
   - `-d`: Ejecuta los contenedores en segundo plano.

   Este comando construirá las imágenes del backend (`app`), frontend (`frontend`), base de datos (`db`), y n8n, y luego los iniciará. La base de datos PostgreSQL se iniciará en el puerto `5434` de tu máquina local.

3. **Verifica los servicios**:

   - **Backend**: Corre en `http://localhost:3000`.
   - **Frontend**: Corre en `http://localhost:3001`.
   - **n8n**: Accesible en `http://localhost:5678`.
   - **Base de datos**: Accesible en `localhost:5434` (ver más abajo).

4. **Detener los servicios**:

   Cuando hayas terminado, puedes detener todos los servicios y eliminar los volúmenes con:

   ```bash
   docker-compose down -v
   ```

   - `-v`: Elimina los volúmenes, incluyendo la base de datos, lo que borrará todos los datos almacenados.

### Acceso a la Base de Datos

La base de datos PostgreSQL se ejecuta dentro de un contenedor y está mapeada al puerto `5434` en tu máquina local (no al puerto predeterminado `5432`). Para conectarte a ella, usa las siguientes credenciales:

- **Host**: `localhost`
- **Puerto**: `5434`
- **Usuario**: `autowhapp_user`
- **Contraseña**: `Autowhapp123`
- **Base de datos**: `autowhapp`

#### Conexión con `psql`

Para conectarte a la base de datos usando `psql`, ejecuta:

```bash
psql -h localhost -p 5434 -U autowhapp_user -d autowhapp
```

Luego, podrás ejecutar consultas SQL, como:

```sql
SELECT * FROM negocios;
```

**Nota**: Si tienes una instancia local de PostgreSQL corriendo en `localhost:5432`, asegúrate de especificar el puerto `5434` para conectarte a la base de datos del contenedor.

#### Ver Logs de la Base de Datos

Si necesitas ver los logs de la base de datos para depurar, ejecuta:

```bash
docker-compose logs db
```

### Notas Adicionales

- **Volúmenes**: Los datos de la base de datos se almacenan en un volumen Docker (`postgres_data`), que persiste entre ejecuciones a menos que uses `docker-compose down -v`.
- **Reconstrucción**: Si realizas cambios en el código, puedes reconstruir las imágenes con `docker-compose up --build -d`.
- **Acceso a n8n**: Asegúrate de configurar correctamente los flujos de trabajo en `http://localhost:5678`, usando la URL de Ngrok si es necesario.

Esta configuración dockerizada simplifica la ejecución del proyecto, asegurando que todos los servicios se inicien correctamente y que la base de datos sea accesible de manera consistente.