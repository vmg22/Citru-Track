const express = require('express');
const { getChoferes } = require('../controllers/choferController');
const router = express.Router();

router.get('/', getChoferes);


module.exports = router;