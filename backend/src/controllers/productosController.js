const db = require('../config/db');

async function list(req, res){
  const [rows] = await db.query('SELECT * FROM productos ORDER BY producto_id DESC');
  res.json(rows);
}
async function getOne(req, res){
  const id = req.params.id;
  const [rows] = await db.query('SELECT * FROM productos WHERE producto_id = ?', [id]);
  if(!rows[0]) return res.status(404).json({ error: 'No existe' });
  res.json(rows[0]);
}
async function create(req, res){
  const { nombre, categoria, unidad_base } = req.body;
  const [r] = await db.query('INSERT INTO productos (nombre,categoria,unidad_base) VALUES (?, ?, ?)', [nombre,categoria,unidad_base]);
  res.status(201).json({ producto_id: r.insertId });
}
module.exports = { list, getOne, create };
