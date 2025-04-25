const { Client } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

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

  const webhookUrl = 'https://62fb-181-169-106-31.ngrok-free.app/webhook/procesar-mensaje'; // Modificar webhookUrl según sea necesario

  const payload = {
    mensaje: msg.body,
    numeroCliente: msg.from,
    negocioId: 1
  };

  try {
    const res = await axios.post(webhookUrl, payload);
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

module.exports = client;
