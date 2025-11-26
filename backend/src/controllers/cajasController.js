const db = require("../config/db");

/**
 * @desc    Registrar una caja escaneada mediante código QR
 * @route   POST /api/cajas/ingresar
 * @access  Public
 */
const ingresarCaja = async (req, res) => {
  try {
    // Soportar ambos formatos: antiguo (codigo_qr) y nuevo (caja_id con todos los datos)
    const { 
      codigo_qr,          // Formato antiguo
      caja_id,            // Formato nuevo
      producto_id,
      lote_id,
      sublote_id,
      tipo_caja,
      peso_neto,
      linea 
    } = req.body;

    // Usar caja_id si está presente, sino codigo_qr
    const codigoCaja = caja_id || codigo_qr;

    console.log("📦 Intento de ingresar caja:", req.body);

    // Validar datos requeridos
    if (!codigoCaja) {
      return res.status(400).json({
        success: false,
        message: "El código de caja (caja_id o codigo_qr) es requerido",
      });
    }

    if (!producto_id) {
      return res.status(400).json({
        success: false,
        message: "El producto_id es requerido",
      });
    }

    // Verificar que el código QR no esté duplicado en cajas
    const [existing] = await db.query(
      "SELECT * FROM cajas WHERE caja_id = ? LIMIT 1",
      [codigoCaja]
    );

    if (existing.length > 0) {
      console.log("⚠️  Caja duplicada:", codigoCaja);
      return res.status(400).json({
        success: false,
        message: `La caja ${codigoCaja} ya fue registrada anteriormente`,
      });
    }

    // Obtener información del producto
    let producto_nombre = null;
    const [producto] = await db.query(
      "SELECT nombre FROM productos WHERE producto_id = ? LIMIT 1",
      [producto_id]
    );
    if (producto.length > 0) {
      producto_nombre = producto[0].nombre;
    }

    // Si no se proporcionó lote_id/sublote_id, intentar obtener el más reciente
    let lote_final = lote_id;
    let sublote_final = sublote_id;

    if (!lote_final) {
      const [loteInfo] = await db.query(
        `SELECT l.lote_id, s.sublote_id 
         FROM lotes l
         LEFT JOIN sublotes s ON l.lote_id = s.lote_id
         WHERE l.producto_id = ?
         ORDER BY l.fecha_cosecha DESC, s.sublote_id DESC
         LIMIT 1`,
        [producto_id]
      );
      
      if (loteInfo.length > 0) {
        lote_final = loteInfo[0].lote_id;
        sublote_final = loteInfo[0].sublote_id;
      }
    }

    // Insertar la caja en la tabla cajas
    const timestamp = new Date();
    const [result] = await db.query(
      `INSERT INTO cajas 
       (caja_id, producto_id, lote_id, sublote_id, tipo_caja, peso_neto, etiqueta_qr, estado, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'en_planta', ?)`,
      [
        codigoCaja,
        producto_id,
        lote_final || null,
        sublote_final || null,
        tipo_caja || null,
        peso_neto || null,
        codigoCaja,  // etiqueta_qr es igual al caja_id
        timestamp
      ]
    );

    console.log("✅ Caja registrada en BD:", codigoCaja);

    // Preparar datos para WebSocket
    const cajaData = {
      codigo_qr: codigoCaja,
      caja_id: codigoCaja,
      id: codigoCaja,
      linea: linea || "A",
      producto_id,
      producto_nombre: producto_nombre || "Producto",
      lote_id: lote_final,
      sublote_id: sublote_final,
      tipo_caja,
      peso_neto,
      timestamp: timestamp.toISOString(),
    };

    // Emitir evento WebSocket
    const io = req.app.get("io");
    if (io) {
      io.emit("caja:ingresada", cajaData);
      console.log("📡 Evento WebSocket emitido:", cajaData);
    } else {
      console.warn("⚠️  Socket.io no disponible");
    }

    res.status(201).json({
      success: true,
      message: "Caja registrada exitosamente",
      caja: cajaData,
    });
  } catch (error) {
    console.error("❌ Error al ingresar caja:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al registrar la caja",
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener las últimas cajas ingresadas
 * @route   GET /api/cajas/recientes?limit=10
 * @access  Public
 */
const obtenerCajasRecientes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [cajas] = await db.query(
      `SELECT c.caja_id as codigo_qr, c.fecha_creacion as timestamp, 
              p.nombre as producto_nombre, c.lote_id, c.sublote_id
       FROM cajas c
       LEFT JOIN productos p ON c.producto_id = p.producto_id
       ORDER BY c.fecha_creacion DESC
       LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      cajas,
    });
  } catch (error) {
    console.error("Error al obtener cajas recientes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cajas recientes",
      error: error.message,
    });
  }
};

module.exports = {
  ingresarCaja,
  obtenerCajasRecientes,
};
