const db = require('../config/db');
const { format } = require('date-fns');

// --- HELPER FUNCTIONS ---
const generateBinId = () => {
  const fecha = format(new Date(), 'yyyyMMdd');
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return `BIN-${fecha}-${randomStr}`;
};

// --- CONTROLLERS ---

const getProductores = async (req, res) => {
  try {
    const [productores] = await db.query(`
      SELECT p.productor_id, p.nombre AS productor_nombre, p.cuit 
      FROM productores p ORDER BY p.nombre
    `);

  
    for (let productor of productores) {
      const [fincas] = await db.query(`
        SELECT finca_id, nombre, ubicacion FROM fincas WHERE productor_id = ?
      `, [productor.productor_id]);
      productor.fincas = fincas;
    }

    res.status(200).json({ success: true, data: productores });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al obtener productores" });
  }
};

const getProductos = async (req, res) => {
  try {
    // ELIMINAMOS "WHERE p.perecedero = TRUE"
    const [productos] = await db.query(`
      SELECT p.producto_id, p.nombre AS producto_nombre, p.categoria 
      FROM productos p 
      ORDER BY p.nombre
    `);

    for (let producto of productos) {
      const [variedades] = await db.query(`
        SELECT variedad_id, nombre FROM variedades WHERE producto_id = ?
      `, [producto.producto_id]);
      producto.variedades = variedades;
    }

    res.status(200).json({ success: true, data: productos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al obtener productos" });
  }
};

const validarRemito = async (req, res) => {
  try {
    const { remito } = req.params;
    const [result] = await db.query('SELECT COUNT(*) as count FROM bins WHERE remito = ?', [remito]);
    const existe = result[0].count > 0;
    
    res.status(200).json({ success: true, existe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al validar remito" });
  }
};

// --- LOGICA PRINCIPAL DE CREACIÓN ---
const createBin = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { 
      producto_id, variedad_id, productor_id, finca_id, 
      fecha_cosecha, peso_bruto, remito, observaciones, responsable 
    } = req.body;

    // 1. Validaciones básicas
    if (!producto_id || !fecha_cosecha || !peso_bruto || !remito) {
      connection.release();
      return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
    }

    // 2. Iniciar Transacción
    await connection.beginTransaction();

    // 3. Validar duplicado (Bloqueo pesimista para evitar condiciones de carrera)
    const [check] = await connection.query('SELECT 1 FROM bins WHERE remito = ? FOR UPDATE', [remito]);
    if (check.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ success: false, message: 'El remito ya existe' });
    }

    // 4. Obtener ID del proceso "Recepción" para guardarlo en la tabla bins
    const [procData] = await connection.query(`SELECT proceso_id FROM procesos_disponibles WHERE nombre = 'Recepción' LIMIT 1`);
    const procesoId = procData.length > 0 ? procData[0].proceso_id : null;

    // 5. Generar ID e Insertar BIN
    const binId = generateBinId();
    const userId = req.user?.id || null; // Si usas JWT

    await connection.query(`
      INSERT INTO bins (
        bin_id, producto_id, variedad_id, productor_id, finca_id, 
        fecha_cosecha, fecha_ingreso_bin, peso_bruto, remito, observaciones,
        estado_actual, proceso_actual_id, fecha_ultimo_proceso, registrado_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, 'Recepción', ?, NOW(), NOW())
    `, [
      binId, producto_id, variedad_id || null, productor_id || null, finca_id || null,
      fecha_cosecha, peso_bruto, remito, observaciones || null, procesoId
    ]);

    // 6. Registrar en el historial de procesos (bin_procesos)
    if (procesoId) {
      await connection.query(`
        INSERT INTO bin_procesos (
          bin_id, proceso_id, fecha_inicio, fecha_fin, estado, operario, usuario_id
        ) VALUES (?, ?, NOW(), NOW(), 'completado', ?, ?)
      `, [binId, procesoId, responsable || 'Sistema', userId]);
    }

    // 7. Commit
    await connection.commit();

    // 8. Respuesta Exitosa
    res.status(201).json({
      success: true,
      message: 'Bin creado correctamente',
      data: { 
        bin_id: binId, 
        remito, 
        estado: 'Recepción' 
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error createBin:', error);
    res.status(500).json({ success: false, message: "Error interno al crear el bin" });
  } finally {
    connection.release();
  }
};

const getBinsRecientes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const [bins] = await db.query(`
      SELECT 
        b.bin_id, b.fecha_ingreso_bin, b.peso_bruto, b.remito, b.estado_actual,
        p.nombre AS producto_nombre,
        v.nombre AS variedad_nombre
      FROM bins b
      INNER JOIN productos p ON b.producto_id = p.producto_id
      LEFT JOIN variedades v ON b.variedad_id = v.variedad_id
      ORDER BY b.fecha_ingreso_bin DESC
      LIMIT ?
    `, [limit]);

    res.status(200).json({ success: true, data: bins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al obtener bins" });
  }
};

const getBinById = async (req, res) => {
  try {
    const { binId } = req.params;
    const [bins] = await db.query(`SELECT * FROM bins WHERE bin_id = ?`, [binId]);
    
    if (bins.length === 0) return res.status(404).json({ success: false, message: 'Bin no encontrado' });

    res.status(200).json({ success: true, data: bins[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};




//para sacar porcenteaje de bins 

// --- CONTROLADOR PARA ESTADÍSTICAS ---
const getEstadisticasBins = async (req, res) => {
  try {
    // Estadísticas por producto
    const [porProducto] = await db.query(`
      SELECT 
        p.producto_id,
        p.nombre AS producto_nombre,
        p.categoria,
        COUNT(b.bin_id) AS total_bins,
        ROUND((COUNT(b.bin_id) * 100.0 / (SELECT COUNT(*) FROM bins)), 2) AS porcentaje,
        SUM(b.peso_bruto) AS peso_total
      FROM bins b
      INNER JOIN productos p ON b.producto_id = p.producto_id
      GROUP BY p.producto_id, p.nombre, p.categoria
      ORDER BY total_bins DESC
    `);

    // Estadísticas por productor
    const [porProductor] = await db.query(`
      SELECT 
        COALESCE(pr.productor_id, 0) AS productor_id,
        COALESCE(pr.nombre, 'Sin Productor') AS productor_nombre,
        COALESCE(pr.cuit, 'N/A') AS cuit,
        COUNT(b.bin_id) AS total_bins,
        ROUND((COUNT(b.bin_id) * 100.0 / (SELECT COUNT(*) FROM bins)), 2) AS porcentaje,
        SUM(b.peso_bruto) AS peso_total
      FROM bins b
      LEFT JOIN productores pr ON b.productor_id = pr.productor_id
      GROUP BY pr.productor_id, pr.nombre, pr.cuit
      ORDER BY total_bins DESC
    `);

    // Total general de bins
    const [totalGeneral] = await db.query(`SELECT COUNT(*) AS total FROM bins`);

    res.status(200).json({ 
      success: true, 
      data: {
        porProducto,
        porProductor,
        totalBins: totalGeneral[0].total
      }
    });
  } catch (error) {
    console.error('Error en getEstadisticasBins:', error);
    res.status(500).json({ success: false, message: "Error al obtener estadísticas" });
  }
};

module.exports = {
  getProductores,
  getProductos,
  validarRemito,
  createBin,     // <--- NOMBRE CORREGIDO
  getBinsRecientes,
  getBinById,
  getEstadisticasBins
};