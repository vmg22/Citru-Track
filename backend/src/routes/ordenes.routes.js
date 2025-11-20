const express = require("express");
const router = express.Router();
const controller = require("../controllers/ordenesController");

router.get("/", controller.getAllOrdenes);
router.get("/kpis/resumen", controller.getKPIs);

module.exports = router;
