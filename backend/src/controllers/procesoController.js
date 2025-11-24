const db = require('../config/db');

/**
 * 1. OBTENER BINS CON FILTROS
 */
const getBinsConFiltros = async (req, res) => {
  try {
    const { producto_id, variedad_id, estado, lote_id } = req.query;
    
    let sql = `
      SELECT 
        b.bin_id, b.remito, b.fecha_cosecha, b.peso_bruto, b.estado_actual, 
        b.fecha_ultimo_proceso, b.cerrado,
        p.producto_id, p.nombre AS producto_nombre, p.categoria,
        v.variedad_id, v.nombre AS variedad_nombre,
        prod.nombre AS productor_nombre,
        f.nombre AS finca_nombre,
        l.lote_id, l.descripcion AS lote_descripcion,
        pa.proceso_id AS proceso_actual_id, pa.nombre AS proceso_actual_nombre,
        (SELECT COUNT(*) FROM bin_procesos bp WHERE bp.bin_id = b.bin_id AND bp.estado = 'completado') AS procesos_completados,
        (SELECT COUNT(*) FROM producto_procesos pp WHERE pp.producto_id = b.producto_id AND pp.es_opcional = FALSE) AS procesos_totales_obligatorios
      FROM bins b
      INNER JOIN productos p ON b.producto_id = p.producto_id
      LEFT JOIN variedades v ON b.variedad_id = v.variedad_id
      LEFT JOIN productores prod ON b.productor_id = prod.productor_id
      LEFT JOIN fincas f ON b.finca_id = f.finca_id
      LEFT JOIN lotes l ON b.lote_maestro_id = l.lote_id
      LEFT JOIN procesos_disponibles pa ON b.proceso_actual_id = pa.proceso_id
      WHERE b.cerrado = 0 
    `;
    
    const params = [];
    
    if (producto_id) { sql += ' AND b.producto_id = ?'; params.push(parseInt(producto_id)); }
    if (variedad_id) { sql += ' AND b.variedad_id = ?'; params.push(parseInt(variedad_id)); }
    if (estado) { sql += ' AND b.estado_actual = ?'; params.push(estado); }
    if (lote_id) { sql += ' AND l.lote_id = ?'; params.push(parseInt(lote_id)); }
    
    sql += ' ORDER BY b.fecha_cosecha DESC, b.bin_id DESC';
    
    const [bins] = await db.query(sql, params);
    
    res.status(200).json({ success: true, data: bins, count: bins.length });
  } catch (error) {
    console.error('❌ Error obteniendo bins:', error);
    res.status(500).json({ success: false, message: 'Error al obtener bins', error: error.message });
  }
};

/**
 * 2. OBTENER PROCESOS DISPONIBLES POR PRODUCTO
 */
const getProcesosPorProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    const [procesos] = await db.query(`
      SELECT pp.id, pp.orden, pp.es_opcional, pp.tiempo_estimado, pp.notas,
             pd.proceso_id, pd.nombre, pd.descripcion, pd.icono
      FROM producto_procesos pp
      INNER JOIN procesos_disponibles pd ON pp.proceso_id = pd.proceso_id
      WHERE pp.producto_id = ?
      ORDER BY pp.orden ASC
    `, [productoId]);
    
    res.status(200).json({ success: true, data: procesos, count: procesos.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener procesos', error: error.message });
  }
};

/**
 * 3. OBTENER HISTORIAL DE UN BIN
 */
const getHistorialProcesoBin = async (req, res) => {
  try {
    const { binId } = req.params;
    const [historial] = await db.query(`
      SELECT bp.*, pd.nombre AS proceso_nombre, pd.descripcion AS proceso_descripcion, 
             pd.icono, u.nombre AS usuario_nombre
      FROM bin_procesos bp
      INNER JOIN procesos_disponibles pd ON bp.proceso_id = pd.proceso_id
      LEFT JOIN users u ON bp.usuario_id = u.user_id
      WHERE bp.bin_id = ?
      ORDER BY bp.fecha_inicio DESC
    `, [binId]);
    
    res.status(200).json({ success: true, data: historial, count: historial.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error historial', error: error.message });
  }
};

/**
 * 4. OBTENER PRODUCTOS PARA FILTROS
 */
const getProductosConVariedades = async (req, res) => {
  try {
    const [productos] = await db.query(`
      SELECT p.producto_id, p.nombre AS producto_nombre, p.categoria 
      FROM productos p 
      
      ORDER BY p.nombre
    `);
    
    for (let producto of productos) {
      const [variedades] = await db.query(`
        SELECT variedad_id, nombre 
        FROM variedades 
        WHERE producto_id = ? 
        ORDER BY nombre
      `, [producto.producto_id]);
      producto.variedades = variedades;
    }
    
    res.status(200).json({ success: true, data: productos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error productos', error: error.message });
  }
};

/**
 * 5. OBTENER CAMPOS DINÁMICOS
 */
const getCamposClasificacion = async (req, res) => {
  try {
    const { productoId } = req.params;
    const [campos] = await db.query(`
      SELECT * FROM producto_campos_clasificacion 
      WHERE producto_id = ? AND activo = 1 
      ORDER BY orden ASC
    `, [productoId]);
    
    res.status(200).json({ success: true, data: campos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. REGISTRAR PROCESO Y CERRAR BIN
 */
const registrarProcesoBin = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { binId } = req.params;
    const { 
      proceso_id, operario, temperatura, peso_entrada, peso_salida, 
      observaciones, atributos_calidad, cerrar_bin 
    } = req.body;

    const usuario_id = req.user?.user_id || null;

    // Verificar Bin
    const [binData] = await connection.query(
      'SELECT producto_id, lote_maestro_id FROM bins WHERE bin_id = ?', 
      [binId]
    );
    
    if (binData.length === 0) {
      throw new Error('Bin no encontrado');
    }

    await connection.beginTransaction();

    // A. Insertar el proceso
    await connection.query(`
      INSERT INTO bin_procesos (
        bin_id, proceso_id, lote_id, fecha_inicio, fecha_fin, estado, 
        operario, usuario_id, temperatura, peso_entrada, peso_salida, 
        observaciones, atributos_calidad
      ) VALUES (?, ?, ?, NOW(), NOW(), 'completado', ?, ?, ?, ?, ?, ?, ?)
    `, [
      binId, 
      proceso_id, 
      binData[0].lote_maestro_id,
      operario || 'Sistema', 
      usuario_id, 
      temperatura || null, 
      peso_entrada || null, 
      peso_salida || null, 
      observaciones || null,
      JSON.stringify(atributos_calidad || {})
    ]);

    // B. Actualizar estado del Bin
    let nuevoEstado = 'En Proceso';
    const [procInfo] = await connection.query(
      'SELECT nombre FROM procesos_disponibles WHERE proceso_id = ?', 
      [proceso_id]
    );
    
    if (procInfo.length > 0) {
      nuevoEstado = procInfo[0].nombre;
    }

    // Si se marca "Cerrar Bin"
    if (cerrar_bin) {
      nuevoEstado = 'Pendiente Lote';
      console.log(`🔒 Cerrando bin ${binId} para loteo`);
    }

    await connection.query(`
      UPDATE bins 
      SET 
        proceso_actual_id = ?, 
        fecha_ultimo_proceso = NOW(),
        estado_actual = ?,
        cerrado = ?
      WHERE bin_id = ?
    `, [proceso_id, nuevoEstado, cerrar_bin ? 1 : 0, binId]);

    await connection.commit();
    
    console.log(`✅ Proceso registrado para bin ${binId}. Cerrado: ${cerrar_bin ? 'SÍ' : 'NO'}`);
    
    res.status(201).json({ 
      success: true, 
      message: 'Proceso registrado correctamente',
      bin_cerrado: cerrar_bin ? true : false
    });

  } catch (error) {
    await connection.rollback();
    console.error("❌ Error en registrarProcesoBin:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

/**
 * 7. OBTENER BINS PENDIENTES DE LOTEO ⭐ CORREGIDO
 */
const getBinsPendientesLote = async (req, res) => {
  try {
    const { producto_id } = req.query;

    // Validación rápida
    if (!producto_id) return res.status(400).json({ message: 'Falta producto_id' });

    const sql = `
      SELECT 
        b.bin_id, 
        b.peso_bruto, 
        b.estado_actual, 
        v.nombre as variedad_nombre,
        (SELECT atributos_calidad FROM bin_procesos WHERE bin_id = b.bin_id ORDER BY id DESC LIMIT 1) as ultimo_proceso_datos
      FROM bins b
      LEFT JOIN variedades v ON b.variedad_id = v.variedad_id
      WHERE b.producto_id = ? 
        AND b.cerrado = 1 
        -- AQUÍ ESTÁ LA CLAVE: Que no esté ya metido en la tabla intermedia
        AND NOT EXISTS (SELECT 1 FROM lote_bins lb WHERE lb.bin_id = b.bin_id)
      ORDER BY b.bin_id DESC
    `;

    const [bins] = await db.query(sql, [producto_id]);
    res.status(200).json({ success: true, data: bins });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 8. CREAR LOTE MAESTRO ⭐ CORREGIDO
 */
const crearLoteDesdeBins = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { bins_ids, producto_id, observaciones } = req.body;

    if (!bins_ids || bins_ids.length === 0) throw new Error("No hay bins seleccionados");

    await connection.beginTransaction();

    // 1. Calcular totales (Peso y Cantidad)
    // Usamos '?' por cada bin seleccionado para evitar inyección SQL
    const placeholders = bins_ids.map(() => '?').join(',');
    const [totales] = await connection.query(
        `SELECT SUM(peso_bruto) as peso_total, COUNT(*) as cantidad 
         FROM bins WHERE bin_id IN (${placeholders})`, 
        bins_ids
    );

    // 2. Generar Código de Lote
    const codigoLote = `LOTE-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // 3. INSERTAR EN LA TABLA 'LOTES' (Cabecera)
    // Nota: Ajusta 'descripcion' o 'codigo_lote' según cómo uses tu columna 'descripcion'
    const [loteRes] = await connection.query(`
        INSERT INTO lotes (
            producto_id, descripcion, cantidad_bins, peso_total, 
            es_lote_maestro, estado, fecha_ingreso, cerrado
        ) VALUES (?, ?, ?, ?, 1, 'Abierto', NOW(), 0)
    `, [
        producto_id, 
        codigoLote, // Usamos el código como descripción por ahora
        totales[0].cantidad, 
        totales[0].peso_total
    ]);

    const nuevoLoteId = loteRes.insertId;

    // 4. INSERTAR EN LA TABLA INTERMEDIA 'LOTE_BINS' (Detalle)
    // Preparamos un array de arrays para hacer un INSERT masivo
    const binsValues = bins_ids.map(binId => [
        nuevoLoteId, 
        binId, 
        new Date(), // fecha_agregado
        // Aquí podrías necesitar buscar el peso individual de nuevo si lo quieres guardar exacto
        // Ojo: Si 'peso_bin' es obligatorio en tu tabla lote_bins, avísame para ajustar la query.
        0, // peso_bin (placeholder, idealmente deberías traer el peso real)
        'N/A' // calibre_bin (placeholder)
    ]);

    // Para hacerlo bien, hagamos un INSERT SELECT para llenar los datos reales
    // Esto es mucho más eficiente y preciso:
    await connection.query(`
        INSERT INTO lote_bins (lote_id, bin_id, fecha_agregado, peso_bin, calibre_bin)
        SELECT ?, bin_id, NOW(), peso_bruto, calibre 
        FROM bins WHERE bin_id IN (${placeholders})
    `, [nuevoLoteId, ...bins_ids]);


    // 5. ACTUALIZAR ESTADO EN TABLA 'BINS'
    await connection.query(`
        UPDATE bins SET estado_actual = 'Loteado' 
        WHERE bin_id IN (${placeholders})
    `, bins_ids);

    await connection.commit();
    res.status(201).json({ success: true, message: 'Lote creado con éxito', lote_id: nuevoLoteId });

  } catch (error) {
    await connection.rollback();
    console.error("Error creando lote:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

/**
 * 9. ESTADÍSTICAS
 */
const getEstadisticasProceso = async (req, res) => {
  try {
    res.json({ success: true, message: "Estadísticas placeholder" }); 
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getLotesCreados = async (req, res) => {
  try {
    const [lotes] = await db.query(`
      SELECT 
        l.lote_id, 
        l.descripcion AS codigo_lote,  -- <--- CORRECCIÓN AQUÍ: Usamos 'descripcion' como 'codigo_lote'
        l.descripcion,                 -- También lo dejamos como descripción por si acaso
        l.cantidad_bins, 
        l.peso_total, 
        l.fecha_ingreso,
        p.nombre AS producto_nombre,
        l.estado
      FROM lotes l
      INNER JOIN productos p ON l.producto_id = p.producto_id
      ORDER BY l.fecha_ingreso DESC
      LIMIT 50
    `);

    res.status(200).json({ success: true, data: lotes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDetalleLote = async (req, res) => {
  try {
    const { loteId } = req.params;
    
    const [bins] = await db.query(`
      SELECT 
        lb.bin_id, 
        lb.peso_bin, 
        v.nombre as variedad_nombre,
        -- Traemos el último JSON de calidad registrado para este bin
        (SELECT atributos_calidad 
         FROM bin_procesos 
         WHERE bin_id = lb.bin_id 
         ORDER BY id DESC LIMIT 1) as datos_calidad
      FROM lote_bins lb
      INNER JOIN bins b ON lb.bin_id = b.bin_id
      LEFT JOIN variedades v ON b.variedad_id = v.variedad_id
      WHERE lb.lote_id = ?
    `, [loteId]);

    res.status(200).json({ success: true, data: bins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBinsConFiltros,
  getProcesosPorProducto,
  getHistorialProcesoBin,
  getProductosConVariedades,
  getCamposClasificacion,
  registrarProcesoBin,
  getBinsPendientesLote,
  crearLoteDesdeBins,
  getEstadisticasProceso,
  getLotesCreados,
  getDetalleLote
};