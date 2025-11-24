const db = require('../config/db');// Asegúrate que esta ruta a db.js sea correcta

exports.getFlotaActiva = async (req, res) => {
  try {
    // Consultamos la vista vw_tracking_activo
    const [rows] = await db.query("SELECT * FROM vw_tracking_activo");
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo flota:", error);
    res.status(500).json({ message: "Error interno del servidor al obtener tracking." });
  }
};