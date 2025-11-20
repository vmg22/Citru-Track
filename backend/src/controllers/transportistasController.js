const pool = require("../config/db");

/* GET /api/transportistas */
async function getAllTransportistas(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM transportistas ORDER BY nombre ASC LIMIT 1000");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener transportistas" });
  }
}

/* GET /api/transportistas/:id */
async function getTransportistaById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM transportistas WHERE transportista_id = ?", [id]);
    if (!rows.length) return res.status(404).json({ error: "Transportista no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener transportista" });
  }
}

/* POST /api/transportistas */
async function createTransportista(req, res) {
  try {
    const { nombre, cuit, contacto, telefono, email, seguros, habilitaciones } = req.body;
    const [result] = await pool.query(
      `INSERT INTO transportistas (nombre, cuit, contacto, telefono, email, seguros, habilitaciones, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [nombre, cuit, contacto, telefono, email, seguros, habilitaciones]
    );
    const [rows] = await pool.query("SELECT * FROM transportistas WHERE transportista_id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear transportista" });
  }
}

/* PUT /api/transportistas/:id */
async function updateTransportista(req, res) {
  try {
    const { id } = req.params;
    const datos = req.body;
    const fields = [];
    const params = [];
    for (const k of Object.keys(datos)) {
      fields.push(`${k} = ?`);
      params.push(datos[k]);
    }
    if (!fields.length) return res.status(400).json({ error: "No hay campos para actualizar" });
    params.push(id);
    await pool.query(`UPDATE transportistas SET ${fields.join(", ")} WHERE transportista_id = ?`, params);
    const [rows] = await pool.query("SELECT * FROM transportistas WHERE transportista_id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar transportista" });
  }
}

module.exports = {
  getAllTransportistas,
  getTransportistaById,
  createTransportista,
  updateTransportista
};
