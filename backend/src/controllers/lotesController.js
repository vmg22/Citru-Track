// --- IMPORTANTE ---
// Importamos el pool de conexión de la BD (como en tu ejemplo)
const db = require('../config/db'); 

/**
 * @desc    Crear un nuevo lote
 * @route   POST /api/lotes
 * @access  Private (dependerá de tu lógica de autenticación)
 */
const createLote = async (req, res) => {
  try {
    // Leemos los datos del body
    const { producto_id, descripcion, bin_id, estado = 'ingresado', responsable } = req.body;
    
    // Asignamos el created_by (si usas autenticación, vendría de req.user.user_id)
    const created_by = req.user ? req.user.user_id : null; 

    const sql = `
      INSERT INTO lotes 
      (producto_id, descripcion, bin_id, estado, responsable, created_by, fecha_ingreso, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
    `;
    
    // Ejecutamos la consulta
    const [result] = await db.query(sql, [producto_id, descripcion, bin_id, estado, responsable, created_by]);
    
    // Respondemos con el ID del nuevo lote
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
    const sql = `
      SELECT l.*, p.nombre as producto_nombre 
      FROM lotes l
      LEFT JOIN productos p ON l.producto_id = p.producto_id
    `; // Hacemos JOIN para traer el nombre del producto
    
    const [lotes] = await db.query(sql);
    
    res.status(200).json({ message: "Lotes obtenidos", data: lotes });

  } catch (error) {
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
    const updates = req.body; // Los campos a actualizar

    // Agregamos 'updated_at' automáticamente
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


// Exportamos todas las funciones
module.exports = {
  createLote,
  getAllLotes,
  getLoteById,
  updateLote,
  deleteLote
};