const db = require('../config/db');
const { format } = require('date-fns');

/**
 * Genera un ID único para el bin siguiendo el formato:
 * BIN-YYYYMMDD-RANDOM
 */
const generateBinId = () => {
  const fecha = format(new Date(), 'yyyyMMdd');
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  
  for (let i = 0; i < 6; i++) {
    randomStr += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  
  return `BIN-${fecha}-${randomStr}`;
};

/**
 * @desc    Obtener productores con sus fincas
 * @route   GET /api/bins/productores
 * @access  Private
 */
const getProductores = async (req, res) => {
  try {
    const [productores] = await db.query(`
      SELECT 
        p.productor_id,
        p.nombre AS productor_nombre,
        p.cuit,
        p.telefono,
        p.contactos
      FROM productores p
      ORDER BY p.nombre
    `);

    // Obtener fincas de cada productor
    for (let productor of productores) {
      const [fincas] = await db.query(`
        SELECT 
          finca_id,
          nombre,
          ubicacion,
          coordenadas
        FROM fincas
        WHERE productor_id = ?
      `, [productor.productor_id]);
      
      productor.fincas = fincas;
    }

    res.status(200).json({
      success: true,
      data: productores,
      count: productores.length
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener productores", 
      error: error.message 
    });
  }
};

/**
 * @desc    Obtener productos con sus variedades
 * @route   GET /api/bins/productos
 * @access  Private
 */
const getProductos = async (req, res) => {
  try {
    const [productos] = await db.query(`
      SELECT 
        p.producto_id,
        p.nombre AS producto_nombre,
        p.categoria,
        p.unidad_base,
        p.perecedero,
        p.requiere_frio
      FROM productos p
      WHERE p.perecedero = TRUE
      ORDER BY p.nombre
    `);

    // Obtener variedades de cada producto
    for (let producto of productos) {
      const [variedades] = await db.query(`
        SELECT 
          variedad_id,
          nombre,
          descripcion
        FROM variedades
        WHERE producto_id = ?
      `, [producto.producto_id]);
      
      producto.variedades = variedades;
    }

    res.status(200).json({
      success: true,
      data: productos,
      count: productos.length
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener productos", 
      error: error.message 
    });
  }
};

/**
 * @desc    Validar si un remito ya existe
 * @route   GET /api/bins/validar-remito/:remito
 * @access  Private
 */
const validarRemito = async (req, res) => {
  try {
    const { remito } = req.params;
    
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM bins WHERE remito = ?',
      [remito]
    );
    
    const existe = result[0].count > 0;

    res.status(200).json({
      success: true,
      existe: existe,
      message: existe ? 'El remito ya existe' : 'El remito está disponible'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al validar remito", 
      error: error.message 
    });
  }
};

/**
 * @desc    Crear BIN y LOTE automáticamente (transacción)
 * @route   POST /api/bins
 * @access  Private
 */
const createBinYLote = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { 
      producto_id, 
      variedad_id,
      productor_id, 
      finca_id, 
      fecha_cosecha,
      peso_bruto, 
      remito, 
      observaciones,
      responsable
    } = req.body;

    // Validaciones básicas
    if (!producto_id || !fecha_cosecha || !peso_bruto || !remito) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos obligatorios: producto_id, fecha_cosecha, peso_bruto, remito"
      });
    }

    // Validar remito duplicado
    const [remitoCheck] = await connection.query(
      'SELECT COUNT(*) as count FROM bins WHERE remito = ?',
      [remito]
    );

    if (remitoCheck[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: 'El número de remito ya existe en el sistema'
      });
    }

    // Iniciar transacción
    await connection.beginTransaction();

    // 1. Generar ID único para el BIN
    const binId = generateBinId();

    // Obtener userId del token JWT (si existe)
    const created_by = req.user ? req.user.user_id : null;

    // 2. Insertar BIN
    await connection.query(`
      INSERT INTO bins (
        bin_id, 
        producto_id, 
        variedad_id,
        productor_id, 
        finca_id, 
        fecha_cosecha,
        fecha_ingreso_bin,
        peso_bruto, 
        remito, 
        observaciones,
        registrado_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, NOW())
    `, [
      binId,
      producto_id,
      variedad_id || null,
      productor_id || null,
      finca_id || null,
      fecha_cosecha,
      peso_bruto,
      remito,
      observaciones || null
    ]);

    // 3. Obtener información del producto y variedad para descripción del lote
    const [productoInfo] = await connection.query(`
      SELECT 
        p.nombre AS producto_nombre,
        v.nombre AS variedad_nombre
      FROM productos p
      LEFT JOIN variedades v ON v.variedad_id = ?
      WHERE p.producto_id = ?
    `, [variedad_id, producto_id]);

    const variedadNombre = productoInfo[0]?.variedad_nombre || '';
    const productoNombre = productoInfo[0]?.producto_nombre || '';
    
    // 4. Crear descripción del lote
    const fechaActual = format(new Date(), 'yyyy-MM-dd');
    const descripcionLote = `Lote ${productoNombre} ${variedadNombre} - Ingreso ${fechaActual} - BIN: ${binId}`.trim();

    // 5. Insertar LOTE automáticamente
    const [loteResult] = await connection.query(`
      INSERT INTO lotes (
        producto_id,
        descripcion,
        bin_id,
        fecha_ingreso,
        estado,
        responsable,
        created_by,
        created_at
      ) VALUES (?, ?, ?, NOW(), 'ingresado', ?, ?, NOW())
    `, [
      producto_id,
      descripcionLote,
      binId,
      responsable || 'Sistema',
      created_by
    ]);

    const loteId = loteResult.insertId;

    // 6. Registrar en audit_logs
    await connection.query(`
      INSERT INTO audit_logs (tabla, registro_id, accion, usuario_id, fecha, detalles)
      VALUES ('bins', ?, 'CREATE', ?, NOW(), ?)
    `, [
      binId,
      created_by,
      JSON.stringify({
        bin_id: binId,
        producto_id: producto_id,
        remito: remito,
        peso_bruto: peso_bruto
      })
    ]);

    await connection.query(`
      INSERT INTO audit_logs (tabla, registro_id, accion, usuario_id, fecha, detalles)
      VALUES ('lotes', ?, 'CREATE', ?, NOW(), ?)
    `, [
      loteId.toString(),
      created_by,
      JSON.stringify({
        lote_id: loteId,
        bin_id: binId,
        descripcion: descripcionLote
      })
    ]);

    // Commit de la transacción
    await connection.commit();

    // --- Notificación WebSocket (si está configurado) ---
    const io = req.app.get('io');
    if (io) {
      io.emit('bin_creado', {
        bin_id: binId,
        lote_id: loteId,
        producto_nombre: productoNombre,
        variedad_nombre: variedadNombre,
        remito: remito,
        peso_bruto: peso_bruto,
        timestamp: Date.now()
      });
    }
    // --- Fin Notificación ---

    // 7. Retornar datos completos
    res.status(201).json({
      success: true,
      message: 'Bin y lote creados exitosamente',
      data: {
        bin: {
          bin_id: binId,
          producto_id: producto_id,
          variedad_id: variedad_id,
          productor_id: productor_id,
          finca_id: finca_id,
          fecha_cosecha: fecha_cosecha,
          peso_bruto: peso_bruto,
          remito: remito,
          observaciones: observaciones
        },
        lote: {
          lote_id: loteId,
          descripcion: descripcionLote,
          estado: 'ingresado'
        }
      }
    });

  } catch (error) {
    // Rollback en caso de error
    await connection.rollback();
    
    console.error('Error creando bin y lote:', error);
    res.status(500).json({ 
      success: false,
      message: "Error en el servidor al crear bin y lote", 
      error: error.message 
    });

  } finally {
    connection.release();
  }
};

/**
 * @desc    Obtener bins recientes
 * @route   GET /api/bins/recientes
 * @access  Private
 */
const getBinsRecientes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const [bins] = await db.query(`
      SELECT 
        b.bin_id,
        b.fecha_ingreso_bin,
        b.peso_bruto,
        b.remito,
        b.observaciones,
        p.nombre AS producto_nombre,
        v.nombre AS variedad_nombre,
        prod.nombre AS productor_nombre,
        f.nombre AS finca_nombre,
        l.lote_id,
        l.descripcion AS lote_descripcion,
        l.estado AS lote_estado
      FROM bins b
      INNER JOIN productos p ON b.producto_id = p.producto_id
      LEFT JOIN variedades v ON b.variedad_id = v.variedad_id
      LEFT JOIN productores prod ON b.productor_id = prod.productor_id
      LEFT JOIN fincas f ON b.finca_id = f.finca_id
      LEFT JOIN lotes l ON b.bin_id = l.bin_id
      ORDER BY b.fecha_ingreso_bin DESC
      LIMIT ?
    `, [limit]);

    res.status(200).json({
      success: true,
      data: bins,
      count: bins.length
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error al obtener bins recientes", 
      error: error.message 
    });
  }
};

/**
 * @desc    Obtener detalles de un bin específico
 * @route   GET /api/bins/:binId
 * @access  Private
 */
const getBinById = async (req, res) => {
  try {
    const { binId } = req.params;

    const [bins] = await db.query(`
      SELECT 
        b.*,
        p.nombre AS producto_nombre,
        p.categoria,
        v.nombre AS variedad_nombre,
        prod.nombre AS productor_nombre,
        prod.cuit AS productor_cuit,
        f.nombre AS finca_nombre,
        f.ubicacion AS finca_ubicacion,
        l.lote_id,
        l.descripcion AS lote_descripcion,
        l.estado AS lote_estado
      FROM bins b
      INNER JOIN productos p ON b.producto_id = p.producto_id
      LEFT JOIN variedades v ON b.variedad_id = v.variedad_id
      LEFT JOIN productores prod ON b.productor_id = prod.productor_id
      LEFT JOIN fincas f ON b.finca_id = f.finca_id
      LEFT JOIN lotes l ON b.bin_id = l.bin_id
      WHERE b.bin_id = ?
    `, [binId]);

    if (bins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bin no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: bins[0]
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error al obtener detalles del bin", 
      error: error.message 
    });
  }
};

// Exportar todas las funciones
module.exports = {
  getProductores,
  getProductos,
  validarRemito,
  createBinYLote,
  getBinsRecientes,
  getBinById
};