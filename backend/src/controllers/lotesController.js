const db = require('../config/db');

/**
 * @desc    Crear un nuevo lote
 * @route   POST /api/lotes
 * @access  Private
 */
const createLote = async (req, res) => {
  try {
    const { producto_id, descripcion, bin_id, estado = 'ingresado', responsable } = req.body;
    const created_by = req.user ? req.user.user_id : null; 

    const sql = `
      INSERT INTO lotes 
      (producto_id, descripcion, bin_id, estado, responsable, created_by, fecha_ingreso, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
    `;
    
    const [result] = await db.query(sql, [producto_id, descripcion, bin_id, estado, responsable, created_by]);
    
    res.status(201).json({
      message: "Lote creado exitosamente",
      id: result.insertId,
      ...req.body
    });

  } catch (error) {
    res.status(500).json({ message: "Error en el servidor al crear lote", error: error.message });
  }
};

/**
 * @desc    Obtener todos los lotes
 * @route   GET /api/lotes
 * @access  Public
 */
const getAllLotes = async (req, res) => {
  try {
    console.log('📦 Solicitud GET /api/lotes');
    const sql = `
      SELECT 
        l.lote_id,
        l.producto_id,
        l.variedad_id,
        l.descripcion,
        l.cantidad_bins,
        l.peso_total,
        l.calibre,
        l.fecha_ingreso,
        l.estado,
        l.cerrado,
        p.nombre as producto_nombre,
        v.nombre as variedad_nombre
      FROM lotes l
      LEFT JOIN productos p ON l.producto_id = p.producto_id
      LEFT JOIN variedades v ON l.variedad_id = v.variedad_id
      ORDER BY l.lote_id DESC
    `;
    
    const [lotes] = await db.query(sql);
    console.log(`✅ Lotes obtenidos: ${lotes.length} registros`);
    
    res.status(200).json(lotes);

  } catch (error) {
    console.error('❌ Error al obtener lotes:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: "Error en el servidor al obtener lotes", error: error.message });
  }
};

/**
 * @desc    Obtener un lote por su ID
 * @route   GET /api/lotes/:id
 * @access  Public
 */
const getLoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT l.*, p.nombre as producto_nombre 
      FROM lotes l
      LEFT JOIN productos p ON l.producto_id = p.producto_id
      WHERE l.lote_id = ?
    `;
    
    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Lote no encontrado" });
    }
    
    res.status(200).json({ message: "Lote encontrado", data: rows[0] });
    
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor al obtener lote", error: error.message });
  }
};

/**
 * @desc    Actualizar un lote por su ID
 * @route   PUT /api/lotes/:id
 * @access  Private
 */
const updateLote = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.updated_at = new Date();

    const sql = 'UPDATE lotes SET ? WHERE lote_id = ?';
    const [result] = await db.query(sql, [updates, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Lote no encontrado para actualizar" });
    }
    
    res.status(200).json({ message: "Lote actualizado", data: { id, ...updates } });

  } catch (error) {
    res.status(500).json({ message: "Error en el servidor al actualizar lote", error: error.message });
  }
};

/**
 * @desc    Eliminar un lote por su ID
 * @route   DELETE /api/lotes/:id
 * @access  Private
 */
const deleteLote = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM lotes WHERE lote_id = ?';
    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Lote no encontrado para eliminar" });
    }

    res.status(200).json({ message: "Lote eliminado" });

  } catch (error) {
    res.status(500).json({ message: "Error en el servidor al eliminar lote", error: error.message });
  }
};

/**
 * @desc    Obtener lotes por producto_id
 * @route   GET /api/lotes/por-producto/:productoId
 * @access  Public
 */
const getLotesPorProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    
    console.log('📦 Obteniendo lotes para producto:', productoId);
    
    const sql = `
      SELECT 
        l.lote_id,
        l.producto_id,
        l.descripcion,
        l.fecha_ingreso,
        l.estado,
        l.cerrado,
        l.cantidad_bins,
        p.nombre as producto_nombre,
        COUNT(DISTINCT c.caja_id) as total_cajas,
        SUM(c.peso_neto) as peso_total_cajas
      FROM lotes l
      LEFT JOIN productos p ON l.producto_id = p.producto_id
      LEFT JOIN cajas c ON l.lote_id = c.lote_id
      WHERE l.producto_id = ? AND (l.cerrado = 0 OR l.cerrado IS NULL)
      GROUP BY l.lote_id
      ORDER BY l.fecha_ingreso DESC
    `;
    
    const [lotes] = await db.query(sql, [productoId]);
    
    console.log(`✅ Lotes encontrados: ${lotes.length}`);
    
    res.status(200).json({
      success: true,
      lotes: lotes
    });

  } catch (error) {
    console.error('❌ Error al obtener lotes por producto:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener lotes", 
      error: error.message 
    });
  }
};

/**
 * @desc    Obtener sublotes por lote_id
 * @route   GET /api/lotes/:loteId/sublotes
 * @access  Public
 */
const getSublotesPorLote = async (req, res) => {
  try {
    const { loteId } = req.params;
    
    console.log('📦 Obteniendo sublotes para lote:', loteId);
    
    const sql = `
      SELECT 
        s.sublote_id,
        s.lote_id,
        s.calibre,
        s.variedad_id,
        v.nombre as variedad_nombre,
        COUNT(DISTINCT c.caja_id) as total_cajas,
        SUM(c.peso_neto) as peso_total_cajas
      FROM sublotes s
      LEFT JOIN variedades v ON s.variedad_id = v.variedad_id
      LEFT JOIN cajas c ON s.sublote_id = c.sublote_id
      WHERE s.lote_id = ?
      GROUP BY s.sublote_id
      ORDER BY s.calibre ASC
    `;
    
    const [sublotes] = await db.query(sql, [loteId]);
    
    console.log(`✅ Sublotes encontrados: ${sublotes.length}`);
    
    res.status(200).json({
      success: true,
      sublotes: sublotes
    });

  } catch (error) {
    console.error('❌ Error al obtener sublotes:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener sublotes", 
      error: error.message 
    });
  }
};

/**
 * @desc    Obtener todos los sublotes
 * @route   GET /api/lotes/sublotes/all
 * @access  Public
 */
const getAllSublotes = async (req, res) => {
  try {
    console.log('📦 Obteniendo todos los sublotes');
    
    const sql = `
      SELECT 
        s.sublote_id,
        s.lote_id,
        s.calibre,
        s.cantidad_cajas,
        l.descripcion as lote_descripcion,
        COUNT(DISTINCT c.caja_id) as total_cajas,
        SUM(c.peso_neto) as peso_total_cajas
      FROM sublotes s
      LEFT JOIN lotes l ON s.lote_id = l.lote_id
      LEFT JOIN cajas c ON s.sublote_id = c.sublote_id
      GROUP BY s.sublote_id
      ORDER BY s.lote_id DESC, s.calibre ASC
    `;
    
    const [sublotes] = await db.query(sql);
    
   console.log(`✅ Total sublotes encontrados: ${sublotes.length}`);
    
    res.status(200).json(sublotes);

  } catch (error) {
    console.error('❌ Error al obtener todos los sublotes:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener sublotes", 
      error: error.message 
    });
  }
};

module.exports = {
  createLote,
  getAllLotes,
  getLoteById,
  updateLote,
  deleteLote,
  getLotesPorProducto,
  getSublotesPorLote,
  getAllSublotes
};