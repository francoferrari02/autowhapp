const mercadopago = require('./config');
const { Preference } = require('mercadopago');

const preference = new Preference(mercadopago); 

async function createPaymentPreference({ title, price, quantity = 1, backUrls }) {
  const payload = {
    items: [{
      title,
      unit_price: Number(price),
      quantity: Number(quantity)
    }],
    back_urls: backUrls || {
      success: 'https://tubot.com/gracias',
      failure: 'https://tubot.com/error',
      pending: 'https://tubot.com/pendiente'
    },
    auto_return: 'approved'
  };

  try {
    const response = await preference.create({ body: payload });
    return response.init_point;
  } catch (error) {
    throw new Error('Error al crear la preferencia de pago: ' + error.message);
  }
}

module.exports = {
  createPaymentPreference
};
