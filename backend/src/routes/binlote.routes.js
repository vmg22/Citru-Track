const express = require('express');
const router = express.Router();
const { 
  getProductores, 
  getProductos, 
  validarRemito, 
  createBinYLote, 
  getBinsRecientes,
  getBinById 
} = require('../controllers/binloteController');


/**
 * @route   GET /api/bins/productores
 * @desc    Obtener lista de productores con sus fincas
 * @access  Private
 */
router.get('/productores', getProductores);

/**
 * @route   GET /api/bins/productos
 * @desc    Obtener lista de productos con sus variedades
 * @access  Private
 */
router.get('/productos', getProductos);

/**
 * @route   GET /api/bins/recientes
 * @desc    Obtener bins registrados recientemente
 * @access  Private
 * @query   ?limit=20 (opcional)
 */
router.get('/recientes', getBinsRecientes);

/**
 * @route   GET /api/bins/validar-remito/:remito
 * @desc    Validar si un número de remito ya existe
 * @access  Private
 */
router.get('/validar-remito/:remito', validarRemito);

/**
 * @route   GET /api/bins/:binId
 * @desc    Obtener detalles de un bin específico
 * @access  Private
 */
router.get('/:binId', getBinById);

/**
 * @route   POST /api/bins
 * @desc    Crear nuevo bin y generar lote automáticamente
 * @access  Private
 * @body    { producto_id, variedad_id, productor_id, finca_id, fecha_cosecha, peso_bruto, remito, observaciones }
 */
router.post('/', createBinYLote);

module.exports = router;