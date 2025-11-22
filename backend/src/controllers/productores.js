const db = require('../config/db');

async function getProductores(req, res){
  const [rows] = await db.query('SELECT * FROM productores ORDER BY productor_id DESC');
  res.json(rows);
}

module.exports = {getProductores}