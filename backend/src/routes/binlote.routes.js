const express = require('express');
const router = express.Router();
const { 
  getProductores, 
  getProductos, 
  validarRemito, 
  createBin,      
  getBinsRecientes,
  getBinById ,
  getEstadisticasBins
} = require('../controllers/binloteController');


router.get('/productores', getProductores);
router.get('/productos', getProductos);

router.get('/recientes', getBinsRecientes);
router.get('/validar-remito/:remito', validarRemito);


router.get('/estadisticas', getEstadisticasBins);  // Ruta para estadísticas de bins


router.get('/:binId', getBinById);


router.post('/', createBin); 





module.exports = router;