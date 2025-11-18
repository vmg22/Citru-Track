const express = require('express');
const router = express.Router();
const { 
  createTransportista, 
  createCamion, 
  registrarTrackingEvento 
} = require('../controllers/transporteController');

// Rutas para transportistas
router.post('/transportistas', createTransportista);
router.post('/camiones', createCamion);
router.post('/tracking/evento', registrarTrackingEvento);

module.exports = router;