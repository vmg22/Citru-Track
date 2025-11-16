const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/palletsController');
const auth = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

router.post('/', ctrl.createPallet);
router.post('/:id/asignar-caja', permitirRoles('operario_empaque','supervisor','admin'), ctrl.assignCaja);

module.exports = router;
