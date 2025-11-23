const express = require('express');
const { getProductores, createProductor, updateProductor, eliminarProductor } = require('../controllers/productores');
const router = express.Router();

router.get('/', getProductores);
router.post('/', createProductor);
router.put('/:id', updateProductor);
router.patch('/:id', eliminarProductor);

module.exports = router;