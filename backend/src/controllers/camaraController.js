const db = require("../config/db");

// Función auxiliar para obtener una cámara por ID
async function getCamaraById(id) {
  const [rows] = await db.query("SELECT * FROM camaras WHERE camara_id = ?", [id]);
  return rows[0];
}

async function getCamaras(req, res) {
  try {
    const query = `
      SELECT 
        c.camara_id,
        c.nombre,
        c.ubicacion,
        c.temperatura_aproximada,
        c.capacidad_pallets,
        c.activo,
        c.created_at,
        c.humedad_optima,
        c.presion_optima,
        COALESCE(p_stock.pallets_en_uso, 0) AS pallets_en_uso,
        ROUND((COALESCE(p_stock.pallets_en_uso, 0) / c.capacidad_pallets) * 100, 2) AS porcentaje_ocupacion
      FROM camaras c
      LEFT JOIN (
        SELECT 
          camara_id, 
          COUNT(pallet_id) AS pallets_en_uso
        FROM pallets
        WHERE estado = 'en_camara'
        GROUP BY camara_id
      ) AS p_stock ON p_stock.camara_id = c.camara_id
      WHERE c.activo = true
      ORDER BY c.camara_id DESC;
    `;

    const [camaras] = await db.query(query);

    res.status(200).json({ success: true, data: camaras, count: camaras.length });
  } catch (error) {
    console.error("Error al traer las camaras con stock:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al obtener cámaras.",
    });
  }
}

async function createCamara(req, res) {
  const {
    nombre,
    ubicacion,
    temperatura_aproximada,
    capacidad_pallets,
    humedad_optima,
    presion_optima,
  } = req.body;

  if (!nombre || !capacidad_pallets) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos obligatorios: nombre y capacidad de pallets.",
    });
  }

  try {
    const [nameCheck] = await db.query(
      "SELECT camara_id FROM camaras WHERE nombre = ?",
      [nombre]
    );
    if (nameCheck.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Ya existe una cámara con el nombre "${nombre}".`,
      });
    }

    const [result] = await db.query(
      "INSERT INTO camaras (nombre, ubicacion, temperatura_aproximada, capacidad_pallets, humedad_optima, presion_optima, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [
        nombre,
        ubicacion || null,
        temperatura_aproximada || null,
        capacidad_pallets,
        humedad_optima || null,
        presion_optima || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Cámara creada con éxito.",
      data: { camara_id: result.insertId, ...req.body, activo: true },
    });
  } catch (error) {
    console.error("Error al crear cámara:", error);
    res.status(500).json({
      success: false,
      error: "Error del servidor al crear la cámara.",
    });
  }
}

async function updateCamara(req, res) {
  const { id } = req.params;
  const {
    nombre,
    ubicacion,
    capacidad_pallets,
    humedad_optima,
    presion_optima,
  } = req.body;

  if (!nombre || !capacidad_pallets) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos obligatorios: nombre y capacidad de pallets.",
    });
  }

  try {
    const [nameCheck] = await db.query(
      "SELECT camara_id FROM camaras WHERE nombre = ? AND camara_id != ?",
      [nombre, id]
    );
    if (nameCheck.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Ya existe otra cámara con el nombre "${nombre}".`,
      });
    }

    const [result] = await db.query(
      "UPDATE camaras SET nombre = ?, ubicacion = ?, capacidad_pallets = ?, humedad_optima = ?, presion_optima = ? WHERE camara_id = ?",
      [
        nombre,
        ubicacion || null,
        capacidad_pallets,
        humedad_optima || null,
        presion_optima || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Cámara no encontrada para actualizar.",
      });
    }

    const updatedCamara = await getCamaraById(id);

    res.status(200).json({
      success: true,
      message: "Cámara actualizada con éxito.",
      data: updatedCamara,
    });
  } catch (error) {
    console.error("Error al actualizar cámara:", error);
    res.status(500).json({
      success: false,
      error: "Error del servidor al actualizar la cámara.",
    });
  }
}

async function eliminarCamara(req, res) {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "UPDATE camaras SET activo = false WHERE camara_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json("No se pudo modificar el estado activo de la cámara.");
    }

    res.status(200).json({
      success: true,
      message: "Cámara desactivada con éxito.",
    });
  } catch (error) {
    console.error("Error al cambiar el estado de la cámara:", error);
    res.status(500).json({
      success: false,
      error: "Error del servidor al realizar la operación.",
    });
  }
}

module.exports = {
  getCamaras,
  createCamara,
  updateCamara,
  eliminarCamara,
};
