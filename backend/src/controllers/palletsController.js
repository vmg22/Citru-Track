const db = require("../config/db");

/**
 * @desc    Obtener pallets filtrados por producto y/o estado
 * @route   GET /api/pallets?productoId=X&estado=en_camara
 * @access  Public
 */
const getPalletsByFilter = async (req, res) => {
  try {
    const { productoId, estado } = req.query;

    let query = `
      SELECT p.*,
             pr.nombre as producto_nombre,
             l.descripcion as lote_descripcion,
             sl.calibre as sublote_calibre
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

/**
 * @desc    Obtener cajas disponibles para armar pallet
 * @route   GET /api/pallets/cajas-disponibles
 * @access  Public
 */
const getCajasDisponibles = async (req, res) => {
  try {
    const { producto_id, lote_id, sublote_id } = req.query;

    console.log("📦 getCajasDisponibles - Parámetros recibidos:", { producto_id, lote_id, sublote_id });

    let query = `
      SELECT c.*, 
             p.nombre as producto_nombre, 
             l.descripcion as lote_descripcion, 
             sl.calibre as sublote_calibre
      FROM cajas c
      LEFT JOIN productos p ON c.producto_id = p.producto_id
      LEFT JOIN lotes l ON c.lote_id = l.lote_id
      LEFT JOIN sublotes sl ON c.sublote_id = sl.sublote_id
      WHERE c.caja_id NOT IN (SELECT caja_id FROM pallet_cajas)
    `;

    const params = [];

    if (producto_id) {
      query += ` AND c.producto_id = ?`;
      params.push(producto_id);
    }

    if (lote_id) {
      query += ` AND c.lote_id = ?`;
      params.push(lote_id);
    }

    if (sublote_id) {
      query += ` AND c.sublote_id = ?`;
      params.push(sublote_id);
    }

    query += ` ORDER BY c.created_at ASC`;

    console.log("📦 Ejecutando query:", query);
    console.log("📦 Con parámetros:", params);

    const [rows] = await db.query(query, params);
    
    console.log(`📦 Cajas encontradas: ${rows.length}`);
    if (rows.length > 0) {
      console.log("📦 Primera caja:", rows[0]);
    }
    
    res.json({
      success: true,
      cajas: rows
    });
  } catch (error) {
    console.error("❌ Error obteniendo cajas disponibles:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener cajas disponibles",
      error: error.message 
    });
  }
};

/**
 * @desc    Crear pallet con cajas seleccionadas
 * @route   POST /api/pallets/crear-con-cajas
 * @access  Private
 */
const crearPalletConCajas = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      pallet_id,
      producto_id,
      lote_id,
      sublote_id,
      cajas_ids, // Array de IDs
      tipo_pallet
    } = req.body;

    const created_by = req.user ? req.user.user_id : null;
    
    if (!cajas_ids || cajas_ids.length === 0) {
      throw new Error("No se han seleccionado cajas");
    }

    // 1. Calcular peso total y cantidad
    const [cajasInfo] = await connection.query(
      `SELECT SUM(peso_neto) as peso_total, COUNT(*) as cantidad 
       FROM cajas WHERE caja_id IN (?)`,
      [cajas_ids]
    );

    const peso_total = cajasInfo[0].peso_total || 0;
    const cantidad_cajas = cajasInfo[0].cantidad || 0;

    if (cantidad_cajas !== cajas_ids.length) {
      throw new Error("Algunas cajas seleccionadas no existen o no son válidas");
    }

    // 2. Insertar Pallet
    await connection.query(
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
        created_by
      ]
    );

    // 3. Insertar relaciones en pallet_cajas
    const values = cajas_ids.map(caja_id => [pallet_id, caja_id]);
    
    await connection.query(
      `INSERT INTO pallet_cajas (pallet_id, caja_id) VALUES ?`,
      [values]
    );

    await connection.commit();

    // 4. Notificar
    const io = req.app.get("io");
    const nuevoPallet = { 
      pallet_id, 
      producto_id, 
      lote_id, 
      sublote_id, 
      cantidad_cajas, 
      peso_total, 
      tipo_pallet, 
      estado: "armado",
      fecha_armado: new Date()
    };
    io.emit("pallet_creado", nuevoPallet);

    res.status(201).json({ 
      success: true, 
      message: "Pallet creado exitosamente", 
      data: nuevoPallet 
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error creando pallet con cajas:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear pallet",
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Obtener detalle de un pallet por ID
 * @route   GET /api/pallets/:id
 * @access  Public
 */
const getPalletById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT p.*,
              pr.nombre as producto_nombre,
              l.descripcion as lote_descripcion,
              sl.calibre as sublote_calibre,
              u.nombre as usuario_nombre
       FROM pallets p
       LEFT JOIN productos pr ON p.producto_id = pr.producto_id
       LEFT JOIN lotes l ON p.lote_id = l.lote_id
       LEFT JOIN sublotes sl ON p.sublote_id = sl.sublote_id
       LEFT JOIN usuarios u ON p.created_by = u.user_id
       WHERE p.pallet_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Pallet no encontrado" });
    }

    const pallet = rows[0];

    // Obtener cajas del pallet
    const [cajas] = await db.query(
      `SELECT c.* 
       FROM cajas c
       JOIN pallet_cajas pc ON c.caja_id = pc.caja_id
       WHERE pc.pallet_id = ?`,
      [id]
    );

    pallet.cajas = cajas;

    res.json(pallet);
  } catch (error) {
    console.error("Error obteniendo pallet:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getPalletsByFilter,
  createPallet,
  assignCaja,
  cerrarPallet,
  getCajasDisponibles,
  crearPalletConCajas,
  getPalletById
};