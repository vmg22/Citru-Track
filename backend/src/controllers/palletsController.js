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

/**
 * @desc    Crear un nuevo pallet (ID manual desde el body)
 * @route   POST /api/pallets
 * @access  Private
 */
const createPallet = async (req, res) => {
  try {
    const {
      pallet_id,
      producto_id,
      lote_id,
      sublote_id,
      cantidad_cajas,
      peso_total,
      tipo_pallet,
    } = req.body;

    const created_by = req.user ? req.user.user_id : null;

    await db.query(
      `INSERT INTO pallets (pallet_id, producto_id, lote_id, sublote_id, cantidad_cajas, peso_total, tipo_pallet, fecha_armado, created_by, created_at, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), 'armado')`,
      [
        pallet_id,
        producto_id,
        lote_id,
        sublote_id,
        cantidad_cajas,
        peso_total,
        tipo_pallet,
        created_by,
      ]
    );

    const io = req.app.get("io");
    const nuevoPallet = { pallet_id, ...req.body, estado: "armado" };
    io.emit("pallet_creado", nuevoPallet);

    res.status(201).json({ message: "Pallet creado", data: nuevoPallet });
  } catch (error) {
    res.status(500).json({
      message: "Error en el servidor al crear pallet",
      error: error.message,
    });
  }
};

/**
 * @desc    Asignar una caja a un pallet existente
 * @route   POST /api/pallets/:id/asignar-caja
 * @access  Private
 */
const assignCaja = async (req, res) => {
  try {
    const { id: pallet_id } = req.params;
    const { caja_id } = req.body;

    await db.query(
      "INSERT INTO pallet_cajas (pallet_id, caja_id) VALUES (?, ?)",
      [pallet_id, caja_id]
    );

    await db.query(
      `UPDATE pallets p 
       SET p.cantidad_cajas = (SELECT COUNT(*) FROM pallet_cajas pc WHERE pc.pallet_id = p.pallet_id) 
       WHERE p.pallet_id = ?`,
      [pallet_id]
    );

    const io = req.app.get("io");
    io.emit("pallet_actualizado", { pallet_id, caja_anadida: caja_id });

    res.status(200).json({ ok: true, message: "Caja asignada a pallet" });
  } catch (error) {
    res.status(500).json({
      message: "Error en el servidor al asignar caja",
      error: error.message,
    });
  }
};

/**
 * @desc    Cerrar un pallet (marcarlo como 'armado')
 * @route   PUT /api/pallets/:id/close
 * @access  Private
 */
const cerrarPallet = async (req, res) => {
  try {
    const { id: pallet_id } = req.params;
    const nuevoEstado = "armado";

    const [result] = await db.query(
      "UPDATE pallets SET estado = ? WHERE pallet_id = ?",
      [nuevoEstado, pallet_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pallet no encontrado" });
    }

    const io = req.app.get("io");
    io.emit("pallet:cerrado", {
      pallet_id: pallet_id,
      estado: nuevoEstado,
      timestamp: Date.now(),
    });

    res.json({
      ok: true,
      message: `Pallet ${pallet_id} marcado como '${nuevoEstado}'`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error en el servidor al cerrar pallet",
      error: error.message,
    });
  }
};

module.exports = {
  getPalletsByFilter,
  createPallet,
  assignCaja,
  cerrarPallet,
};