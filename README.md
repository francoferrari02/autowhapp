# AutoWhapp

AutoWhapp es un proyecto que implementa un chatbot automatizado para WhatsApp, con un dashboard en React para configurarlo y un backend en n8n para manejar flujos de trabajo. Este repositorio contiene tanto el frontend (`autowhapp-dashboard`) como el backend (`autowhapp-backend`).

## Estructura 

- **`autowhapp-dashboard/`**: Frontend del proyecto, un dashboard en React con TypeScript para configurar las FAQs del chatbot.
- **`autowhapp-backend/`**: Backend del proyecto, implementado con n8n para manejar flujos de trabajo, como procesar FAQs y enviar mensajes a WhatsApp.

## Requisitos

- **Node.js** (versión 18 o superior) y **npm** para el frontend.
- **Docker** para correr n8n en el backend.
- **Git** para clonar el repositorio.

## Instalación
### Frontend
- Ve a `autowhapp-dashboard/`
- Corre: `yarn start`

### Backend
- Ve a `autowhapp-backend/`
- Instalar dependencias: `npm install`
- Correr Ngrok: `ngrok http 5678`
- Cada vez que se inicie ngrok, se generara un nuevo URL, se debe actualizar en `autowhapp-backend/whatsapp/client.js` cambiando el valor de `webhookUrl`, deberia quedar algo asi `const webhookUrl = 'https://NUEVO_URL_DE_NGROK/webhook/procesar-mensaje';`
- Correr backend de WhatsApp: `node index.js` y escanear el QR vinculandolo en WSP
- Corre n8n: `docker run -it --rm --name n8n -p 5678:5678 -v $(pwd)/n8n-workflows:/home/node/.n8n -e WEBHOOK_URL=TU_URL_DE_NGROK -e N8N_TRUST_PROXY=true -e N8N_LOG_LEVEL=debug n8nio/n8n:1.86.1`, cambiar de este comando donde dice "TU_URL_DE_NGROK" por la url que te da Ngrok
- Abre `http://localhost:5678` para configurar los flujos.
- Confirmar que el webhook de n8n tiene el URL antes puesto en uno de los pasos anteriores, si no es el mismo, copiar el que aparece en n8n y cambiar la variable por esa
- El bot esta configurado para responder solamente en un chat que se llama "Prueba facultad", crear un grupo con otro numero para poder mandar mensaje a ese grupo y que el bot conteste

### corriendolos juntos
- Ve a `autowhapp-backend/`
- Correr Ngrok: `ngrok http 5678`
- Cada vez que se inicie ngrok, se generara un nuevo URL, se debe actualizar en `autowhapp-backend/whatsapp/client.js` cambiando el valor de `webhookUrl`, deberia quedar algo asi `const webhookUrl = 'https://NUEVO_URL_DE_NGROK/webhook/procesar-mensaje';`
- correr node `index.js`
- despues se corre el front en `autowhapp-dashboard/` con `yarn start`
- te deberia ofrecer de correr el dashboard en el puerto 3001




