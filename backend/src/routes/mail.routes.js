const express = require("express");
const router = express.Router();

const { TestMail } = require("../controllers/mailController");

// POST /api/mail/test - Enviar email de prueba
router.post("/test", TestMail);

module.exports = router;