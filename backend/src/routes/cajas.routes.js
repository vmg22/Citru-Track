const express = require("express");
const router = express.Router();
const {
  ingresarCaja,
  obtenerCajasRecientes,
} = require("../controllers/cajasController");

// Registrar una caja escaneada
router.post("/ingresar", ingresarCaja);

// Obtener cajas recientes
router.get("/recientes", obtenerCajasRecientes);

module.exports = router;
