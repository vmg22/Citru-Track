const express = require('express');
const router = express.Router();
const {
  createLote,
  getAllLotes,
  getLoteById,
  updateLote,
  deleteLote
} = require('../controllers/lotesController');

// Ruta para obtener todos los sublotes (DEBE estar ANTES de /:id)
router.get('/sublotes/all', async (req, res) => {
  try {
    console.log('📦 Solicitud GET /api/lotes/sublotes/all');
    const db = require('../config/db');
    
    const sql = `
      SELECT 
        s.sublote_id,
        s.lote_id,
        s.calibre,
        s.cantidad_cajas,
        s.porcentaje_descartes,
        s.notas,
        s.created_at,
        l.descripcion as lote_descripcion
      FROM sublotes s
      LEFT JOIN lotes l ON s.lote_id = l.lote_id
      ORDER BY s.sublote_id DESC
    `;
    
    const [sublotes] = await db.query(sql);
    console.log(`✅ Sublotes obtenidos: ${sublotes.length} registros`);
    
    res.status(200).json(sublotes);
  } catch (error) {
    console.error('❌ Error al obtener sublotes:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: "Error al obtener sublotes", 
      error: error.message 
    });
  }
});

// Rutas para lotes (las específicas primero, luego las dinámicas)
router.post('/', createLote);
router.get('/', getAllLotes);
router.get('/:id', getLoteById);
router.put('/:id', updateLote);
router.delete('/:id', deleteLote);

module.exports = router;