// routes/kpi.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/kpiController");

// Volumen ingresado
router.get("/volume", ctrl.getVolume);

// Rendimiento de lotes
router.get("/rendimiento", ctrl.getRendimientoPorLote);

// Eficiencia de empaque
router.get("/empaque", ctrl.getEficienciaEmpaque);

// Rotación de cámaras
router.get("/camaras", ctrl.getCamarasKPIs);

// Despacho / logística
router.get("/despacho", ctrl.getDespachoKPIs);

// Movimientos de pallets
router.get("/movimientos", ctrl.getMovimientosKPIs);

// Auditoría
router.get("/auditoria", ctrl.getAuditKPIs);

// Productos list (para dropdown)
router.get("/productos", ctrl.getProductos);

module.exports = router;
