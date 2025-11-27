// const express = require('express');
// const router = express.Router();
// const ctrl = require('../controllers/palletsController');
// const auth = require('../middleware/auth');
// const { permitirRoles } = require('../middleware/roles');


router.get('/', ctrl.getPalletsByFilter); 
router.post('/', permitirRoles('operario_empaque','supervisor','admin'), ctrl.createPallet);
router.post('/:id/asignar-caja', permitirRoles('operario_empaque','supervisor','admin'), ctrl.assignCaja);

// module.exports = router;
