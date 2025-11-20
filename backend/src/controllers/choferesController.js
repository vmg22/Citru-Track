const pool = require("../config/db");

/* GET /api/choferes */
async function getAllChoferes(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM choferes ORDER BY nombre ASC LIMIT 2000");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener choferes" });
  }
}

/* GET /api/choferes/:id */
async function getChoferById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM choferes WHERE chofer_id = ?", [id]);
    if (!rows.length) return res.status(404).json({ error: "Chofer no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener chofer" });
  }
}

module.exports = {
  getAllChoferes,
  getChoferById
};
