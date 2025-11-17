const jwt = require('jsonwebtoken');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit'); 

/**
 * Middleware para verificar la validez de un token JWT en la cabecera de autorización.
 * Si el token es válido, añade la información del usuario decodificada a `req.user`.
 */
const authenticateToken = (req, res, next) => {
  // Obtenemos la cabecera 'Authorization', que debería tener el formato "Bearer TOKEN"
  const authHeader = req.headers['authorization'];
  // Extraemos el token, si la cabecera existe
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // 401 Unauthorized: El cliente no ha proporcionado un token.
    return res.status(401).json({ 
      exito: false,
      mensaje: 'Se requiere un token de autenticación para acceder a este recurso.',
      codigo: 'TOKEN_REQUERIDO'
    });
  }

  // Verificamos el token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // 403 Forbidden: El cliente proporcionó un token, pero es inválido o ha expirado.
      const mensaje = err.name === 'TokenExpiredError' 
        ? 'El token ha expirado. Por favor, inicie sesión nuevamente.'
        : 'Token inválido o corrupto.';
      
      return res.status(403).json({
        exito: false,
        mensaje,
        codigo: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRADO' : 'TOKEN_INVALIDO'
      });
    }
    
    // Si el token es válido, adjuntamos el payload del usuario al objeto de solicitud (req)
    req.user = user;
    
    // Continuamos con la siguiente función en la cadena de middlewares
    next();
  });
};

/**
 **
 * Middleware de fábrica para autorizar el acceso basado en roles de usuario.
 * Debe usarse SIEMPRE DESPUÉS de `authenticateToken`.
 * @param {...string|Array<string>} allowedRoles - Roles permitidos (puede ser array o argumentos)
 */
const authorizeRoles = (...allowedRoles) => {
  // Si se pasa un array como primer argumento, usarlo directamente
  const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;
  
  return (req, res, next) => {
    if (!req.user || !req.user.rol || !roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        exito: false,
        mensaje: `Acceso denegado. Se requiere uno de estos roles: ${roles.join(', ')}`,
        codigo: 'PERMISO_DENEGADO',
        rolesRequeridos: roles,
        rolActual: req.user?.rol || 'sin_rol'
      });
    }
    next();
  };
};
/**
 * Middleware opcional para verificar que el usuario esté accediendo a sus propios datos
 * o sea un admin.
 */
const authorizeSelfOrAdmin = (req, res, next) => {
  const userIdFromToken = req.user.id;
  const userIdFromParams = parseInt(req.params.id, 10);

  // Permitir si es el mismo usuario o si es admin
  if (userIdFromToken === userIdFromParams || req.user.rol === 'admin') {
    return next();
  }

  return res.status(403).json({
    exito: false,
    mensaje: 'Solo puedes acceder a tu propia información o ser administrador',
    codigo: 'ACCESO_PROPIO_DENEGADO'
  });
};

// ==================== RATE LIMITING ====================

/**
 * Rate limiter para login (prevenir ataques de fuerza bruta)
 * Máximo 5 intentos cada 15 minutos por IP
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos
  message: {
    exito: false,
    mensaje: 'Demasiados intentos de inicio de sesión. Por favor, intente más tarde.',
    codigo: 'RATE_LIMIT_EXCEDIDO'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Usar IP del cliente
    keyGenerator: ipKeyGenerator,
  
});

/**
 * Rate limiter para recuperación de contraseña
 * Máximo 3 intentos cada 15 minutos por IP
 */
// Limiter para recuperación de contraseña
const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    exito: false,
    mensaje: 'Demasiadas solicitudes de recuperación de contraseña. Por favor, intente más tarde.',
    codigo: 'RATE_LIMIT_EXCEDIDO'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator, // ✅ solución oficial IPv6 segura
});

// Limiter general de API
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    exito: false,
    mensaje: 'Demasiadas solicitudes. Por favor, intente más tarde.',
    codigo: 'RATE_LIMIT_EXCEDIDO'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator, // ✅ igual
});



// ==================== BLACKLIST DE TOKENS (Opcional) ====================

// En producción, esto debería estar en Redis o una base de datos
const tokenBlacklist = new Set();

/**
 * Agrega un token a la blacklist (para logout forzado)
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  // En producción, también guardar en Redis con TTL igual a la expiración del token
};

/**
 * Verifica si un token está en la blacklist
 */
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Middleware que verifica si el token está en blacklist
 * Usar DESPUÉS de authenticateToken
 */
const checkTokenBlacklist = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (isTokenBlacklisted(token)) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Token revocado. Por favor, inicie sesión nuevamente.',
      codigo: 'TOKEN_REVOCADO'
    });
  }

  next();
};

module.exports = { 
  authenticateToken, 
  authorizeRoles,
  authorizeSelfOrAdmin,
  loginRateLimiter,
  passwordResetRateLimiter,
  apiRateLimiter,
  blacklistToken,
  isTokenBlacklisted,
  checkTokenBlacklist
};