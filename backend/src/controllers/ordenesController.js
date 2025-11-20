const pool = require("../config/db");

/* GET /api/ordenes-despacho */
async function getAllOrdenes(req, res) {
  try {
    const { estado } = req.query;
    const params = [];
    let where = "";

    if (estado) {
      where = "WHERE estado = ?";
      params.push(estado);
    }

    const sql = `
      SELECT od.*, c.nombre AS cliente_nombre, t.nombre AS transportista_nombre, cam.patente AS patente
      FROM orden_despacho od
      LEFT JOIN clientes c ON od.cliente_id = c.cliente_id
      LEFT JOIN transportistas t ON od.transportista_id = t.transportista_id
      LEFT JOIN camiones cam ON od.camion_id = cam.camion_id
      ${where}
      ORDER BY od.fecha_creacion DESC
      LIMIT 1000
    `;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener órdenes de despacho" });
  }
}

/* GET /api/ordenes-despacho/kpis (resumen) */
async function getKPIs(req, res) {
  try {
    const [[{ totalCamiones }]] = await pool.query("SELECT COUNT(*) AS totalCamiones FROM camiones");
    const [[{ totalChoferes }]] = await pool.query("SELECT COUNT(*) AS totalChoferes FROM choferes");
    const [[{ viajesEnCurso }]] = await pool.query(
      "SELECT COUNT(*) AS viajesEnCurso FROM orden_despacho WHERE estado IN ('en_carga','en_ruta')"
    );
    const [[{ enMantenimiento }]] = await pool.query(
      "SELECT COUNT(*) AS enMantenimiento FROM camiones WHERE ultima_desinfeccion IS NULL OR ultima_desinfeccion = ''"
    );
    res.json({ totalCamiones, totalChoferes, viajesEnCurso, enMantenimiento });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener KPIs" });
  }
}

module.exports = {
  getAllOrdenes,
  getKPIs
};
