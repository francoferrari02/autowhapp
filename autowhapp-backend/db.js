const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autowhapp.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS negocios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        numero_telefono TEXT UNIQUE,
        contexto TEXT,
        modulo_pedidos BOOLEAN DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        negocio_id INTEGER,
        numero_cliente TEXT,
        producto TEXT,
        cantidad INTEGER,
        estado TEXT DEFAULT 'Recibido',
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (negocio_id) REFERENCES negocios(id)
    )`);

    // Negocio de ejemplo
    db.run(`INSERT OR IGNORE INTO negocios (nombre, numero_telefono, contexto, modulo_pedidos) VALUES (?, ?, ?, ?)`,
        ['Patitas Felices', '541128704037', 'Eres el bot de asistencia de "Patitas Felices", una veterinaria ubicada en Rosario, Argentina...', 0]);
});

module.exports = db;