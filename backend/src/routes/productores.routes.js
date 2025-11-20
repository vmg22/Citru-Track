const express = require('express');
const { getProductores } = require('../controllers/productores');
const router = express.Router();

router.get('/', getProductores);


module.exports = router;