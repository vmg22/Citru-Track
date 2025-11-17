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
router.post('/login', loginRateLimiter, authController.login);

// Rutas protegidas (requieren token)
router.get('/me',authenticateToken, checkTokenBlacklist, authController.me);
router.post('/logout',authenticateToken, checkTokenBlacklist, authController.logout);

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const controladorAuth = require('./auth.controller');
// const { 
//   authenticateToken, 
//   authorizeRoles,
//   loginRateLimiter,
//   passwordResetRateLimiter,
//   checkTokenBlacklist
// } = require('../../middleware/auth.middleware');

// // ==================== RUTAS PÚBLICAS ====================

// /**
//  * POST /api/auth/login
//  * Login con email y contraseña
//  * Rate limited: 5 intentos / 15 minutos
//  * 
//  * Body: { email_usuario, password }
//  * Response: { token, usuario: { id_usuario, username, email_usuario, rol, estado, ultimo_login } }
//  */
// router.post('/login', loginRateLimiter, controladorAuth.login);

// /**
//  * POST /api/auth/register
//  * Registro de nuevo usuario
//  * 
//  * Body: { username, password, email_usuario, rol }
//  * Response: { token, usuario }
//  */
// router.post('/register', controladorAuth.register);

// /**
//  * POST /api/auth/solicitar-reset
//  * Solicita recuperación de contraseña por email
//  * Rate limited: 3 intentos / 15 minutos
//  * 
//  * Body: { email_usuario }
//  * Response: Mensaje genérico de confirmación
//  */
// router.post('/solicitar-reset', passwordResetRateLimiter, controladorAuth.solicitarReset);

// /**
//  * GET /api/auth/validar-token-reset/:token
//  * Valida si un token de recuperación es válido
//  * 
//  * Params: { token }
//  * Response: { valid: true, email }
//  */
// router.get('/validar-token-reset/:token', controladorAuth.validarTokenReset);

// /**
//  * POST /api/auth/reset-password
//  * Cambia la contraseña usando token de recuperación
//  * 
//  * Body: { token, newPassword }
//  * Response: Mensaje de confirmación
//  */
// router.post('/reset-password', controladorAuth.resetPassword);

// // ==================== RUTAS PROTEGIDAS ====================
// // Todas requieren authenticateToken y checkTokenBlacklist

// /**
//  * POST /api/auth/logout
//  * Cierra la sesión del usuario autenticado (invalida el token)
//  * Requiere: Token JWT válido
//  * 
//  * Headers: { Authorization: "Bearer <token>" }
//  * Response: Mensaje de confirmación
//  */
// router.post('/logout', authenticateToken, checkTokenBlacklist, controladorAuth.logout);

// /**
//  * GET /api/auth/perfil
//  * Obtiene el perfil del usuario autenticado
//  * Requiere: Token JWT válido
//  * 
//  * Headers: { Authorization: "Bearer <token>" }
//  * Response: { usuario }
//  */
// router.get('/perfil', authenticateToken, checkTokenBlacklist, controladorAuth.obtenerPerfil);

// /**
//  * PATCH /api/auth/perfil
//  * Actualiza el perfil del usuario autenticado
//  * Requiere: Token JWT válido
//  * 
//  * Headers: { Authorization: "Bearer <token>" }
//  * Body: Campos a actualizar (username, email_usuario, etc.)
//  * Response: { usuario actualizado }
//  */
// router.patch('/perfil', authenticateToken, checkTokenBlacklist, controladorAuth.actualizarPerfil);

// /**
//  * POST /api/auth/cambiar-password
//  * Cambia la contraseña del usuario autenticado (requiere contraseña actual)
//  * Requiere: Token JWT válido
//  * 
//  * Headers: { Authorization: "Bearer <token>" }
//  * Body: { currentPassword, newPassword }
//  * Response: Mensaje de confirmación (invalida el token actual)
//  */
// router.post('/cambiar-password', authenticateToken, checkTokenBlacklist, controladorAuth.cambiarPasswordAutenticado);

// /**
//  * GET /api/auth/verificar
//  * Verifica si el token actual es válido
//  * Requiere: Token JWT válido
//  * 
//  * Headers: { Authorization: "Bearer <token>" }
//  * Response: { usuario: { id, username, email, rol } }
//  */
// router.get('/verificar', authenticateToken, checkTokenBlacklist, controladorAuth.verificarToken);

// module.exports = router;