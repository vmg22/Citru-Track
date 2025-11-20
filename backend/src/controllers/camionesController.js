const pool = require("../config/db");

/**
 * Campos principales usados:
 * - camion_id, transportista_id, patente, patente_acoplado, tipo_camion, temp_min, temp_max, ultima_desinfeccion, documentos
 */

/* GET /api/camiones */
async function getAllCamiones(req, res) {
  try {
    // Soportamos filtros opcionales por tipo y transportista
    const { tipo, transportista_id } = req.query;
    const where = [];
    const params = [];

    if (tipo) {
      where.push("tipo_camion = ?");
      params.push(tipo);
    }
    if (transportista_id) {
      where.push("transportista_id = ?");
      params.push(transportista_id);
    }

    const sql = `
      SELECT c.*, t.nombre AS transportista_nombre
      FROM camiones c
      LEFT JOIN transportistas t ON c.transportista_id = t.transportista_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY c.created_at DESC
      LIMIT 1000
    `;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener camiones" });
  }
}

/* GET /api/camiones/:id */
async function getCamionById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT c.*, t.nombre AS transportista_nombre
       FROM camiones c
       LEFT JOIN transportistas t ON c.transportista_id = t.transportista_id
       WHERE c.camion_id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Camión no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener camión" });
  }
}

/* POST /api/camiones */
async function createCamion(req, res) {
  try {
    const {
      transportista_id,
      patente,
      patente_acoplado,
      tipo_camion,
      temp_min,
      temp_max,
      ultima_desinfeccion,
      documentos
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO camiones
       (transportista_id, patente, patente_acoplado, tipo_camion, temp_min, temp_max, ultima_desinfeccion, documentos, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [transportista_id || null, patente, patente_acoplado || null, tipo_camion || null, temp_min || null, temp_max || null, ultima_desinfeccion || null, documentos || null]
    );

    const insertedId = result.insertId;
    const [rows] = await pool.query("SELECT * FROM camiones WHERE camion_id = ?", [insertedId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear camión" });
  }
}

/* PUT /api/camiones/:id */
async function updateCamion(req, res) {
  try {
    const { id } = req.params;
    const changes = req.body;

    // Construir SET dinámico
    const fields = [];
    const params = [];
    for (const key of Object.keys(changes)) {
      // proteger campos no válidos? asumimos nombres de columnas seguros
      fields.push(`${key} = ?`);
      params.push(changes[key]);
    }
    if (!fields.length) return res.status(400).json({ error: "No hay campos para actualizar" });
    params.push(id);

    const sql = `UPDATE camiones SET ${fields.join(", ")}, updated_at = NOW() WHERE camion_id = ?`;
    await pool.query(sql, params);

    const [rows] = await pool.query("SELECT * FROM camiones WHERE camion_id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar camión" });
  }
}

/* DELETE /api/camiones/:id */
async function deleteCamion(req, res) {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM camiones WHERE camion_id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar camión" });
  }
}

module.exports = {
  getAllCamiones,
  getCamionById,
  createCamion,
  updateCamion,
  deleteCamion
};
