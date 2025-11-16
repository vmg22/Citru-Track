const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/palletsController');
const auth = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

router.post('/', auth, permitirRoles('operario_empaque','supervisor','admin'), ctrl.createPallet);
router.post('/:id/asignar-caja', auth, permitirRoles('operario_empaque','supervisor','admin'), ctrl.assignCaja);

module.exports = router;
