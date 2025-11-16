const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productosController');
const auth = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

router.get('/', auth, ctrl.list);
router.get('/:id', auth, ctrl.getOne);
router.post('/', auth, permitirRoles('admin','supervisor'), ctrl.create);

module.exports = router;
