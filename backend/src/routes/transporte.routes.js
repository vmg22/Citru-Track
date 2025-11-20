const express = require('express');
const router = express.Router();
const { 
  createTransportista, 
  createCamion, 
  registrarTrackingEvento, 
  getTransportistas
} = require('../controllers/transporteController');

// Rutas para transportistas
router.get('/', getTransportistas);
router.post('/transportistas', createTransportista);
router.post('/camiones', createCamion);
router.post('/tracking/evento', registrarTrackingEvento);

module.exports = router;