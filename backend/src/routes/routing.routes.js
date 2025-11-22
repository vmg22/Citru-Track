const express = require('express');
const router = express.Router();
const routingController = require('../controllers/routingController');

/**
 * @route   GET /api/routing/calculate
 * @desc    Calcula ruta optimizada entre dos puntos
 * @query   start - Coordenadas de inicio (lat,lng)
 * @query   end - Coordenadas de destino (lat,lng)
 * @access  Public
 */
router.get('/calculate', routingController.calculateRoute);

/**
 * @route   GET /api/routing/calculate-multi
 * @desc    Calcula ruta optimizada con múltiples paradas
 * @query   waypoints - Coordenadas separadas por ; (lat1,lng1;lat2,lng2;...)
 * @access  Public
 */
router.get('/calculate-multi', routingController.calculateMultiStopRoute);

module.exports = router;
