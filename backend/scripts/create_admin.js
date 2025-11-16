// Ejecutar: npm run create-admin
const bcrypt = require('bcrypt');
const db = require('../src/config/db');
require('dotenv').config();

async function run(){
  const username = 'admin';
  const email = 'admin@citrustack.local';
  const password = 'Admin123!';
  const nombre = 'Administrador';
  const hashed = await bcrypt.hash(password, 10);

  const conn = await db.getConnection();
  try{
    await conn.beginTransaction();
    const [u] = await conn.query('SELECT user_id FROM users WHERE username = ?', [username]);
    if(u.length){
      console.log('Usuario admin ya existe');
      await conn.release();
      process.exit(0);
    }
    const [r] = await conn.query('INSERT INTO users (username, email, hashed_password, nombre) VALUES (?, ?, ?, ?)', [username, email, hashed, nombre]);
    const userId = r.insertId;
    // asignar rol admin (suponiendo role existe)
    const [role] = await conn.query('SELECT role_id FROM roles WHERE name = ?', ['admin']);
    if(role.length){
      await conn.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, role[0].role_id]);
    } else {
      console.log('No existe rol admin, créalo en la BD primero.');
    }
    await conn.commit();
    console.log('Usuario admin creado ->', username, 'password:', password);
    await conn.release();
    process.exit(0);
  }catch(e){
    await conn.rollback();
    console.error(e);
    process.exit(1);
  }
}

run();
