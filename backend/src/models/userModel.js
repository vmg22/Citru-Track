const db = require('../config/db');

async function findByEmail(email){
  const [rows] = await db.query('SELECT user_id, username, email, hashed_password, nombre FROM users WHERE email = ?', [email]);
  return rows[0];
}

async function findById(userId){
  const [rows] = await db.query('SELECT user_id, username, email, nombre FROM users WHERE user_id = ?', [userId]);
  return rows[0];
}

async function createUser({username, email, hashed_password, nombre}){
  const [res] = await db.query(
    `INSERT INTO users (username, email, hashed_password, nombre) VALUES (?, ?, ?, ?)`,
    [username, email, hashed_password, nombre]
  );
  return { user_id: res.insertId };
}

async function getUserRoles(userId){
  const [rows] = await db.query(
    `SELECT r.name FROM roles r INNER JOIN user_roles ur ON ur.role_id = r.role_id WHERE ur.user_id = ?`,
    [userId]
  );
  return rows.map(r => r.name);
}

module.exports = { findByEmail, findById, createUser, getUserRoles };
