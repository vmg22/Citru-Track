const pool = require("../config/db");

/* GET /api/ordenes-despacho */
async function getAllOrdenes(req, res) {
  try {
    const { estado } = req.query;
    const params = [];
    let where = "";

    if (estado) {
      where = "WHERE estado = ?";
      params.push(estado);
    }

    const sql = `
      SELECT od.*, c.nombre AS cliente_nombre, t.nombre AS transportista_nombre, cam.patente AS patente
      FROM orden_despacho od
      LEFT JOIN clientes c ON od.cliente_id = c.cliente_id
      LEFT JOIN transportistas t ON od.transportista_id = t.transportista_id
      LEFT JOIN camiones cam ON od.camion_id = cam.camion_id
      ${where}
      ORDER BY od.fecha_creacion DESC
      LIMIT 1000
    `;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener órdenes de despacho" });
  }
}

/* GET /api/ordenes-despacho/kpis (resumen) */
async function getKPIs(req, res) {
  try {
    const [[{ totalCamiones }]] = await pool.query("SELECT COUNT(*) AS totalCamiones FROM camiones");
    const [[{ totalChoferes }]] = await pool.query("SELECT COUNT(*) AS totalChoferes FROM choferes");
    const [[{ viajesEnCurso }]] = await pool.query(
      "SELECT COUNT(*) AS viajesEnCurso FROM orden_despacho WHERE estado IN ('en_carga','en_ruta')"
    );
    const [[{ enMantenimiento }]] = await pool.query(
      "SELECT COUNT(*) AS enMantenimiento FROM camiones WHERE ultima_desinfeccion IS NULL OR ultima_desinfeccion = ''"
    );
    res.json({ totalCamiones, totalChoferes, viajesEnCurso, enMantenimiento });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener KPIs" });
  }
}

/* GET /api/pedidos */
async function getPedidos(req, res) {
  try {
    const { estado } = req.query;
    const params = [];
    let where = "";

    if (estado) {
      where = "WHERE estado = ?";
      params.push(estado);
    }

    const sql = `
      SELECT *
      FROM pedidos
      ${where}
      ORDER BY fecha_programada DESC
      LIMIT 1000
    `;

    const [rows] = await pool.query(sql, params);
    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
}
// reemplaza la función createPedido en controllers/ordenesController.js con esto
async function createPedido(req, res) {
  try {
    console.log("==> createPedido - body recibido:", req.body);

    const body = req.body || {};

    // Aceptar ambos formatos: camelCase o snake_case
    const clienteId = body.clienteId ?? body.cliente_id ?? null;
    const fechaProgramada = body.fechaProgramada ?? body.fecha_programada ?? null;
    const destino = body.destino ?? null;
    const tipoDestino = body.tipoDestino ?? body.tipo_destino ?? null;
    const transportistaId = body.transportistaId ?? body.transportista_id ?? null;
    const camionId = body.camionId ?? body.camion_id ?? null;
    const choferId = body.choferId ?? body.chofer_id ?? null;
    const observaciones = body.observaciones ?? body.observation ?? null;
    const temperaturaConsigne = body.temperatura_consigne ?? body.temperaturaConsigne ?? null;
    const palletsIds = Array.isArray(body.palletsIds) ? body.palletsIds : (Array.isArray(body.pallets_ids) ? body.pallets_ids : []);

    // Validaciones básicas
    const errores = [];
    if (!clienteId) errores.push("clienteId (cliente_id) es obligatorio.");
    if (!fechaProgramada) errores.push("fechaProgramada (fecha_programada) es obligatorio.");
    if (!destino) errores.push("destino es obligatorio.");
    if (!tipoDestino) errores.push("tipoDestino (tipo_destino) es obligatorio.");

    if (errores.length) {
      console.warn("createPedido - validación falló:", errores);
      return res.status(400).json({ ok: false, errors: errores });
    }

    // Obtener el último od_code y calcular siguiente correlativo (OD-0001 ...)
    const [last] = await pool.query("SELECT od_code FROM orden_despacho ORDER BY od_id DESC LIMIT 1");
    let nextCode = "OD-0001";
    if (Array.isArray(last) && last.length > 0 && last[0].od_code) {
      const lastCode = String(last[0].od_code);
      const num = parseInt(lastCode.replace(/^OD-?0*/, ""), 10);
      const nextNum = (Number.isFinite(num) ? num + 1 : 1);
      nextCode = "OD-" + String(nextNum).padStart(4, "0");
    }

    console.log("createPedido - od_code generado:", nextCode);

    // Insertar (incluyendo od_code)
    const sql = `
      INSERT INTO orden_despacho
      (od_code, cliente_id, destino, tipo_destino, estado,
       transportista_id, camion_id, chofer_id,
       observaciones, temperatura_consigne, fecha_creacion, fecha_programada)
      VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?, ?, ?, NOW(), ?)
    `;

    const params = [
      nextCode,
      Number(clienteId),
      destino,
      tipoDestino,
      transportistaId ? Number(transportistaId) : null,
      camionId ? Number(camionId) : null,
      choferId ? Number(choferId) : null,
      observaciones ? String(observaciones) : null,
      temperaturaConsigne !== undefined && temperaturaConsigne !== null ? Number(temperaturaConsigne) : null,
      fechaProgramada
    ];

    console.log("createPedido - SQL params:", params);

    const [result] = await pool.query(sql, params);
    const od_id = result.insertId;

    // Asociar pallets (si vinieron ids reales)
    if (palletsIds.length) {
      try {
        const values = palletsIds.map(palletId => [od_id, palletId]);
        await pool.query("INSERT INTO od_pallets (od_id, pallet_id) VALUES ?", [values]);
      } catch (errAssoc) {
        console.warn("createPedido - warning asociando pallets:", errAssoc && (errAssoc.sqlMessage || errAssoc.message));
        // no hacemos rollback completo; sólo avisamos
      }
    }

    return res.status(201).json({ ok: true, od_id, od_code: nextCode });

  } catch (err) {
    console.error("createPedido - ERROR:", err);
    const sqlMessage = err && (err.sqlMessage || err.message || String(err));
    return res.status(500).json({ ok: false, error: "Error al crear el pedido", details: sqlMessage });
  }
}

// reemplaza la función createPedido en controllers/ordenesController.js con esto
// async function createPedido(req, res) {
//   try {
//     console.log("==> createPedido - body recibido:", req.body);

//     const body = req.body || {};

//     // Aceptar ambos formatos: camelCase o snake_case
//     const clienteId = body.clienteId ?? body.cliente_id ?? null;
//     const fechaProgramada = body.fechaProgramada ?? body.fecha_programada ?? null;
//     const destino = body.destino ?? null;
//     const tipoDestino = body.tipoDestino ?? body.tipo_destino ?? null;
//     const transportistaId = body.transportistaId ?? body.transportista_id ?? null;
//     const camionId = body.camionId ?? body.camion_id ?? null;
//     const choferId = body.choferId ?? body.chofer_id ?? null;
//     const observaciones = body.observaciones ?? body.observation ?? null;
//     const temperaturaConsigne = body.temperatura_consigne ?? body.temperaturaConsigne ?? null;
//     const palletsIds = Array.isArray(body.palletsIds) ? body.palletsIds : (Array.isArray(body.pallets_ids) ? body.pallets_ids : []);

//     // Validaciones básicas
//     const errores = [];
//     if (!clienteId) errores.push("clienteId (cliente_id) es obligatorio.");
//     if (!fechaProgramada) errores.push("fechaProgramada (fecha_programada) es obligatorio.");
//     if (!destino) errores.push("destino es obligatorio.");
//     if (!tipoDestino) errores.push("tipoDestino (tipo_destino) es obligatorio.");

//     if (errores.length) {
//       console.warn("createPedido - validación falló:", errores);
//       return res.status(400).json({ ok: false, errors: errores });
//     }

//     // Obtener el último od_code y calcular siguiente correlativo (OD-0001 ...)
//     const [last] = await pool.query("SELECT od_code FROM orden_despacho ORDER BY od_id DESC LIMIT 1");
//     let nextCode = "OD-0001";
//     if (Array.isArray(last) && last.length > 0 && last[0].od_code) {
//       const lastCode = String(last[0].od_code);
//       const num = parseInt(lastCode.replace(/^OD-?0*/, ""), 10);
//       const nextNum = (Number.isFinite(num) ? num + 1 : 1);
//       nextCode = "OD-" + String(nextNum).padStart(4, "0");
//     }

//     console.log("createPedido - od_code generado:", nextCode);

//     // Insertar (incluyendo od_code)
//     const sql = `
//       INSERT INTO orden_despacho
//       (od_code, cliente_id, destino, tipo_destino, estado,
//        transportista_id, camion_id, chofer_id,
//        observaciones, temperatura_consigne, fecha_creacion, fecha_programada)
//       VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?, ?, ?, NOW(), ?)
//     `;

//     const params = [
//       nextCode,
//       Number(clienteId),
//       destino,
//       tipoDestino,
//       transportistaId ? Number(transportistaId) : null,
//       camionId ? Number(camionId) : null,
//       choferId ? Number(choferId) : null,
//       observaciones ? String(observaciones) : null,
//       temperaturaConsigne !== undefined && temperaturaConsigne !== null ? Number(temperaturaConsigne) : null,
//       fechaProgramada
//     ];

//     console.log("createPedido - SQL params:", params);

//     const [result] = await pool.query(sql, params);
//     const od_id = result.insertId;

//     // Asociar pallets (si vinieron ids reales)
//     if (palletsIds.length) {
//       try {
//         const values = palletsIds.map(palletId => [od_id, palletId]);
//         await pool.query("INSERT INTO od_pallets (od_id, pallet_id) VALUES ?", [values]);
//       } catch (errAssoc) {
//         console.warn("createPedido - warning asociando pallets:", errAssoc && (errAssoc.sqlMessage || errAssoc.message));
//         // no hacemos rollback completo; sólo avisamos
//       }
//     }

//     return res.status(201).json({ ok: true, od_id, od_code: nextCode });

//   } catch (err) {
//     console.error("createPedido - ERROR:", err);
//     const sqlMessage = err && (err.sqlMessage || err.message || String(err));
//     return res.status(500).json({ ok: false, error: "Error al crear el pedido", details: sqlMessage });
//   }
// }

/* PATCH /api/pedidos/:id */
async function updatePedido(req, res) {
  try {
    const { id } = req.params;
    const fields = req.body;

    const sets = [];
    const params = [];

    for (const key in fields) {
      sets.push(`${key} = ?`);
      params.push(fields[key]);
    }

    params.push(id);

    const sql = `
      UPDATE orden_despacho
      SET ${sets.join(", ")}
      WHERE od_id = ?
    `;

    await pool.query(sql, params);

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar pedido" });
  }
}

/* DELETE /api/pedidos/:id */
async function deletePedido(req, res) {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE orden_despacho SET estado = 'cancelado' WHERE od_id = ?",
      [id]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar el pedido" });
  }
}




module.exports = {
  getAllOrdenes,
  getKPIs,
  getPedidos,
  createPedido,
  updatePedido,
  deletePedido
};
