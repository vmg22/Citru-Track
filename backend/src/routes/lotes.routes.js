const express = require('express');
const router = express.Router();
const {
  createLote,
  getAllLotes,
  getLoteById,
  updateLote,
  deleteLote,
  getLotesPorProducto,
  getSublotesPorLote
} = require('../controllers/lotesController');

// IMPORTANTE: Las rutas más específicas PRIMERO
// Nuevas rutas para filtros - DEBEN IR ANTES DE /:id
router.get('/por-producto/:productoId', getLotesPorProducto);

// Rutas existentes
router.post('/', createLote);
router.get('/', getAllLotes);
router.get('/:id', getLoteById);
router.put('/:id', updateLote);
router.delete('/:id', deleteLote);

// Sublotes - debe ir después de otras rutas específicas
router.get('/:loteId/sublotes', getSublotesPorLote);

module.exports = router;