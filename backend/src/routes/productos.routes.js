const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productosController');
const auth = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

router.get('/', ctrl.list);
router.get('/all-with-varieties', ctrl.listProductsWithVarieties);
router.get('/:id', ctrl.getOne);

router.post('/', ctrl.create);
router.post('/variedad', ctrl.crearVariedad);
router.put("/:id", ctrl.editarProducto)
router.put("/:id/eliminar", ctrl.eliminarProducto)

module.exports = router;
