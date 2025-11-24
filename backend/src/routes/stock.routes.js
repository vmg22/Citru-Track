const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');




//     GET /api/stock/resumen
//     Obtener resumen agregado de stock
//     producto_id, fecha_desde, fecha_hasta
//      Private

router.get('/resumen', stockController.getResumenStock);


//   GET /api/stock/estado/:estado
//   Obtener stock filtrado por estado específico
//   estado (armado, en_camara, reservado, en_transporte, despachado, anulado)
//   producto_id
//   Private

router.get('/estado/:estado', stockController.getStockPorEstado);


//   GET /api/stock/producto/:producto_id
//   Obtener stock de un producto específico
//   producto_id
//   estado, fecha_desde, fecha_hasta
//   Private

router.get('/producto/:producto_id', stockController.getStockPorProducto);

//    GET /api/stock/alertas
//   Obtener alertas de productos con stock bajo
//   Private

router.get('/alertas', stockController.getAlertasStock);


//    GET /api/stock/historico
//    Obtener histórico de movimientos de stock
//    producto_id, dias (default: 30)
//    Private

router.get('/historico', stockController.getHistoricoStock);

//    Obtener todos los pallets con filtros opcionales
//    producto_id, fecha_desde, fecha_hasta
//    Private (agregar middleware de auth si es necesario)
 
router.get('/', stockController.getStockData);


module.exports = router;