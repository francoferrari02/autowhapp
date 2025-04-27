const { Client } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const db = require('../db'); // Agregado para la funcionalidad de identificar negocio

const client = new Client();

client.on('qr', (qr) => {
  console.log('Escaneá este código QR con el número del negocio:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Cliente de WhatsApp listo');
});

client.on('message', async (msg) => {
  const chat = await msg.getChat();
  console.log(`📩 Mensaje recibido: "${msg.body}" del chat "${chat.name}"`);

  if (chat.name !== 'Prueba facultad') {
    console.log(`🔕 Ignorando mensaje de otro chat: ${chat.name}`);
    return;
  }

  // Identificar negocio basado en el número del cliente
  const negocio = await identificarNegocio(msg.from);
  const contexto = negocio.contexto;
  const moduloPedidosActivo = 1;

  const webhookUrl = 'https://fe58-190-224-155-63.ngrok-free.app/webhook/procesar-mensaje'; // Modificar webhookUrl según sea necesario

  const payload = {
    mensaje: msg.body,
    contexto: contexto,
    numeroCliente: msg.from,
    negocioId: negocio.id,
    moduloPedidosActivo: moduloPedidosActivo
  };

  try {
    const res = await axios.post(webhookUrl, payload);
    console.log('📤 Valor de moduloPedidosActivo:', moduloPedidosActivo, 'Tipo:', typeof moduloPedidosActivo);
    console.log('📨 Respuesta de n8n:', res.data);

    const respuesta = res.data; 
    if (respuesta) {
      client.sendMessage(msg.from, respuesta);
    } else {
      client.sendMessage(msg.from, '⚠️ No recibí respuesta del servidor.');
    }

  } catch (err) {
    console.error('❌ Error al enviar a n8n:', err.response?.data || err.message || err);
    client.sendMessage(msg.from, 'Ocurrió un error, intentá de nuevo.');
  }
});

client.initialize();

// Función para identificar el negocio basado en el número del cliente
function identificarNegocio(numero) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM negocios WHERE numero_telefono = ?', [numero], (err, row) => {
      if (err) return reject(err);
      if (!row) {
        // Negocio no encontrado, usar un contexto por defecto
        resolve({
          id: 1,
          contexto: 'Eres el bot de asistencia de "Patitas Felices", una veterinaria ubicada en Rosario, Argentina...',
          modulo_pedidos: true
        });
      } else {
        resolve({
          id: row.id,
          contexto: row.contexto,
          modulo_pedidos: row.modulo_pedidos === 1
        });
      }
    });
  });
}

module.exports = client;