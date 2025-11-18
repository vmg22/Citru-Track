const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const { enviarRecuperacionPassword } = require('../services/emails.service');
require('dotenv').config();

// ==================== FUNCIÓN AUXILIAR ====================

const generarToken = (usuario, roles) => {
  const payload = {
    id: usuario.user_id,
    username: usuario.username,
    email: usuario.email,
    roles: roles,
    rol: roles[0] || 'user'
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

// ==================== LOGIN ====================

async function login(req, res) {
  const { email, password } = req.body;

  console.log('🔍 === INICIO LOGIN ===');
  console.log('📧 Email recibido:', email);
  console.log('🔑 Password recibido:', password);
  console.log('🔑 Longitud password:', password?.length);

  if (!email || !password) {
    console.log('❌ Faltan credenciales');
    return res.status(400).json({
      exito: false,
      mensaje: 'Email y password son obligatorios'
    });
  }

  try {
    console.log('🔍 Buscando usuario en BD...');
    const [[user]] = await db.query(
      'SELECT user_id, username, email, hashed_password, nombre, telefono, activo FROM users WHERE email = ?',
      [email]
    );

    console.log('👤 Usuario encontrado:', user ? 'SÍ' : 'NO');
    if (user) {
      console.log('   - ID:', user.user_id);
      console.log('   - Username:', user.username);
      console.log('   - Activo:', user.activo);
      console.log('   - Hash (primeros 20 chars):', user.hashed_password?.substring(0, 20) + '...');
    }

    if (!user) {
      console.log('❌ Usuario no existe en BD');
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas'
      });
    }

    if (!user.activo) {
      console.log('❌ Usuario inactivo');
      return res.status(403).json({
        exito: false,
        mensaje: 'Usuario inactivo. Contacte al administrador.'
      });
    }

    console.log('🔐 Comparando passwords...');
    console.log('   - Password ingresado:', password);
    console.log('   - Hash completo:', user.hashed_password);
    
    const match = await bcrypt.compare(password, user.hashed_password);
    
    console.log('✅ Resultado comparación:', match);

    if (!match) {
      console.log('❌ Password NO coincide');
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas'
      });
    }

    console.log('✅ Password coincide - Obteniendo roles...');

    const [rolesResult] = await db.query(
      `SELECT r.name 
       FROM user_roles ur 
       INNER JOIN roles r ON ur.role_id = r.role_id 
       WHERE ur.user_id = ?`,
      [user.user_id]
    );

    const roles = rolesResult.map(r => r.name);

    if (roles.length === 0) {
      roles.push('user');
    }

    console.log('👔 Roles asignados:', roles);

    const token = generarToken(user, roles);

    console.log('🎫 Token generado (primeros 50 chars):', token.substring(0, 50) + '...');

    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
      [user.user_id]
    );

    delete user.hashed_password;

    console.log('✅ LOGIN EXITOSO');
    console.log('🔍 === FIN LOGIN ===\n');

    return res.status(200).json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      datos: {
        token,
        usuario: {
          id: user.user_id,
          username: user.username,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          roles
        }
      }
    });

  } catch (err) {
    console.error('🚨 ERROR EN LOGIN:', err);
    console.error('Stack:', err.stack);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al iniciar sesión'
    });
  }
}



 // ==================== VALIDAR TOKEN RESET ====================

const validarTokenReset = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        exito: false,
        mensaje: "Token no proporcionado"
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        exito: false,
        mensaje: "Token inválido o expirado"
      });
    }

    const userId = decoded.userId;

    // Verificar usuario y token en BD
    const [rows] = await db.execute(
      "SELECT user_id, email FROM users WHERE user_id = ? AND token_reset = ? LIMIT 1",
      [userId, token]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        exito: false,
        mensaje: "Token inválido o expirado"
      });
    }

    return res.status(200).json({
      exito: true,
      mensaje: "Token válido",
      datos: {
        email: rows[0].email,
        userId: rows[0].user_id
      }
    });

  } catch (err) {
    console.error("Error en validarTokenReset:", err);
    return res.status(500).json({
      exito: false,
      mensaje: "Error al validar token"
    });
  }
};
// ==================== CAMBIAR PASSWORD AUTENTICADO ====================

const cambiarPasswordAutenticado = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        exito: false,
        mensaje: "Contraseña actual y nueva contraseña son obligatorias"
      });
    }

    const usuario = await servicioUsuarios.obtenerUsuarioConPassword(req.user.id);

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: "Usuario no encontrado" });
    }

    const passwordValido = await bcrypt.compare(currentPassword, usuario.password_hash);

    if (!passwordValido) {
      return res.status(401).json({ exito: false, mensaje: "La contraseña actual es incorrecta" });
    }

    await servicioUsuarios.actualizarUsuarioParcial(req.user.id, {
      password: newPassword
    });

    return res.status(200).json({
      exito: true,
      mensaje: "Contraseña actualizada exitosamente. Inicia sesión nuevamente."
    });

  } catch (err) {
    console.error("Error en cambiar password:", err);
    return res.status(500).json({ exito: false, mensaje: "Error al cambiar contraseña" });
  }
};


// ==================== SOLICITAR RESET ====================
const solicitarReset = async (req, res) => {
  try {
    const email_usuario = req.body.email_usuario || req.body.email;

    console.log("📩 Email recibido en backend:", email_usuario);

    const mensajeGenerico =
      "Si el email existe, recibirás un correo con instrucciones para recuperar tu contraseña";

    if (!email_usuario) {
      return res.status(400).json({ exito: false, mensaje: "El email es obligatorio" });
    }

    // Buscar usuario EN LA TABLA USERS
    const [rows] = await db.execute(
      "SELECT user_id, email, username FROM users WHERE email = ? LIMIT 1",
      [email_usuario]
    );

    console.log("🔍 Resultado búsqueda usuario:", rows);

    if (rows.length === 0) {
      console.log("❌ Usuario no existe — mensaje genérico");
      return res.json({ exito: true, mensaje: mensajeGenerico });
    }

    const userId = rows[0].user_id;
    const username = rows[0].username || 'Usuario'; // Por si username es null

    // Generar token
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,  // ✅ Corregido
      { expiresIn: "1h" }
    );

    console.log("🔑 Token generado:", token);

    // Guardar token en la tabla users
    await db.execute(
      "UPDATE users SET token_reset = ? WHERE user_id = ?",
      [token, userId]
    );

    console.log("💾 Token guardado en BD para user_id:", userId);

    // Construir el link de reset
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    console.log("🔗 Link generado:", resetLink);

    // ✅ Enviar email con los parámetros correctos
    const envio = await enviarRecuperacionPassword(email_usuario, resetLink, username);

    console.log("📧 Resultado envío email:", envio);

    return res.json({
      exito: true,
      mensaje: "Correo de recuperación enviado",
    });

  } catch (error) {
    console.error("🚨 ERROR EN solicitarReset:", error);
    return res.status(500).json({
      exito: false,
      mensaje: "Error al procesar solicitud de recuperación",
      error: error.message
    });
  }
};

// ==================== PERFIL ====================

async function me(req, res) {
  try {
    const userId = req.user.id;

    const [[user]] = await db.query(
      'SELECT user_id, username, email, nombre, telefono, activo, created_at, last_login FROM users WHERE user_id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    const [rolesResult] = await db.query(
      `SELECT r.name 
       FROM user_roles ur 
       INNER JOIN roles r ON ur.role_id = r.role_id 
       WHERE ur.user_id = ?`,
      [userId]
    );

    const roles = rolesResult.map(r => r.name);

    return res.status(200).json({
      exito: true,
      mensaje: 'Perfil obtenido correctamente',
      datos: { ...user, roles }
    });

  } catch (err) {
    console.error('Error en me:', err);
    return res.status(500).json({ exito: false, mensaje: 'Error al obtener perfil' });
  }
}

// ==================== LOGOUT ====================

async function logout(req, res) {
  try {
    return res.status(200).json({
      exito: true,
      mensaje: 'Sesión cerrada exitosamente'
    });
  } catch (err) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al cerrar sesión'
    });
  }
}


const resetPasswordConToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log("🔄 === INICIO RESET PASSWORD ===");
    console.log("🔑 Token recibido:", token?.substring(0, 20) + "...");
    console.log("🔐 Nueva password longitud:", newPassword?.length);

    // Validaciones básicas
    if (!token || !newPassword) {
      console.log("❌ Faltan datos");
      return res.status(400).json({
        exito: false,
        mensaje: "Token y nueva contraseña son obligatorios"
      });
    }

    if (newPassword.length < 6) {
      console.log("❌ Password muy corta");
      return res.status(400).json({
        exito: false,
        mensaje: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    // Verificar y decodificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token válido - userId:", decoded.userId);
    } catch (err) {
      console.log("❌ Token inválido o expirado:", err.message);
      return res.status(401).json({
        exito: false,
        mensaje: "Token inválido o expirado"
      });
    }

    const userId = decoded.userId;

    // Verificar que el token coincida en BD y que no haya sido usado
    const [rows] = await db.execute(
      "SELECT user_id, email FROM users WHERE user_id = ? AND token_reset = ? LIMIT 1",
      [userId, token]
    );

    console.log("🔍 Usuario encontrado en BD:", rows.length > 0);

    if (rows.length === 0) {
      console.log("❌ Token no coincide o ya fue usado");
      return res.status(401).json({
        exito: false,
        mensaje: "Token inválido o ya fue utilizado"
      });
    }

    // Hash de la nueva contraseña
    console.log("🔐 Hasheando nueva contraseña...");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("✅ Password hasheada (primeros 20 chars):", hashedPassword.substring(0, 20) + "...");

    // Actualizar contraseña y limpiar token
    await db.execute(
      "UPDATE users SET hashed_password = ?, token_reset = NULL WHERE user_id = ?",
      [hashedPassword, userId]
    );

    console.log("✅ Contraseña actualizada en BD");
    console.log("🔄 === FIN RESET PASSWORD ===\n");

    return res.status(200).json({
      exito: true,
      mensaje: "Contraseña actualizada exitosamente"
    });

  } catch (error) {
    console.error("🚨 ERROR EN resetPasswordConToken:", error);
    console.error("Stack:", error.stack);
    return res.status(500).json({
      exito: false,
      mensaje: "Error al restablecer contraseña"
    });
  }
};


// ==================== EXPORTAR ====================

module.exports = {
  login,
  me,
  logout,
  solicitarReset,
  validarTokenReset,
  cambiarPasswordAutenticado,
  resetPasswordConToken
  
};
