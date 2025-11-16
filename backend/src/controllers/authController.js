const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
require('dotenv').config();

async function login(req, res){
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });

  try{
    const user = await userModel.findByEmail(email);
    if(!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const match = await bcrypt.compare(password, user.hashed_password);
    if(!match) return res.status(401).json({ error: 'Credenciales inválidas' });

    const roles = await userModel.getUserRoles(user.user_id);
    const payload = { userId: user.user_id, username: user.username, roles };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

    return res.json({ token, usuario: { id: user.user_id, username: user.username, nombre: user.nombre, roles } });
  } catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function me(req, res){
  const id = req.user.userId;
  const user = await userModel.findById(id);
  if(!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const roles = await userModel.getUserRoles(id);
  res.json({ ...user, roles });
}

module.exports = { login, me };
