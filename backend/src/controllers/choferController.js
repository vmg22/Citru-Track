const db = require('../config/db');

async function getChoferes(req, res) {
    try {
        const [choferes] = await db.query(
            `SELECT 
                c.*, 
                t.nombre AS nombre_transportista, 
                t.telefono AS telefono_transportista
            FROM 
                choferes c
            LEFT JOIN 
                transportistas t ON c.transportista_id = t.transportista_id
            ORDER BY chofer_id DESC
            `
        );
        
        res.json(choferes); 
    } catch (error) {
        console.error('Error al traer choferes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = {
    getChoferes
};