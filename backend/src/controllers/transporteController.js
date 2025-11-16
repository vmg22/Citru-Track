const db = require('../config/db');

async function createTransportista(req, res){
  const { nombre, cuit, contacto, telefono, email } = req.body;
  const [r] = await db.query('INSERT INTO transportistas (nombre, cuit, contacto, telefono, email) VALUES (?, ?, ?, ?, ?)', [nombre,cuit,contacto,telefono,email]);
  res.status(201).json({ transportista_id: r.insertId });
}

async function createCamion(req, res){
  const { transportista_id, patente, patente_acoplado, tipo_camion, temp_min, temp_max } = req.body;
  const [r] = await db.query('INSERT INTO camiones (transportista_id, patente, patente_acoplado, tipo_camion, temp_min, temp_max) VALUES (?, ?, ?, ?, ?, ?)', [transportista_id, patente, patente_acoplado, tipo_camion, temp_min, temp_max]);
  res.status(201).json({ camion_id: r.insertId });
}

module.exports = { createTransportista, createCamion };
