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
      FROM ordenes_despacho od
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
      "SELECT COUNT(*) AS viajesEnCurso FROM ordenes_despacho WHERE estado IN ('en_carga','en_ruta')"
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
// POST /api/pedidos
// // POST /api/pedidos
async function createPedido(req, res) {
  const connection = await pool.getConnection();
  
  try {
    console.log("==> createPedido - body recibido:", JSON.stringify(req.body, null, 2));

    const body = req.body || {};

    // 🔥 Eliminar 'estado' si existe
    delete body.estado;
    delete body.Estado;
    delete body.ESTADO;

    // Extraer campos (camelCase y snake_case)
    const clienteId = body.clienteId ?? body.cliente_id ?? null;
    const fechaProgramada = body.fechaProgramada ?? body.fecha_programada ?? null;
    const destino = body.destino ?? null;
    const tipoDestino = body.tipoDestino ?? body.tipo_destino ?? null;
    const productoId = body.productoId ?? body.producto_id ?? null;
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

    await connection.beginTransaction();

    // Calcular totales de pallets si se proporcionaron
    let cantidadPalletsTotal = 0;
    let pesoTotalPrevisto = 0;
    let productoIdFromPallets = productoId;

    if (palletsIds.length > 0) {
      console.log("createPedido - Calculando totales de pallets:", palletsIds);
      
      const placeholders = palletsIds.map(() => '?').join(',');
      const [palletsInfo] = await connection.query(
        `SELECT producto_id, peso_total FROM pallets WHERE pallet_id IN (${placeholders})`,
        palletsIds
      );

      if (palletsInfo.length > 0) {
        cantidadPalletsTotal = palletsInfo.length;
        pesoTotalPrevisto = palletsInfo.reduce((sum, p) => sum + parseFloat(p.peso_total || 0), 0);
        
        if (!productoIdFromPallets) {
          productoIdFromPallets = palletsInfo[0].producto_id;
        }

        console.log("✅ Totales calculados:", {
          cantidad: cantidadPalletsTotal,
          peso: pesoTotalPrevisto.toFixed(3),
          producto_id: productoIdFromPallets
        });
      }
    }

    // Obtener el último od_code y calcular siguiente correlativo (OD-0001 ...)
    const [last] = await connection.query("SELECT od_code FROM ordenes_despacho ORDER BY od_id DESC LIMIT 1");
    let nextCode = "OD-0001";
    if (Array.isArray(last) && last.length > 0 && last[0].od_code) {
      const lastCode = String(last[0].od_code);
      const num = parseInt(lastCode.replace(/^OD-?0*/, ""), 10);
      const nextNum = (Number.isFinite(num) ? num + 1 : 1);
      nextCode = "OD-" + String(nextNum).padStart(4, "0");
    }

    console.log("✅ od_code generado:", nextCode);

    // 🔥 INSERT SIN columna 'estado' - usará DEFAULT 'pendiente'
    const sql = `
      INSERT INTO ordenes_despacho
      (od_code, cliente_id, destino, tipo_destino, producto_id,
       transportista_id, camion_id, chofer_id, observaciones, 
       temperatura_consigne, fecha_programada,
       cantidad_pallets_prevista, peso_total_previsto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      nextCode,
      Number(clienteId),
      destino,
      tipoDestino,
      productoIdFromPallets ? Number(productoIdFromPallets) : null,
      transportistaId ? Number(transportistaId) : null,
      camionId ? Number(camionId) : null,
      choferId ? Number(choferId) : null,
      observaciones ? String(observaciones) : null,
      temperaturaConsigne !== undefined && temperaturaConsigne !== null ? Number(temperaturaConsigne) : null,
      fechaProgramada,
      cantidadPalletsTotal,
      pesoTotalPrevisto
    ];

    console.log("🔧 Ejecutando INSERT...");
    const [result] = await connection.query(sql, params);
    const od_id = result.insertId;
    console.log("✅ Pedido insertado, od_id:", od_id);

    // Asociar pallets y actualizar su estado a 'despachado'
    if (palletsIds.length > 0) {
      const values = palletsIds.map(palletId => [od_id, palletId]);
      await connection.query("INSERT INTO od_pallets (od_id, pallet_id) VALUES ?", [values]);
      
      // 🔥 CAMBIO: 'asignado' → 'despachado'
      const placeholders = palletsIds.map(() => '?').join(',');
      await connection.query(
        `UPDATE pallets SET estado = 'despachado' WHERE pallet_id IN (${placeholders})`,
        palletsIds
      );
      console.log("✅ Pallets asociados y estados actualizados a 'despachado'");
    }

    await connection.commit();
    console.log("✅✅✅ PEDIDO CREADO EXITOSAMENTE");

    return res.status(201).json({ 
      ok: true, 
      od_id, 
      od_code: nextCode,
      totales: {
        cantidad_pallets: cantidadPalletsTotal,
        peso_total: pesoTotalPrevisto.toFixed(3)
      }
    });

  } catch (err) {
    await connection.rollback();
    console.error("❌ createPedido - ERROR:", err);
    console.error("❌ SQL Message:", err.sqlMessage);
    
    const sqlMessage = err && (err.sqlMessage || err.message || String(err));
    return res.status(500).json({ 
      ok: false, 
      error: "Error al crear el pedido", 
      details: sqlMessage 
    });
  } finally {
    connection.release();
  }
}


/* PATCH /api/pedidos/:id */
async function updatePedido(req, res) {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const body = req.body || {};

    console.log("==> updatePedido - od_id:", id);
    console.log("==> updatePedido - body recibido:", JSON.stringify(body, null, 2));

    // 🔥 PASO 1: VALIDAR Y NORMALIZAR tipo_destino
    if (body.tipoDestino || body.tipo_destino) {
      let tipoDestino = body.tipoDestino || body.tipo_destino;
      
      // Convertir a minúsculas y eliminar espacios
      if (typeof tipoDestino === 'string') {
        tipoDestino = tipoDestino.toLowerCase().trim();
      }
      
      const tiposValidos = ['aeropuerto', 'puerto', 'otra_ciudad', 'regreso_planta'];
      
      if (!tiposValidos.includes(tipoDestino)) {
        console.warn(`⚠️ tipo_destino inválido: "${tipoDestino}"`);
        return res.status(400).json({ 
          ok: false, 
          error: `tipo_destino debe ser uno de: ${tiposValidos.join(', ')}`,
          received: tipoDestino
        });
      }
      
      body.tipoDestino = tipoDestino;
      body.tipo_destino = tipoDestino;
      console.log("✅ tipo_destino normalizado:", tipoDestino);
    }

    // 🔥 PASO 1: VALIDAR Y NORMALIZAR estado
    if (body.estado) {
      let estado = body.estado;
      
      // Convertir a minúsculas y eliminar espacios
      if (typeof estado === 'string') {
        estado = estado.toLowerCase().trim();
      }
      
      const estadosValidos = ['pendiente', 'en_carga', 'en_ruta', 'entregado', 'cancelado', 'rechazado'];
      
      if (!estadosValidos.includes(estado)) {
        console.warn(`⚠️ estado inválido: "${estado}"`);
        return res.status(400).json({ 
          ok: false, 
          error: `estado debe ser uno de: ${estadosValidos.join(', ')}`,
          received: estado
        });
      }
      
      body.estado = estado;
      console.log("✅ estado normalizado:", estado);
    }

    // Extraer palletsIds ANTES de procesar campos de la tabla
    const palletsIds = Array.isArray(body.palletsIds) 
      ? body.palletsIds 
      : (Array.isArray(body.pallets_ids) ? body.pallets_ids : null);

    // Mapear campos camelCase a snake_case y filtrar campos válidos
    const fieldMapping = {
      'clienteId': 'cliente_id',
      'tipoDestino': 'tipo_destino',
      'transportistaId': 'transportista_id',
      'camionId': 'camion_id',
      'choferId': 'chofer_id',
      'temperaturaConsigne': 'temperatura_consigne',
      'fechaProgramada': 'fecha_programada',
      'productoId': 'producto_id'
    };

    // Campos VÁLIDOS en la tabla orden_despacho
    const validColumns = [
      'od_code', 'cliente_id', 'destino', 'tipo_destino', 'producto_id', 'estado',
      'transportista_id', 'camion_id', 'chofer_id', 'observaciones',
      'temperatura_consigne', 'fecha_programada', 'fecha_carga',
      'fecha_descarga', 'fecha_llegada_puerto', 'codigo_contenedor',
      'codigo_precinto', 'numero_bl', 
      'cantidad_pallets_prevista', 'peso_total_previsto'
    ];

    const sets = [];
    const params = [];
    const processedColumns = new Set(); // 🔥 Evitar duplicados

    // Procesar solo campos válidos de la tabla orden_despacho
    for (const key in body) {
      // Ignorar palletsIds (se maneja después)
      if (key === 'palletsIds' || key === 'pallets_ids') {
        continue;
      }

      // Mapear camelCase a snake_case
      const dbColumn = fieldMapping[key] || key;

      // Solo agregar si es columna válida Y no se ha procesado ya
      if (validColumns.includes(dbColumn) && !processedColumns.has(dbColumn)) {
        processedColumns.add(dbColumn); // Marcar como procesado
        sets.push(`${dbColumn} = ?`);
        // 🔥 Usar el valor correcto: si existe body[dbColumn] usarlo, sino body[key]
        const value = body.hasOwnProperty(dbColumn) ? body[dbColumn] : body[key];
        params.push(value);
        console.log(`📝 Agregando campo: ${dbColumn} = ${value}`);
      } else if (validColumns.includes(dbColumn) && processedColumns.has(dbColumn)) {
        console.log(`⚠️ Campo duplicado ignorado: ${key} -> ${dbColumn}`);
      } else {
        console.warn(`⚠️ Campo ignorado (no es columna válida): ${key}`);
      }
    }

    await connection.beginTransaction();

    // Variables para calcular totales
    let cantidadPalletsTotal = 0;
    let pesoTotalPrevisto = 0;
    let productoIdFromPallets = null;

    // 1. Si hay palletsIds, calcular cantidad y peso total
    if (palletsIds && Array.isArray(palletsIds) && palletsIds.length > 0) {
      console.log("updatePedido - Calculando totales de pallets:", palletsIds);

      // Obtener información de los pallets
      const placeholders = palletsIds.map(() => '?').join(',');
      const [palletsInfo] = await connection.query(
        `SELECT producto_id, peso_total FROM pallets WHERE pallet_id IN (${placeholders})`,
        palletsIds
      );

      if (palletsInfo.length > 0) {
        cantidadPalletsTotal = palletsInfo.length;
        pesoTotalPrevisto = palletsInfo.reduce((sum, p) => sum + parseFloat(p.peso_total || 0), 0);
        productoIdFromPallets = palletsInfo[0].producto_id;

        console.log("✅ Totales calculados:", {
          cantidad: cantidadPalletsTotal,
          peso: pesoTotalPrevisto.toFixed(3),
          producto_id: productoIdFromPallets
        });

        // Agregar estos campos al UPDATE
        sets.push('cantidad_pallets_prevista = ?');
        params.push(cantidadPalletsTotal);
        
        sets.push('peso_total_previsto = ?');
        params.push(pesoTotalPrevisto);

        // Si no se envió producto_id en el body, usar el de los pallets
        if (!body.productoId && !body.producto_id && productoIdFromPallets) {
          sets.push('producto_id = ?');
          params.push(productoIdFromPallets);
          console.log("✅ producto_id obtenido de pallets:", productoIdFromPallets);
        }
      }
    }

    // 2. Actualizar campos de la tabla orden_despacho (si hay)
    if (sets.length > 0) {
      params.push(id);
      const sql = `
        UPDATE ordenes_despacho
        SET ${sets.join(", ")}
        WHERE od_id = ?
      `;
      
      console.log("updatePedido - SQL:", sql);
      console.log("updatePedido - params:", params);
      
      await connection.query(sql, params);
      console.log("✅ Campos de ordenes_despacho actualizados");
    }

    // 3. Actualizar pallets SI vinieron en el body
    if (palletsIds && Array.isArray(palletsIds)) {
      console.log("updatePedido - Actualizando pallets:", palletsIds);

      // 3.1. Obtener pallets actuales para liberar su estado
      const [currentPallets] = await connection.query(
        "SELECT pallet_id FROM od_pallets WHERE od_id = ?",
        [id]
      );
      
      const currentPalletIds = currentPallets.map(p => p.pallet_id);
      
      // 3.2. Liberar pallets anteriores (cambiar estado a 'en_camara')
      if (currentPalletIds.length > 0) {
        const placeholders = currentPalletIds.map(() => '?').join(',');
        await connection.query(
          `UPDATE pallets SET estado = 'en_camara' WHERE pallet_id IN (${placeholders})`,
          currentPalletIds
        );
        console.log("✅ Pallets anteriores liberados:", currentPalletIds);
      }

      // 3.3. Eliminar asociaciones anteriores
      await connection.query(
        "DELETE FROM od_pallets WHERE od_id = ?",
        [id]
      );
      console.log("✅ Asociaciones anteriores eliminadas");

      // 3.4. Insertar nuevas asociaciones
      if (palletsIds.length > 0) {
        const values = palletsIds.map(palletId => [id, palletId]);
        await connection.query(
          "INSERT INTO od_pallets (od_id, pallet_id) VALUES ?",
          [values]
        );
        console.log("✅ Nuevas asociaciones creadas:", palletsIds.length);

        // 3.5. Actualizar estado de nuevos pallets a 'despachado'
        const placeholders = palletsIds.map(() => '?').join(',');
        await connection.query(
          `UPDATE pallets SET estado = 'despachado' WHERE pallet_id IN (${placeholders})`,
          palletsIds
        );
        console.log("✅ Estados de pallets actualizados a 'despachado'");
      }
    }

    await connection.commit();
    console.log("✅ updatePedido - Transacción completada exitosamente");

    res.json({ 
      ok: true, 
      message: "Pedido actualizado exitosamente",
      totales: {
        cantidad_pallets: cantidadPalletsTotal,
        peso_total: pesoTotalPrevisto.toFixed(3)
      }
    });

  } catch (err) {
    await connection.rollback();
    console.error("❌ updatePedido - ERROR:", err);
    console.error("❌ SQL Message:", err.sqlMessage);
    
    const sqlMessage = err && (err.sqlMessage || err.message || String(err));
    res.status(500).json({ 
      ok: false, 
      error: "Error al actualizar pedido",
      details: sqlMessage 
    });
  } finally {
    connection.release();
  }
}

/* DELETE /api/pedidos/:id */
async function deletePedido(req, res) {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE ordenes_despacho SET estado = 'cancelado' WHERE od_id = ?",
      [id]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar el pedido" });
  }
}

/* GET /api/ordenes-despacho/pedidos/:id/pallets-disponibles */
async function getPalletsDisponiblesParaEditar(req, res) {
  try {
    const { id } = req.params;
    const { productoId } = req.query;

    console.log("==> getPalletsDisponiblesParaEditar - od_id:", id, "productoId:", productoId);

    if (!productoId) {
      return res.status(400).json({ 
        ok: false, 
        error: "productoId es requerido" 
      });
    }

    // 1. Obtener pallets YA asociados a este pedido
    const [palletsAsociados] = await pool.query(`
      SELECT 
        p.*,
        l.descripcion as lote_descripcion,
        'asociado' as origen
      FROM pallets p
      INNER JOIN od_pallets op ON p.pallet_id = op.pallet_id
      LEFT JOIN lotes l ON p.lote_id = l.lote_id
      WHERE op.od_id = ? AND p.producto_id = ?
    `, [id, productoId]);

    console.log(`✅ Pallets asociados: ${palletsAsociados.length}`);

    // 2. Obtener pallets disponibles en cámara del mismo producto
    const [palletsDisponibles] = await pool.query(`
      SELECT 
        p.*,
        l.descripcion as lote_descripcion,
        'disponible' as origen
      FROM pallets p
      LEFT JOIN lotes l ON p.lote_id = l.lote_id
      WHERE p.producto_id = ? 
      AND p.estado = 'en_camara'
      AND NOT EXISTS (
        SELECT 1 FROM od_pallets op WHERE op.pallet_id = p.pallet_id
      )
    `, [productoId]);

    console.log(`✅ Pallets disponibles: ${palletsDisponibles.length}`);

    // 3. Combinar ambos
    const todosPallets = [...palletsAsociados, ...palletsDisponibles];

    res.json(todosPallets);

  } catch (err) {
    console.error("❌ Error en getPalletsDisponiblesParaEditar:", err);
    res.status(500).json({ 
      ok: false, 
      error: "Error al obtener pallets",
      details: err.message 
    });
  }
}

/* GET /api/ordenes-despacho/pedidos/:id/pallets */
async function getPalletsDelPedido(req, res) {
  try {
    const { id } = req.params;
    
    console.log("==> getPalletsDelPedido - od_id:", id);
    
    const [pallets] = await pool.query(`
      SELECT 
        p.*,
        l.descripcion as lote_descripcion
      FROM pallets p
      INNER JOIN od_pallets op ON p.pallet_id = op.pallet_id
      LEFT JOIN lotes l ON p.lote_id = l.lote_id
      WHERE op.od_id = ?
      ORDER BY p.pallet_id
    `, [id]);
    
    console.log(`✅ Pallets encontrados: ${pallets.length}`);
    res.json(pallets);
  } catch (err) {
    console.error("❌ Error en getPalletsDelPedido:", err);
    res.status(500).json({ 
      ok: false, 
      error: "Error al obtener pallets del pedido",
      details: err.message 
    });
  }
}

module.exports = {
  getAllOrdenes,
  getKPIs,
  getPedidos,
  createPedido,
  updatePedido,
  deletePedido,
  getPalletsDisponiblesParaEditar,
  getPalletsDelPedido
};
