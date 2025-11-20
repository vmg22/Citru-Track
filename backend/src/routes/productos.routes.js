const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productosController');
const auth = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

router.get('/', ctrl.list);
router.get('/all-with-varieties', ctrl.listProductsWithVarieties);
router.get('/:id', ctrl.getOne);

router.post('/', permitirRoles('admin','supervisor'), ctrl.create);

module.exports = router;
