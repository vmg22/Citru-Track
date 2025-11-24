const express = require('express');
const router = express.Router();
const {
  getBinsDisponibles,
  getBinsPendientesAprobar,
  aprobarBin,
  crearLoteMaestro,
  agregarBinsALote,
  getLotesMaestros,
  getDetalleLoteMaestro,
  cerrarLoteMaestro,
  quitarBinDeLote
} = require('../controllers/loteMaestroController');

// Middleware de autenticación (descomentar cuando lo implementes)
// const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/lotes-maestros/bins-disponibles
 * @desc    Obtener bins aprobados disponibles para agrupar en lote
 * @access  Private
 * @query   ?producto_id=1&variedad_id=2&calibre=88
 */
router.get('/bins-disponibles', getBinsDisponibles);

/**
 * @route   GET /api/lotes-maestros/bins-pendientes
 * @desc    Obtener bins pendientes de aprobar
 * @access  Private
 * @query   ?producto_id=1&variedad_id=2
 */
router.get('/bins-pendientes', getBinsPendientesAprobar);

/**
 * @route   POST /api/lotes-maestros/bins/:binId/aprobar
 * @desc    Aprobar un bin y asignar calibre
 * @access  Private
 * @body    { calibre: "88" }
 */
router.post('/bins/:binId/aprobar', aprobarBin);

/**
 * @route   GET /api/lotes-maestros
 * @desc    Obtener todos los lotes maestros
 * @access  Private
 * @query   ?producto_id=1&variedad_id=2&calibre=88&estado=abierto
 */
router.get('/', getLotesMaestros);

/**
 * @route   POST /api/lotes-maestros
 * @desc    Crear un nuevo lote maestro
 * @access  Private
 * @body    { producto_id, variedad_id, calibre, descripcion, responsable }
 */
router.post('/', crearLoteMaestro);

/**
 * @route   GET /api/lotes-maestros/:loteId
 * @desc    Obtener detalle de un lote maestro con sus bins
 * @access  Private
 */
router.get('/:loteId', getDetalleLoteMaestro);

/**
 * @route   POST /api/lotes-maestros/:loteId/bins
 * @desc    Agregar bins a un lote maestro
 * @access  Private
 * @body    { bins: ["BIN-001", "BIN-002", "BIN-003"] }
 */
router.post('/:loteId/bins', agregarBinsALote);

/**
 * @route   PUT /api/lotes-maestros/:loteId/cerrar
 * @desc    Cerrar un lote maestro (no se pueden agregar más bins)
 * @access  Private
 */
router.put('/:loteId/cerrar', cerrarLoteMaestro);

/**
 * @route   DELETE /api/lotes-maestros/:loteId/bins/:binId
 * @desc    Quitar un bin de un lote maestro (solo si no está cerrado)
 * @access  Private
 */
router.delete('/:loteId/bins/:binId', quitarBinDeLote);

module.exports = router;