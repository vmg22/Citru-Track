const express = require('express');
const router = express.Router();
const {
  getBinsConFiltros,
  getProcesosPorProducto,
  getHistorialProcesoBin,
  registrarProcesoBin,
  getProductosConVariedades,
  getEstadisticasProceso,getCamposClasificacion,
  getBinsPendientesLote,
  crearLoteDesdeBins,
  getLotesCreados,
  getDetalleLote
} = require('../controllers/procesoController');

// Middleware de autenticación (descomentar cuando lo implementes)
// const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/proceso/productos
 * @desc    Obtener productos con sus variedades (para filtros)
 * @access  Private
 */
router.get('/productos', getProductosConVariedades);

/**
 * @route   GET /api/proceso/bins
 * @desc    Obtener bins con filtros
 * @access  Private
 * @query   ?producto_id=1&variedad_id=2&estado=recepcionado
 */
router.get('/bins', getBinsConFiltros);

/**
 * @route   GET /api/proceso/productos/:productoId/procesos
 * @desc    Obtener procesos configurados para un producto
 * @access  Private
 */
router.get('/productos/:productoId/procesos', getProcesosPorProducto);

/**
 * @route   GET /api/proceso/bins/:binId/historial
 * @desc    Obtener historial de procesos de un bin específico
 * @access  Private
 */
router.get('/bins/:binId/historial', getHistorialProcesoBin);

/**
 * @route   POST /api/proceso/bins/:binId/registrar
 * @desc    Registrar un proceso para un bin
 * @access  Private
 * @body    { proceso_id, operario, temperatura, peso_entrada, peso_salida, calibre, observaciones }
 */
router.post('/bins/:binId/registrar', registrarProcesoBin);

/**
 * @route   GET /api/proceso/estadisticas
 * @desc    Obtener estadísticas de la línea de proceso
 * @access  Private
 */
router.get('/estadisticas', getEstadisticasProceso);

router.get('/productos/:productoId/campos-clasificacion', getCamposClasificacion);
router.post('/bins/:binId/registrar', registrarProcesoBin); // Ya existía, pero ahora soporta JSON y cierre
router.get('/bins-pendientes-lote', getBinsPendientesLote);
router.post('/crear-lote', crearLoteDesdeBins);

router.get('/lotes-creados', getLotesCreados);
router.get('/lotes/:loteId/detalle', getDetalleLote);

module.exports = router;