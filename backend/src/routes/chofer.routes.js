const express = require('express');
const { getChoferes, createChofer, eliminarChofer, actualizarChofer } = require('../controllers/choferController');
const router = express.Router();

router.get('/', getChoferes);
router.post('/', createChofer); 
router.patch('/:id', actualizarChofer); 
router.put('/:id', eliminarChofer); 



module.exports = router;