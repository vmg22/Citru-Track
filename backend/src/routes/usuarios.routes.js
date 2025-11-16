const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuariosController');
const auth = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

router.get('/', auth, permitirRoles('admin'), ctrl.list);
router.post('/', auth, permitirRoles('admin'), ctrl.create);

module.exports = router;
