// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const userModel = require('../models/userModel');
// require('dotenv').config();

// async function login(req, res){
//   const { email, password } = req.body;
//   if(!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });

//   try{
//     const user = await userModel.findByEmail(email);
//     if(!user) return res.status(401).json({ error: 'Credenciales inválidas' });
//     const match = await bcrypt.compare(password, user.hashed_password);
//     if(!match) return res.status(401).json({ error: 'Credenciales inválidas' });

//     const roles = await userModel.getUserRoles(user.user_id);
//     const payload = { userId: user.user_id, username: user.username, roles };
//     const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

//     return res.json({ token, usuario: { id: user.user_id, username: user.username, nombre: user.nombre, roles } });
//   } catch(err){
//     console.error(err);
//     return res.status(500).json({ error: 'Error interno' });
//   }
// }

// async function me(req, res){
//   const id = req.user.userId;
//   const user = await userModel.findById(id);
//   if(!user) return res.status(404).json({ error: 'Usuario no encontrado' });
//   const roles = await userModel.getUserRoles(id);
//   res.json({ ...user, roles });
// }

// module.exports = { login, me };

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const { exito, error } = require('../utils/responses'); 
const dotenv = require('dotenv');
dotenv.config();

// ==================== FUNCIONES AUXILIARES REQUERIDAS ====================

// Adaptada para usar los campos de tu userModel
const generarToken = (usuario, roles, tipo = 'auth') => {
  const payload = {
    id: usuario.user_id, // Usando user_id
    username: usuario.username,
    email: usuario.email, // Usando email
    roles: roles, // Array de roles
    tipo: tipo
  };

  const options = {
    // Usando el valor de tu `login` original si no está en .env
    expiresIn: tipo === 'reset_password' ? '15m' : (process.env.JWT_EXPIRES_IN || '8h') 
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

// ==================== MÉTODOS DE AUTENTICACIÓN ====================

/**
 * Función de Login.
 * Implementa la lógica de verificación y generación de token.
 * * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
async function login(req, res){
  const { email, password } = req.body;
  
  // 1. Validación de campos
  if (!email || !password) {
    return error(res, 'Email y password son obligatorios', 400);
  }

  try{
    // 2. Buscar usuario por email (debe incluir el hash del password)
    // Se necesita que userModel.findByEmailWithPassword(email) devuelva user.hashed_password
    const user = await userModel.findByEmailWithPassword(email); 

    // 3. Verificación de usuario
    if (!user) {
      return error(res, 'Credenciales inválidas', 401);
    }
    
    // 4. Verificación de contraseña
    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) {
      return error(res, 'Credenciales inválidas', 401);
    }

    // 5. Obtener roles
    const roles = await userModel.getUserRoles(user.user_id);
    if (!roles || roles.length === 0) {
      return error(res, 'Usuario sin roles asignados', 403); 
    }
    
    // 6. Generar token JWT
    const token = generarToken(user, roles, 'auth');
    
    // Opcional: Actualizar último login
    await userModel.updateLastLogin(user.user_id);

    // 7. Respuesta exitosa usando 'exito'
    return exito(res, 'Inicio de sesión exitoso', { 
      token, 
      usuario: { 
        id: user.user_id, 
        username: user.username, 
        nombre: user.nombre, // Asegúrate de que tu modelo devuelva 'nombre'
        email: user.email, 
        roles 
      } 
    });

  } catch(err){
    console.error('Error en login:', err);
    return error(res, 'Error al iniciar sesión', 500, err.message);
  }
}

/**
 * Función para obtener el perfil del usuario autenticado ('me').
 * * @param {object} req - Objeto de solicitud de Express (contiene req.user).
 * @param {object} res - Objeto de respuesta de Express.
 */
async function me(req, res){
  try {
    // 1. Obtener ID del usuario desde el token decodificado
    // NOTA: Se asume que tu middleware adjunta el ID como 'req.user.id'
    const id = req.user.id; 

    // 2. Buscar usuario
    const user = await userModel.findById(id);

    if(!user) {
      return error(res, 'Usuario no encontrado', 404);
    }
    
    // 3. Obtener roles
    const roles = await userModel.getUserRoles(id);
    
    // 4. Respuesta exitosa usando 'exito'
    return exito(res, 'Perfil obtenido correctamente', { ...user, roles });

  } catch (err) {
    console.error('Error en me:', err);
    return error(res, 'Error al obtener perfil', 500, err.message);
  }
}

// Puedes añadir aquí otras funciones (logout, register, etc.) si lo deseas.

module.exports = { login, me };