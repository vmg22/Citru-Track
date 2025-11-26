const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/palletsController');
const qrCtrl = require('../controllers/qrController');
const auth = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

// Rutas para obtener cajas disponibles y crear pallets
router.get('/cajas-disponibles', ctrl.getCajasDisponibles);
router.post('/crear-con-cajas', permitirRoles('operario_empaque','supervisor','admin'), ctrl.crearPalletConCajas);

// Ruta para obtener detalle de un pallet
router.get('/:id', ctrl.getPalletById);

// Ruta para generar QR de un pallet
router.get('/:id/qr', qrCtrl.generarQRPallet);

// Rutas antiguas (mantener por compatibilidad)
router.get('/', ctrl.getPalletsByFilter); 
router.post('/', permitirRoles('operario_empaque','supervisor','admin'), ctrl.createPallet);
router.post('/:id/asignar-caja', permitirRoles('operario_empaque','supervisor','admin'), ctrl.assignCaja);

module.exports = router;
