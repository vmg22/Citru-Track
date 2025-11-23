// const db = require("../config/db");

// /**
//  * @desc    Crear un nuevo pallet (ID manual desde el body)
//  * @route   POST /api/pallets
//  * @access  Private
//  */

// const getPalletsByFilter = async (req, res) => {
//   try {
//     const { productoId, estado } = req.query;

//     let query = `
//       SELECT p.*,
//              pr.nombre as producto_nombre,
//              l.descripcion as lote_descripcion,
//              sl.calibre as sublote_calibre
//       FROM pallets p
//       LEFT JOIN productos pr ON p.producto_id = pr.producto_id
//       LEFT JOIN lotes l ON p.lote_id = l.lote_id
//       LEFT JOIN sublotes sl ON p.sublote_id = sl.sublote_id
//       WHERE 1=1
//     `;

//     const params = [];

//     if (productoId) {
//       query += ` AND p.producto_id = ?`;
//       params.push(productoId);
//     }

//     if (estado) {
//       query += ` AND p.estado = ?`;
//       params.push(estado);
//     }

//     query += ` ORDER BY p.fecha_armado DESC`;

//     const [rows] = await db.query(query, params);
//     res.json(rows);
//   } catch (error) {
//     console.error("Error obteniendo pallets:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// /**
//  * @desc    Asignar una caja a un pallet existente
//  * @route   POST /api/pallets/:id/assign
//  * @access  Private
//  */
// const assignCaja = async (req, res) => {
//   try {
//     const { id: pallet_id } = req.params; // 'id' es el pallet_id
//     const { caja_id } = req.body;

//     // 1. Crear la relación
//     await db.query(
//       "INSERT INTO pallet_cajas (pallet_id, caja_id) VALUES (?, ?)",
//       [pallet_id, caja_id]
//     );

//     // 2. Actualizar cantidad en pallet (esto debería estar en una transacción)
//     // También actualizamos el peso si viniera en la caja (simplificado por ahora)
//     await db.query(
//       `UPDATE pallets p 
//        SET p.cantidad_cajas = (SELECT COUNT(*) FROM pallet_cajas pc WHERE pc.pallet_id = p.pallet_id) 
//        WHERE p.pallet_id = ?`,
//       [pallet_id]
//     );

//     // --- Notificación WebSocket ---
//     const io = req.app.get("io");
//     io.emit("pallet_actualizado", { pallet_id, caja_anadida: caja_id });
//     // --- Fin Notificación ---

//     res.status(200).json({ ok: true, message: "Caja asignada a pallet" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({
//         message: "Error en el servidor al asignar caja",
//         error: error.message,
//       });
//   }
// };

// /**
//  * @desc    Cerrar un pallet (marcarlo como 'armado')
//  * @route   PUT /api/pallets/:id/close
//  * @access  Private
//  */
// const cerrarPallet = async (req, res) => {
//   try {
//     const { id: pallet_id } = req.params;

//     // El estado 'cerrado' no existe. Usamos 'armado', que es el estado por defecto
//     // de un pallet listo para pasar a cámara.
//     const nuevoEstado = "armado";

//     const [result] = await db.query(
//       "UPDATE pallets SET estado = ? WHERE pallet_id = ?",
//       [nuevoEstado, pallet_id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Pallet no encontrado" });
//     }

//     // --- Notificación WebSocket ---
//     // Obtenemos 'io' de la app (que se adjuntó en server.js)
//     const io = req.app.get("io");

//     // Emitimos el evento (usando el nombre que definiste)
//     io.emit("pallet:cerrado", {
//       pallet_id: pallet_id,
//       estado: nuevoEstado,
//       timestamp: Date.now(),
//     });
//     // --- Fin Notificación ---

//     res.json({
//       ok: true,
//       message: `Pallet ${pallet_id} marcado como '${nuevoEstado}'`,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({
//         message: "Error en el servidor al cerrar pallet",
//         error: error.message,
//       });
//   }
// };

// // Exportamos todo usando module.exports
// module.exports = {
//   getPalletsByFilter,
//   createPallet,
//   assignCaja,
//   cerrarPallet,
// };
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

module.exports = {
  getPalletsByFilter,
  createPallet,
  assignCaja,
  cerrarPallet,
};