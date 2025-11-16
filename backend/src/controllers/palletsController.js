const db = require('../config/db');

async function createPallet(req, res){
  const { pallet_id, producto_id, lote_id, sublote_id, cantidad_cajas, peso_total, tipo_pallet, created_by } = req.body;
  await db.query(
    `INSERT INTO pallets (pallet_id, producto_id, lote_id, sublote_id, cantidad_cajas, peso_total, tipo_pallet, fecha_armado, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
    [pallet_id, producto_id, lote_id, sublote_id, cantidad_cajas, peso_total, tipo_pallet, created_by]
  );
  res.status(201).json({ pallet_id });
}

async function assignCaja(req, res){
  const pallet_id = req.params.id;
  const { caja_id } = req.body;
  // create relation and update counts (simplificado)
  await db.query('INSERT INTO pallet_cajas (pallet_id, caja_id) VALUES (?, ?)', [pallet_id, caja_id]);
  // actualizar cantidad en pallet
  await db.query('UPDATE pallets p SET p.cantidad_cajas = (SELECT COUNT(*) FROM pallet_cajas pc WHERE pc.pallet_id = p.pallet_id) WHERE p.pallet_id = ?', [pallet_id]);
  res.json({ ok: true });
}

module.exports = { createPallet, assignCaja };
