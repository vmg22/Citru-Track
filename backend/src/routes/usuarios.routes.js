const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuariosController');
const auth = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

router.get('/', permitirRoles('admin'), ctrl.list);
router.post('/', permitirRoles('admin'), ctrl.create);

module.exports = router;
