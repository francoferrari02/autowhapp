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
- Instala dependencias: `npm install`
- Corre: `npm start`

### Backend
- Ve a `autowhapp-backend/`
- Corre n8n: `docker run -it --rm --name n8n -p 5678:5678 -v $(pwd)/n8n-workflows:/home/node/.n8n n8nio/n8n`
- Abre `http://localhost:5678` para configurar los flujos.