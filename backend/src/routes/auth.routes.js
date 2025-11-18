const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { 
  authenticateToken, 
  authorizeRoles,
  loginRateLimiter,
  passwordResetRateLimiter,
  checkTokenBlacklist
} = require('../middleware/auth.middleware');


// Rutas públicas
router.post('/login', loginRateLimiter, authController.login);//Login con email y contraseña//POST /api/auth/login
router.post('/solicitar-reset', passwordResetRateLimiter, authController.solicitarReset);//Solicita recuperación de contraseña por email//POST /api/auth/solicitar-reset
router.get('/validar-token-reset/:token', authController.validarTokenReset);//Valida si un token de recuperación es válido//GET /api/auth/validar-token-reset/:token
router.post('/reset-password', passwordResetRateLimiter, authController.resetPasswordConToken);//Resetea la contraseña usando un token de recuperación//POST /api/auth/reset-password

// Rutas protegidas (requieren token)
router.get('/me',authenticateToken, checkTokenBlacklist, authController.me);//Obtiene el perfil del usuario autenticado//GET /api/auth/me
router.post('/logout',authenticateToken, checkTokenBlacklist, authController.logout);//Cierra la sesión del usuario autenticado (invalida el token)//POST /api/auth/logout
router.post('/cambiar-password', authenticateToken, checkTokenBlacklist, authController.cambiarPasswordAutenticado); //Cambia la contraseña del usuario autenticado (requiere contraseña actual)//POST /api/auth/cambiar-password





module.exports = router;

