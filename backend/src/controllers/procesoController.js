const db = require('../config/db');

/**
 * @desc    Obtener todos los bins con filtros
 * @route   GET /api/proceso/bins
 * @access  Private
 * @query   ?producto_id=1&variedad_id=2&estado=recepcionado
 */
const getBinsConFiltros = async (req, res) => {
  try {
    const { producto_id, variedad_id, estado, lote_id } = req.query;
    
    let sql = `
      SELECT 
        b.bin_id,
        b.remito,
        b.fecha_cosecha,
        b.peso_bruto,
        b.estado_actual,
        b.fecha_ultimo_proceso,
        p.producto_id,
        p.nombre AS producto_nombre,
        p.categoria,
        v.variedad_id,
        v.nombre AS variedad_nombre,
        prod.nombre AS productor_nombre,
        f.nombre AS finca_nombre,
        l.lote_id,
        l.descripcion AS lote_descripcion,
        pa.proceso_id AS proceso_actual_id,
        pa.nombre AS proceso_actual_nombre,
        -- Contar procesos completados
        (SELECT COUNT(*) 
         FROM bin_procesos bp 
         WHERE bp.bin_id = b.bin_id 
         AND bp.estado = 'completado') AS procesos_completados,
        -- Total de procesos requeridos
        (SELECT COUNT(*) 
         FROM producto_procesos pp 
         WHERE pp.producto_id = b.producto_id 
         AND pp.es_opcional = FALSE) AS procesos_totales_obligatorios,
        -- Total incluyendo opcionales
        (SELECT COUNT(*) 
         FROM producto_procesos pp 
         WHERE pp.producto_id = b.producto_id) AS procesos_totales
      FROM bins b
      INNER JOIN productos p ON b.producto_id = p.producto_id
      LEFT JOIN variedades v ON b.variedad_id = v.variedad_id
      LEFT JOIN productores prod ON b.productor_id = prod.productor_id
      LEFT JOIN fincas f ON b.finca_id = f.finca_id
      LEFT JOIN lotes l ON b.lote_maestro_id = l.lote_id
      LEFT JOIN procesos_disponibles pa ON b.proceso_actual_id = pa.proceso_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Aplicar filtros
    if (producto_id) {
      sql += ' AND b.producto_id = ?';
      params.push(parseInt(producto_id));
    }
    
    if (variedad_id) {
      sql += ' AND b.variedad_id = ?';
      params.push(parseInt(variedad_id));
    }
    
    if (estado) {
      sql += ' AND b.estado_actual = ?';
      params.push(estado);
    }
    
    if (lote_id) {
      sql += ' AND l.lote_id = ?';
      params.push(parseInt(lote_id));
    }
    
    sql += ' ORDER BY b.fecha_cosecha DESC, b.bin_id DESC';
    
    const [bins] = await db.query(sql, params);
    
    res.status(200).json({
      success: true,
      data: bins,
      count: bins.length
    });
    
  } catch (error) {
    console.error('Error obteniendo bins:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener bins',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener procesos de un producto específico
 * @route   GET /api/proceso/productos/:productoId/procesos
 * @access  Private
 */
const getProcesosPorProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    
    const [procesos] = await db.query(`
      SELECT 
        pp.id,
        pp.orden,
        pp.es_opcional,
        pp.tiempo_estimado,
        pp.notas,
        pd.proceso_id,
        pd.nombre,
        pd.descripcion,
        pd.icono
      FROM producto_procesos pp
      INNER JOIN procesos_disponibles pd ON pp.proceso_id = pd.proceso_id
      WHERE pp.producto_id = ?
      ORDER BY pp.orden ASC
    `, [productoId]);
    
    res.status(200).json({
      success: true,
      data: procesos,
      count: procesos.length
    });
    
  } catch (error) {
    console.error('Error obteniendo procesos del producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener procesos del producto',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener historial de procesos de un bin
 * @route   GET /api/proceso/bins/:binId/historial
 * @access  Private
 */
const getHistorialProcesoBin = async (req, res) => {
  try {
    const { binId } = req.params;
    
    const [historial] = await db.query(`
      SELECT 
        bp.id,
        bp.fecha_inicio,
        bp.fecha_fin,
        bp.estado,
        bp.operario,
        bp.temperatura,
        bp.peso_entrada,
        bp.peso_salida,
        bp.calibre,
        bp.observaciones,
        pd.proceso_id,
        pd.nombre AS proceso_nombre,
        pd.descripcion AS proceso_descripcion,
        pd.icono,
        u.nombre AS usuario_nombre
      FROM bin_procesos bp
      INNER JOIN procesos_disponibles pd ON bp.proceso_id = pd.proceso_id
      LEFT JOIN users u ON bp.usuario_id = u.user_id
      WHERE bp.bin_id = ?
      ORDER BY bp.fecha_inicio DESC
    `, [binId]);
    
    res.status(200).json({
      success: true,
      data: historial,
      count: historial.length
    });
    
  } catch (error) {
    console.error('Error obteniendo historial del bin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial del bin',
      error: error.message
    });
  }
};

/**
 * @desc    Registrar un proceso para un bin
 * @route   POST /api/proceso/bins/:binId/registrar
 * @access  Private
 */
const registrarProcesoBin = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { binId } = req.params;
    const {
      proceso_id,
      operario,
      temperatura,
      peso_entrada,
      peso_salida,
      calibre,
      observaciones
    } = req.body;
    
    // Validaciones
    if (!proceso_id) {
      return res.status(400).json({
        success: false,
        message: 'El proceso_id es obligatorio'
      });
    }
    
    // Verificar que el bin existe
    const [binExists] = await connection.query(
      'SELECT bin_id, producto_id, lote_maestro_id FROM bins WHERE bin_id = ?',
      [binId]
    );
    
    if (binExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bin no encontrado'
      });
    }
    
    const bin = binExists[0];
    
    // Verificar que el proceso pertenece al producto
    const [procesoValido] = await connection.query(`
      SELECT pp.id 
      FROM producto_procesos pp 
      WHERE pp.producto_id = ? AND pp.proceso_id = ?
    `, [bin.producto_id, proceso_id]);
    
    if (procesoValido.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Este proceso no aplica para el producto del bin'
      });
    }
    
    const usuario_id = req.user?.user_id || null;
    
    await connection.beginTransaction();
    
    // Insertar registro del proceso
    const [result] = await connection.query(`
      INSERT INTO bin_procesos (
        bin_id,
        proceso_id,
        lote_id,
        fecha_inicio,
        fecha_fin,
        estado,
        operario,
        usuario_id,
        temperatura,
        peso_entrada,
        peso_salida,
        calibre,
        observaciones
      ) VALUES (?, ?, ?, NOW(), NOW(), 'completado', ?, ?, ?, ?, ?, ?, ?)
    `, [
      binId,
      proceso_id,
      bin.lote_maestro_id,
      operario || 'Sistema',
      usuario_id,
      temperatura || null,
      peso_entrada || null,
      peso_salida || null,
      calibre || null,
      observaciones || null
    ]);
    
    // El trigger ya actualiza el estado del bin, pero por si acaso:
    await connection.query(`
      UPDATE bins 
      SET 
        proceso_actual_id = ?,
        fecha_ultimo_proceso = NOW(),
        estado_actual = (SELECT nombre FROM procesos_disponibles WHERE proceso_id = ?)
      WHERE bin_id = ?
    `, [proceso_id, proceso_id, binId]);
    
    // Registrar en audit_logs
    await connection.query(`
      INSERT INTO audit_logs (tabla, registro_id, accion, usuario_id, detalles)
      VALUES ('bin_procesos', ?, 'CREATE', ?, ?)
    `, [
      result.insertId.toString(),
      usuario_id,
      JSON.stringify({
        bin_id: binId,
        proceso_id: proceso_id,
        operario: operario
      })
    ]);
    
    await connection.commit();
    
    // Obtener datos del proceso registrado
    const [procesoRegistrado] = await connection.query(`
      SELECT 
        bp.*,
        pd.nombre AS proceso_nombre,
        pd.descripcion AS proceso_descripcion
      FROM bin_procesos bp
      INNER JOIN procesos_disponibles pd ON bp.proceso_id = pd.proceso_id
      WHERE bp.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Proceso registrado exitosamente',
      data: procesoRegistrado[0]
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error registrando proceso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar proceso',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Obtener productos con sus variedades (para filtros)
 * @route   GET /api/proceso/productos
 * @access  Private
 */
const getProductosConVariedades = async (req, res) => {
  try {
    const [productos] = await db.query(`
      SELECT 
        p.producto_id,
        p.nombre AS producto_nombre,
        p.categoria
      FROM productos p
      WHERE p.perecedero = TRUE
      ORDER BY p.nombre
    `);
    
    // Obtener variedades de cada producto
    for (let producto of productos) {
      const [variedades] = await db.query(`
        SELECT 
          variedad_id,
          nombre
        FROM variedades
        WHERE producto_id = ?
        ORDER BY nombre
      `, [producto.producto_id]);
      
      producto.variedades = variedades;
    }
    
    res.status(200).json({
      success: true,
      data: productos,
      count: productos.length
    });
    
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener estadísticas de la línea de proceso
 * @route   GET /api/proceso/estadisticas
 * @access  Private
 */
const getEstadisticasProceso = async (req, res) => {
  try {
    // Total de bins por estado
    const [estadosBins] = await db.query(`
      SELECT 
        estado_actual,
        COUNT(*) as cantidad
      FROM bins
      GROUP BY estado_actual
      ORDER BY cantidad DESC
    `);
    
    // Procesos más utilizados hoy
    const [procesosHoy] = await db.query(`
      SELECT 
        pd.nombre AS proceso_nombre,
        COUNT(*) as cantidad
      FROM bin_procesos bp
      INNER JOIN procesos_disponibles pd ON bp.proceso_id = pd.proceso_id
      WHERE DATE(bp.fecha_inicio) = CURDATE()
      GROUP BY bp.proceso_id
      ORDER BY cantidad DESC
      LIMIT 10
    `);
    
    // Bins en proceso actualmente
    const [binsEnProceso] = await db.query(`
      SELECT COUNT(*) as cantidad
      FROM bin_procesos
      WHERE estado = 'en_proceso'
    `);
    
    res.status(200).json({
      success: true,
      data: {
        bins_por_estado: estadosBins,
        procesos_hoy: procesosHoy,
        bins_en_proceso: binsEnProceso[0].cantidad
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

module.exports = {
  getBinsConFiltros,
  getProcesosPorProducto,
  getHistorialProcesoBin,
  registrarProcesoBin,
  getProductosConVariedades,
  getEstadisticasProceso
};