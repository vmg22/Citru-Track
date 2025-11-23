const db = require('../config/db');

/**
 * @desc    Obtener bins disponibles para agrupar en lote
 * @route   GET /api/lotes-maestros/bins-disponibles
 * @access  Private
 * @query   ?producto_id=1&variedad_id=2&calibre=88
 */
const getBinsDisponibles = async (req, res) => {
  try {
    const { producto_id, variedad_id, calibre } = req.query;
    
    let sql = `
      SELECT 
        b.bin_id,
        b.remito,
        b.fecha_cosecha,
        b.peso_bruto,
        b.calibre,
        b.estado_actual,
        b.aprobado,
        b.fecha_aprobacion,
        p.producto_id,
        p.nombre AS producto_nombre,
        v.variedad_id,
        v.nombre AS variedad_nombre,
        prod.nombre AS productor_nombre,
        f.nombre AS finca_nombre,
        (SELECT COUNT(*) 
         FROM bin_procesos bp 
         WHERE bp.bin_id = b.bin_id 
         AND bp.estado = 'completado') AS procesos_completados,
        (SELECT COUNT(*) 
         FROM producto_procesos pp 
         WHERE pp.producto_id = b.producto_id 
         AND pp.es_opcional = FALSE) AS procesos_requeridos
      FROM bins b
      INNER JOIN productos p ON b.producto_id = p.producto_id
      LEFT JOIN variedades v ON b.variedad_id = v.variedad_id
      LEFT JOIN productores prod ON b.productor_id = prod.productor_id
      LEFT JOIN fincas f ON b.finca_id = f.finca_id
      WHERE b.aprobado = TRUE
        AND b.lote_maestro_id IS NULL
        AND b.calibre IS NOT NULL
    `;
    
    const params = [];
    
    if (producto_id) {
      sql += ' AND b.producto_id = ?';
      params.push(parseInt(producto_id));
    }
    
    if (variedad_id) {
      sql += ' AND b.variedad_id = ?';
      params.push(parseInt(variedad_id));
    }
    
    if (calibre) {
      sql += ' AND b.calibre = ?';
      params.push(calibre);
    }
    
    sql += ' ORDER BY b.fecha_aprobacion DESC';
    
    const [bins] = await db.query(sql, params);
    
    res.status(200).json({
      success: true,
      data: bins,
      count: bins.length
    });
    
  } catch (error) {
    console.error('Error obteniendo bins disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener bins disponibles',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener bins pendientes de aprobar
 * @route   GET /api/lotes-maestros/bins-pendientes
 * @access  Private
 * @query   ?producto_id=1&variedad_id=2
 */
const getBinsPendientesAprobar = async (req, res) => {
  try {
    const { producto_id, variedad_id } = req.query;
    
    let sql = `
      SELECT 
        b.bin_id,
        b.remito,
        b.fecha_cosecha,
        b.peso_bruto,
        b.calibre,
        b.estado_actual,
        b.aprobado,
        p.producto_id,
        p.nombre AS producto_nombre,
        v.variedad_id,
        v.nombre AS variedad_nombre,
        prod.nombre AS productor_nombre,
        (SELECT COUNT(*) 
         FROM bin_procesos bp 
         WHERE bp.bin_id = b.bin_id 
         AND bp.estado = 'completado') AS procesos_completados,
        (SELECT COUNT(*) 
         FROM producto_procesos pp 
         WHERE pp.producto_id = b.producto_id 
         AND pp.es_opcional = FALSE) AS procesos_requeridos
      FROM bins b
      INNER JOIN productos p ON b.producto_id = p.producto_id
      LEFT JOIN variedades v ON b.variedad_id = v.variedad_id
      LEFT JOIN productores prod ON b.productor_id = prod.productor_id
      WHERE b.aprobado = FALSE
        AND (SELECT COUNT(*) 
             FROM bin_procesos bp 
             WHERE bp.bin_id = b.bin_id 
             AND bp.estado = 'completado') >= 
            (SELECT COUNT(*) 
             FROM producto_procesos pp 
             WHERE pp.producto_id = b.producto_id 
             AND pp.es_opcional = FALSE)
    `;
    
    const params = [];
    
    if (producto_id) {
      sql += ' AND b.producto_id = ?';
      params.push(parseInt(producto_id));
    }
    
    if (variedad_id) {
      sql += ' AND b.variedad_id = ?';
      params.push(parseInt(variedad_id));
    }
    
    sql += ' ORDER BY b.fecha_ultimo_proceso DESC';
    
    const [bins] = await db.query(sql, params);
    
    res.status(200).json({
      success: true,
      data: bins,
      count: bins.length
    });
    
  } catch (error) {
    console.error('Error obteniendo bins pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener bins pendientes',
      error: error.message
    });
  }
};

/**
 * @desc    Aprobar bin para lote
 * @route   POST /api/lotes-maestros/bins/:binId/aprobar
 * @access  Private
 * @body    { calibre: "88" }
 */
const aprobarBin = async (req, res) => {
  try {
    const { binId } = req.params;
    const { calibre } = req.body;
    
    if (!calibre) {
      return res.status(400).json({
        success: false,
        message: 'El calibre es obligatorio'
      });
    }
    
    const usuario_id = req.user?.user_id || null;
    
    // Llamar al procedimiento almacenado
    await db.query('CALL sp_aprobar_bin(?, ?, ?)', [binId, calibre, usuario_id]);
    
    // Obtener el bin actualizado
    const [binActualizado] = await db.query(`
      SELECT 
        b.*,
        p.nombre AS producto_nombre,
        v.nombre AS variedad_nombre
      FROM bins b
      INNER JOIN productos p ON b.producto_id = p.producto_id
      LEFT JOIN variedades v ON b.variedad_id = v.variedad_id
      WHERE b.bin_id = ?
    `, [binId]);
    
    res.status(200).json({
      success: true,
      message: 'Bin aprobado exitosamente',
      data: binActualizado[0]
    });
    
  } catch (error) {
    console.error('Error aprobando bin:', error);
    res.status(500).json({
      success: false,
      message: error.sqlMessage || 'Error al aprobar bin',
      error: error.message
    });
  }
};

/**
 * @desc    Crear lote maestro
 * @route   POST /api/lotes-maestros
 * @access  Private
 * @body    { producto_id, variedad_id, calibre, descripcion, responsable }
 */
const crearLoteMaestro = async (req, res) => {
  try {
    const { producto_id, variedad_id, calibre, descripcion, responsable } = req.body;
    
    if (!producto_id || !variedad_id || !calibre) {
      return res.status(400).json({
        success: false,
        message: 'Producto, variedad y calibre son obligatorios'
      });
    }
    
    const usuario_id = req.user?.user_id || null;
    
    // Generar descripción automática si no se proporciona
    const [productoInfo] = await db.query(`
      SELECT 
        p.nombre AS producto_nombre,
        v.nombre AS variedad_nombre
      FROM productos p
      LEFT JOIN variedades v ON v.variedad_id = ?
      WHERE p.producto_id = ?
    `, [variedad_id, producto_id]);
    
    const descripcionFinal = descripcion || 
      `Lote ${productoInfo[0].producto_nombre} ${productoInfo[0].variedad_nombre} - Calibre ${calibre} - ${new Date().toLocaleDateString()}`;
    
    // Llamar al procedimiento almacenado
    const [result] = await db.query(
      'CALL sp_crear_lote_maestro(?, ?, ?, ?, ?, ?, @lote_id)',
      [producto_id, variedad_id, calibre, descripcionFinal, responsable || 'Sistema', usuario_id]
    );
    
    // Obtener el lote_id generado
    const [loteId] = await db.query('SELECT @lote_id as lote_id');
    
    // Obtener el lote completo
    const [loteCreado] = await db.query(`
      SELECT * FROM vw_lotes_maestros WHERE lote_id = ?
    `, [loteId[0].lote_id]);
    
    res.status(201).json({
      success: true,
      message: 'Lote maestro creado exitosamente',
      data: loteCreado[0]
    });
    
  } catch (error) {
    console.error('Error creando lote maestro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear lote maestro',
      error: error.message
    });
  }
};

/**
 * @desc    Agregar bins a lote maestro
 * @route   POST /api/lotes-maestros/:loteId/bins
 * @access  Private
 * @body    { bins: ["BIN-001", "BIN-002"] }
 */
const agregarBinsALote = async (req, res) => {
  try {
    const { loteId } = req.params;
    const { bins } = req.body;
    
    if (!bins || !Array.isArray(bins) || bins.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un bin'
      });
    }
    
    const usuario_id = req.user?.user_id || null;
    
    const errores = [];
    const exitosos = [];
    
    // Procesar cada bin
    for (const binId of bins) {
      try {
        await db.query('CALL sp_agregar_bin_a_lote(?, ?, ?)', [loteId, binId, usuario_id]);
        exitosos.push(binId);
      } catch (error) {
        errores.push({
          bin_id: binId,
          error: error.sqlMessage || error.message
        });
      }
    }
    
    // Obtener el lote actualizado
    const [loteActualizado] = await db.query(`
      SELECT * FROM vw_lotes_maestros WHERE lote_id = ?
    `, [loteId]);
    
    res.status(200).json({
      success: true,
      message: `${exitosos.length} bins agregados exitosamente`,
      data: {
        lote: loteActualizado[0],
        bins_agregados: exitosos,
        bins_con_error: errores
      }
    });
    
  } catch (error) {
    console.error('Error agregando bins:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar bins al lote',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener todos los lotes maestros
 * @route   GET /api/lotes-maestros
 * @access  Private
 * @query   ?producto_id=1&variedad_id=2&calibre=88&estado=abierto
 */
const getLotesMaestros = async (req, res) => {
  try {
    const { producto_id, variedad_id, calibre, estado } = req.query;
    
    let sql = 'SELECT * FROM vw_lotes_maestros WHERE 1=1';
    const params = [];
    
    if (producto_id) {
      sql += ' AND producto_id = ?';
      params.push(parseInt(producto_id));
    }
    
    if (variedad_id) {
      sql += ' AND variedad_id = ?';
      params.push(parseInt(variedad_id));
    }
    
    if (calibre) {
      sql += ' AND calibre = ?';
      params.push(calibre);
    }
    
    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }
    
    sql += ' ORDER BY fecha_ingreso DESC';
    
    const [lotes] = await db.query(sql, params);
    
    res.status(200).json({
      success: true,
      data: lotes,
      count: lotes.length
    });
    
  } catch (error) {
    console.error('Error obteniendo lotes maestros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lotes maestros',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener detalle de un lote maestro con sus bins
 * @route   GET /api/lotes-maestros/:loteId
 * @access  Private
 */
const getDetalleLoteMaestro = async (req, res) => {
  try {
    const { loteId } = req.params;
    
    // Obtener información del lote
    const [lote] = await db.query(`
      SELECT * FROM vw_lotes_maestros WHERE lote_id = ?
    `, [loteId]);
    
    if (lote.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lote maestro no encontrado'
      });
    }
    
    // Obtener bins del lote
    const [bins] = await db.query(`
      SELECT * FROM vw_lote_maestro_detalle WHERE lote_id = ?
    `, [loteId]);
    
    res.status(200).json({
      success: true,
      data: {
        lote: lote[0],
        bins: bins
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo detalle del lote:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle del lote',
      error: error.message
    });
  }
};

/**
 * @desc    Cerrar lote maestro
 * @route   PUT /api/lotes-maestros/:loteId/cerrar
 * @access  Private
 */
const cerrarLoteMaestro = async (req, res) => {
  try {
    const { loteId } = req.params;
    
    await db.query(`
      UPDATE lotes 
      SET 
        cerrado = TRUE,
        fecha_cierre = NOW(),
        estado = 'cerrado',
        updated_at = NOW()
      WHERE lote_id = ? AND es_lote_maestro = TRUE
    `, [loteId]);
    
    const [loteActualizado] = await db.query(`
      SELECT * FROM vw_lotes_maestros WHERE lote_id = ?
    `, [loteId]);
    
    res.status(200).json({
      success: true,
      message: 'Lote maestro cerrado exitosamente',
      data: loteActualizado[0]
    });
    
  } catch (error) {
    console.error('Error cerrando lote maestro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar lote maestro',
      error: error.message
    });
  }
};

/**
 * @desc    Quitar bin de lote maestro
 * @route   DELETE /api/lotes-maestros/:loteId/bins/:binId
 * @access  Private
 */
const quitarBinDeLote = async (req, res) => {
  try {
    const { loteId, binId } = req.params;
    
    // Verificar que el lote no esté cerrado
    const [lote] = await db.query(`
      SELECT cerrado FROM lotes WHERE lote_id = ? AND es_lote_maestro = TRUE
    `, [loteId]);
    
    if (lote.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lote maestro no encontrado'
      });
    }
    
    if (lote[0].cerrado) {
      return res.status(400).json({
        success: false,
        message: 'No se puede quitar bins de un lote cerrado'
      });
    }
    
    // Eliminar la relación (los triggers actualizarán el lote)
    await db.query(`
      DELETE FROM lote_bins WHERE lote_id = ? AND bin_id = ?
    `, [loteId, binId]);
    
    res.status(200).json({
      success: true,
      message: 'Bin quitado del lote exitosamente'
    });
    
  } catch (error) {
    console.error('Error quitando bin del lote:', error);
    res.status(500).json({
      success: false,
      message: 'Error al quitar bin del lote',
      error: error.message
    });
  }
};

module.exports = {
  getBinsDisponibles,
  getBinsPendientesAprobar,
  aprobarBin,
  crearLoteMaestro,
  agregarBinsALote,
  getLotesMaestros,
  getDetalleLoteMaestro,
  cerrarLoteMaestro,
  quitarBinDeLote
};