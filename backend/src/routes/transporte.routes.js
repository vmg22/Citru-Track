const express = require('express');
const router = express.Router();
const { 
  createTransportista, 
  createCamion, 
  registrarTrackingEvento, 
  getTransportistas,
  actualizarTransportista,
  eliminarTransportista
} = require('../controllers/transporteController');

// Rutas para transportistas
router.get('/', getTransportistas);
router.post('/', createTransportista);
router.patch('/:id', actualizarTransportista); 
router.put('/:id', eliminarTransportista); 
router.post('/camiones', createCamion);
router.post('/tracking/evento', registrarTrackingEvento);

module.exports = router;