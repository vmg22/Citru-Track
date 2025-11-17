// 
// auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Usando el nuevo archivo adaptado
const { authMiddleware } = require('../middleware/auth.middleware'); // Middleware para proteger rutas

/**
 * Rutas de Autenticación
 * Prefijo base: /api/auth
 */

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// GET /api/auth/me - Obtener el perfil del usuario autenticado
router.get('/me', authController.me); 

module.exports = router;