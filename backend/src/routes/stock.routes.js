const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const palletController = require('../controllers/palletsController'); 
const palletCreationController = require('../controllers/creacionPalletController');
const movementController = require('../controllers/movimientoController');

// =========================================================
// RUTAS DE ESCRITURA (Transaccionales)
// **USAR estas rutas para crear y mover pallets y asegurar integridad**
// =========================================================

// POST /pallets/armar
// Crea un nuevo pallet y asocia las cajas (Transaccional)
router.post('/pallets/armar', palletCreationController.armarPallet);

// PUT /pallets/:pallet_id/mover
// Mueve un pallet a un nuevo estado/cámara y sincroniza las cajas (Transaccional)
router.put('/pallets/:pallet_id/mover', movementController.moverPallet);


// =========================================================
// RUTAS DE LECTURA DE DETALLE (GET /pallets)
// =========================================================

// GET /pallets?productoId=X&estado=Y 
// Obtener pallets detallados con conteo de cajas dinámico
router.get('/pallets', palletController.getPalletsByFilter); 


// =========================================================
// RUTAS DE STOCK (Lectura de Resumen/Agregación)
// =========================================================

// GET /stock/resumen
router.get('/stock/resumen', stockController.getResumenStock);

// GET /stock/estado/:estado
router.get('/stock/estado/:estado', stockController.getStockPorEstado);

// GET /stock/producto/:producto_id
router.get('/stock/producto/:producto_id', stockController.getStockPorProducto);

// GET /stock/alertas
router.get('/stock/alertas', stockController.getAlertasStock);

// GET /stock/historico
router.get('/stock/historico', stockController.getHistoricoStock);

// GET /stock (Obtener todos los pallets con filtros opcionales)
router.get('/stock', stockController.getStockData);


module.exports = router;