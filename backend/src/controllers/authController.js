const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/db');
require('dotenv').config();

// ==================== FUNCIÓN AUXILIAR ====================

const generarToken = (usuario, roles) => {
  const payload = {
    id: usuario.user_id,
    username: usuario.username,
    email: usuario.email,
    roles: roles, // Array de nombres de roles
    rol: roles[0] || 'user' // Rol principal (el primero)
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

// ==================== LOGIN ====================

async function login(req, res) {
  const { email, password } = req.body;
  
  // 1. Validación de campos
  if (!email || !password) {
    return res.status(400).json({ 
      exito: false, 
      mensaje: 'Email y password son obligatorios' 
    });
  }

  try {
    // 2. Buscar usuario por email con password
    const [[user]] = await db.query(
      'SELECT user_id, username, email, hashed_password, nombre, telefono, activo FROM users WHERE email = ?',
      [email]
    );

    // 3. Verificar que el usuario existe
    if (!user) {
      return res.status(401).json({ 
        exito: false, 
        mensaje: 'Credenciales inválidas' 
      });
    }

    // 4. Verificar que el usuario está activo
    if (!user.activo) {
      return res.status(403).json({ 
        exito: false, 
        mensaje: 'Usuario inactivo. Contacte al administrador.' 
      });
    }
    
    // 5. Verificar contraseña
    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) {
      return res.status(401).json({ 
        exito: false, 
        mensaje: 'Credenciales inválidas' 
      });
    }

    // 6. Obtener roles del usuario
    const [rolesResult] = await db.query(
      `SELECT r.name 
       FROM user_roles ur 
       INNER JOIN roles r ON ur.role_id = r.role_id 
       WHERE ur.user_id = ?`,
      [user.user_id]
    );
    
    const roles = rolesResult.map(r => r.name);
    
    // Si no tiene roles, asignar rol por defecto
    if (roles.length === 0) {
      roles.push('user');
    }
    
    // 7. Generar token JWT
    const token = generarToken(user, roles);
    
    // 8. Actualizar último login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
      [user.user_id]
    );

    // 9. Remover el password del objeto user antes de enviarlo
    delete user.hashed_password;

    // 10. Respuesta exitosa
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
    console.error('Error en login:', err);
    return res.status(500).json({ 
      exito: false, 
      mensaje: 'Error al iniciar sesión',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// ==================== ME (PERFIL) ====================

async function me(req, res) {
  try {
    // 1. Obtener ID del usuario desde el token
    const userId = req.user.id;

    // 2. Buscar usuario
    const [[user]] = await db.query(
      'SELECT user_id, username, email, nombre, telefono, activo, created_at, last_login FROM users WHERE user_id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ 
        exito: false, 
        mensaje: 'Usuario no encontrado' 
      });
    }
    
    // 3. Obtener roles
    const [rolesResult] = await db.query(
      `SELECT r.name 
       FROM user_roles ur 
       INNER JOIN roles r ON ur.role_id = r.role_id 
       WHERE ur.user_id = ?`,
      [userId]
    );
    
    const roles = rolesResult.map(r => r.name);
    
    // 4. Respuesta exitosa
    return res.status(200).json({ 
      exito: true,
      mensaje: 'Perfil obtenido correctamente',
      datos: {
        ...user,
        roles
      }
    });

  } catch (err) {
    console.error('Error en me:', err);
    return res.status(500).json({ 
      exito: false, 
      mensaje: 'Error al obtener perfil',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// ==================== LOGOUT ====================

async function logout(req, res) {
  try {
    // Aquí podrías agregar el token a una blacklist si usas una
    return res.status(200).json({ 
      exito: true,
      mensaje: 'Sesión cerrada exitosamente'
    });
  } catch (err) {
    console.error('Error en logout:', err);
    return res.status(500).json({ 
      exito: false, 
      mensaje: 'Error al cerrar sesión'
    });
  }
}

module.exports = { login, me, logout };