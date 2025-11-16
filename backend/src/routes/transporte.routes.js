const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transporteController');
const auth = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

router.post('/transportistas', auth, permitirRoles('logistica_transporte','admin'), ctrl.createTransportista);
router.post('/camiones', auth, permitirRoles('logistica_transporte','admin'), ctrl.createCamion);

module.exports = router;
