const express = require("express");
const router = express.Router();
const controller = require("../controllers/choferesController");

router.get("/", controller.getAllChoferes);
router.get("/:id", controller.getChoferById);

module.exports = router;
