const db = require("../config/db");

/**
 * @desc    Obtener pallets filtrados por producto y/o estado
 * @route   GET /api/pallets?productoId=X&estado=en_camara
 * @access  Public
 * NOTA: Este controlador solo maneja la lectura de detalle, no la creación.
 */
const getPalletsByFilter = async (req, res) => {
  try {
    const { productoId, estado } = req.query;

    let query = `
      SELECT 
        p.pallet_id, 
        p.producto_id,
        p.estado,
        p.camara_id,
        p.tipo_pallet,
        p.fecha_armado,
        -- Campos de JOINS
        pr.nombre as producto_nombre,
        l.descripcion as lote_descripcion,
        sl.calibre as sublote_calibre,
        -- Campos calculados dinámicamente
        (SELECT COALESCE(COUNT(caja_id), 0) FROM cajas c WHERE c.pallet_id = p.pallet_id) as cantidad_cajas,
        (SELECT COALESCE(SUM(c.peso_neto), 0) FROM cajas c WHERE c.pallet_id = p.pallet_id) as peso_total
      FROM pallets p
      LEFT JOIN productos pr ON p.producto_id = pr.producto_id
      LEFT JOIN lotes l ON p.lote_id = l.lote_id
      LEFT JOIN sublotes sl ON p.sublote_id = sl.sublote_id
      WHERE 1=1
    `;

    const params = [];

    if (productoId) {
      query += ` AND p.producto_id = ?`;
      params.push(productoId);
    }

    if (estado) {
      query += ` AND p.estado = ?`;
      params.push(estado);
    }

    query += ` ORDER BY p.fecha_armado DESC`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo pallets:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPalletsByFilter,
};