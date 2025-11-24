const express = require("express");
const router = express.Router();
const trackingController = require("../controllers/tracking.controller");

// GET /api/tracking/live -> Devuelve todos los camiones activos
router.get("/live", trackingController.getFlotaActiva);

module.exports = router;