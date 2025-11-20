const db = require('../config/db');

async function getCamaras(req, res) {
    try {
        const [camaras] = await db.query(
            `SELECT * FROM camaras ORDER BY camara_id DESC
            `
        );
        
        res.json(camaras); 
    } catch (error) {
        console.error('Error al traer las camaras:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = {
    getCamaras
};