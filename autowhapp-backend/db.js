const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER, /* || 'autowhapp_user', */
  host: process.env.DB_HOST, /* || 'localhost', */
  database: process.env.DB_NAME /* || 'autowhapp' */,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT /* || 5432 */
});

pool.connect((err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos PostgreSQL');
  }
});

module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback),
  get: (text, params, callback) => pool.query(text, params, (err, res) => callback(err, res ? res.rows[0] : null)),
  all: (text, params, callback) => pool.query(text, params, (err, res) => callback(err, res ? res.rows : [])),
  run: (text, params, callback) => pool.query(text, params, (err, res) => callback(err, res))
};