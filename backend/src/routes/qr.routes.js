const express = require('express');
const { generarQRPallet, generarQRCaja } = require('../controllers/qrController');
const router = express.Router();

// Importar el controller que contiene las funciones generarQRPallet y generarQRCaja

// --- Rutas para Generación de Códigos QR ---

/**
 * @route   GET /api/qr/pallets/:id
 * @desc    Genera el código QR para un Pallet específico (por su ID).
 * @access  Public
 * @query   ?format=png|svg|dataURL
 */
router.get('/pallets/:id', generarQRPallet);

// ----------------------------------------------------

/**
 * @route   GET /api/qr/cajas/:id
 * @desc    Genera el código QR para una Caja específica (por su ID).
 * @access  Public
 * @query   ?format=png|svg|dataURL
 */
router.get('/cajas/:id', generarQRCaja);


module.exports = router;