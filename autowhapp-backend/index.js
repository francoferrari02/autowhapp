const express = require('express');
const db = require('./db');
const whatsappClient = require('./whatsapp/client');

const app = express();
app.use(express.json());

// Endpoint para obtener la configuración del negocio
app.get('/negocio/:id', (req, res) => {
    const negocioId = req.params.id;
    db.get('SELECT * FROM negocios WHERE id = ?', [negocioId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Negocio no encontrado' });
        res.json({
            id: row.id,
            nombre: row.nombre,
            numero_telefono: row.numero_telefono,
            contexto: row.contexto,
            modulo_pedidos: row.modulo_pedidos === 1
        });
    });
});

// Endpoint para actualizar el estado del módulo de pedidos
app.post('/actualizar-modulo-pedidos', (req, res) => {
    const { negocioId, moduloPedidos } = req.body;
    db.run('UPDATE negocios SET modulo_pedidos = ? WHERE id = ?', [moduloPedidos ? 1 : 0, negocioId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Nuevo endpoint para registrar pedidos
app.post('/registrar-pedido', (req, res) => {
    const { negocioId, numeroCliente, producto, cantidad } = req.body;
    db.run('INSERT INTO pedidos (negocio_id, numero_cliente, producto, cantidad) VALUES (?, ?, ?, ?)',
        [negocioId, numeroCliente, producto, cantidad], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

app.listen(3000, () => {
    console.log('Backend corriendo en puerto 3000');
});