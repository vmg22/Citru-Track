const db = require('../config/db');

async function getRoles(req, res){
  const [rows] = await db.query('SELECT * FROM roles ORDER BY role_id DESC');
  res.json(rows);
}

module.exports = {getRoles}