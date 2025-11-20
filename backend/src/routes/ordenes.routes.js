const express = require("express");
const router = express.Router();
const controller = require("../controllers/ordenesController");

router.get("/", controller.getAllOrdenes);
router.get("/kpis/resumen", controller.getKPIs);




router.get("/pedidos", controller.getPedidos);
router.post("/pedidos", controller.createPedido);
router.patch("/pedidos/:id", controller.updatePedido);
router.delete("/pedidos/:id", controller.deletePedido);
module.exports = router;
