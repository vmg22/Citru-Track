const db = require('../config/db');
const bcrypt = require('bcrypt');

async function list(req, res){
  const [rows] = await db.query('SELECT user_id, username, email, nombre, activo, created_at FROM users');
  res.json(rows);
}

async function create(req, res){
  const { username, email, password, nombre, roles } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const [r] = await db.query('INSERT INTO users (username, email, hashed_password, nombre) VALUES (?, ?, ?, ?)', [username, email, hashed, nombre]);
  const userId = r.insertId;
  if(Array.isArray(roles) && roles.length){
    for(const roleName of roles){
      const [[role]] = await db.query('SELECT role_id FROM roles WHERE name = ?', [roleName]);
      if(role){
        await db.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, role.role_id]);
      }
    }
  }
  res.status(201).json({ userId });
}

module.exports = { list, create };
