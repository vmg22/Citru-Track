const express = require("express");
const router = express.Router();
const {
  ingresarCaja,
  obtenerCajasRecientes,
} = require("../controllers/cajasController");
const qrController = require('../controllers/qrController');

// Registrar una caja escaneada
router.post("/ingresar", ingresarCaja);

// Obtener cajas recientes
router.get("/recientes", obtenerCajasRecientes);

// Generar código QR para una caja
router.get("/:caja_id/qr", qrController.generarQRCaja);

module.exports = router;
