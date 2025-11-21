const express = require('express');
const { getCamaras } = require('../controllers/camaraController');
const router = express.Router();

router.get('/', getCamaras);


module.exports = router;