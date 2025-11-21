const express = require("express");
const router = express.Router();
const controller = require("../controllers/camionesController");

router.get("/", controller.getAllCamiones);
router.get("/:id", controller.getCamionById);
router.post("/", controller.createCamion);
router.put("/:id", controller.updateCamion);
router.delete("/:id", controller.deleteCamion);

module.exports = router;
