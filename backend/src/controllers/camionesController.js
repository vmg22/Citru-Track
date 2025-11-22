const pool = require("../config/db");

/**
 * Campos principales usados:
 * - camion_id, transportista_id, patente, patente_acoplado, tipo_camion, capacidad_pallets,
 * - temp_min, temp_max, ultima_desinfeccion, documentos, estado, created_at
 */

/* GET /api/camiones */
async function getAllCamiones(req, res) {
  try {
    const { tipo, transportista_id } = req.query;
    const where = [];
    const params = [];

    where.push("c.estado = 'activo'");

    if (tipo) {
      where.push("tipo_camion = ?");
      params.push(tipo);
    }
    if (transportista_id) {
      where.push("c.transportista_id = ?");
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
      capacidad_pallets,
      temp_min,
      temp_max,
      ultima_desinfeccion,
      documentos
    } = req.body;

    if (!patente || !transportista_id || !capacidad_pallets) {
      return res.status(400).json({ error: 'Patente, transportista y capacidad son obligatorios.' });
    }

    const estado = 'activo';

    const [result] = await pool.query(
      `INSERT INTO camiones
        (transportista_id, patente, patente_acoplado, tipo_camion, capacidad_pallets, temp_min, temp_max, ultima_desinfeccion, documentos, estado, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        transportista_id,
        patente,
        patente_acoplado || null,
        tipo_camion || null,
        capacidad_pallets,
        temp_min || null,
        temp_max || null,
        ultima_desinfeccion || null,
        documentos || null,
        estado
      ]
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
    let changes = req.body;

    changes = Object.fromEntries(
      Object.entries(changes).map(([key, value]) => {
        if (typeof value === 'string' && value.trim() === '') {
          return [key, null];
        }
        return [key, value];
      })
    );

    const fields = [];
    const params = [];

    for (const key of Object.keys(changes)) {
      if (key === 'estado' && changes[key] !== null && !['activo', 'inactivo', 'mantenimiento'].includes(changes[key])) {
        return res.status(400).json({ error: 'Estado de camión inválido.' });
      }

      if (key === 'created_at') continue;

      fields.push(`${key} = ?`);
      params.push(changes[key]);
    }

    if (!fields.length) return res.status(400).json({ error: "No hay campos para actualizar" });

    params.push(id);

    const sql = `UPDATE camiones SET ${fields.join(", ")} WHERE camion_id = ?`;
    await pool.query(sql, params);

    const [rows] = await pool.query("SELECT * FROM camiones WHERE camion_id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar camión: " + err.message });
  }
}

/* DELETE /api/camiones/:id */
async function deleteCamion(req, res) {
  try {
    const { id } = req.params;
    await pool.query(`update camiones set estado = "inactivo" WHERE camion_id = ?`, [id]);
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
