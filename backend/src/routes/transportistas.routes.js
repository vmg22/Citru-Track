const express = require("express");
const router = express.Router();
const controller = require("../controllers/transportistasController");

router.get("/", controller.getAllTransportistas);
router.get("/:id", controller.getTransportistaById);
router.post("/", controller.createTransportista);
router.put("/:id", controller.updateTransportista);

module.exports = router;
