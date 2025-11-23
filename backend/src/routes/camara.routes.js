const express = require('express');
const { getCamaras, updateCamara, createCamara, eliminarCamara } = require('../controllers/camaraController');
const router = express.Router();

router.get('/', getCamaras);
router.post("/", createCamara)
router.patch("/:id", updateCamara)
router.put("/:id", eliminarCamara)

module.exports = router;