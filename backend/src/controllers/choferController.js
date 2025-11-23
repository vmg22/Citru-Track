const db = require("../config/db");

async function getChoferes(req, res) {
  try {
    const [choferes] = await db.query(
      `SELECT 
                c.*, 
                t.nombre AS nombre_transportista, 
                t.telefono AS telefono_transportista
            FROM 
                choferes c
            LEFT JOIN 
                transportistas t ON c.transportista_id = t.transportista_id
            WHERE
                c.estado = 'activo'
            ORDER BY chofer_id DESC
            `
    );

    res.json(choferes);
  } catch (error) {
    console.error("Error al traer choferes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function createChofer(req, res) {
  try {
    const {
      nombre,
      dni,
      licencia_categoria,
      licencia_vencimiento,
      telefono,
      transportista_id,
    } = req.body;

    if (
      !nombre ||
      !dni ||
      !licencia_categoria ||
      !licencia_vencimiento ||
      !transportista_id
    ) {
      return res.status(400).json({
        error:
          "Los campos nombre, dni, licencia, fecha de vencimiento y transportista son obligatorios.",
      });
    }

    const estado = "activo";

    const [result] = await db.query(
      `INSERT INTO choferes 
                (nombre, dni, licencia_categoria, licencia_vencimiento, telefono, transportista_id, estado) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        dni,
        licencia_categoria,
        licencia_vencimiento,
        telefono || null,
        transportista_id,
        estado,
      ]
    );

    res.status(201).json({
      message: "Chofer creado exitosamente",
      chofer_id: result.insertId,
    });
  } catch (error) {
    console.error("Error al crear chofer:", error);
    res.status(500).json({ error: "Error al crear chofer" });
  }
}

async function actualizarChofer(req, res) {
    try {
        const { id } = req.params;
        // Se elimina el 'estado' del destructuring aquí para forzar el uso del ENUM abajo si se incluye
        const { nombre, dni, licencia_categoria, licencia_vencimiento, telefono, transportista_id, estado } = req.body; 

        const [choferExistente] = await db.query('SELECT chofer_id FROM choferes WHERE chofer_id = ?', [id]);
        if (choferExistente.length === 0) {
            return res.status(404).json({ error: 'Chofer no encontrado' });
        }

        const fields = [];
        const values = [];

        // Lógica de actualización parcial/completa
        if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }
        if (dni !== undefined) { fields.push('dni = ?'); values.push(dni); }
        if (licencia_categoria !== undefined) { fields.push('licencia_categoria = ?'); values.push(licencia_categoria); }
        if (licencia_vencimiento !== undefined) { fields.push('licencia_vencimiento = ?'); values.push(licencia_vencimiento); }
        if (telefono !== undefined) { fields.push('telefono = ?'); values.push(telefono); }
        if (transportista_id !== undefined) { fields.push('transportista_id = ?'); values.push(transportista_id); }
        
        // El campo estado debe ser un ENUM válido ('activo', 'inactivo', 'vacaciones')
        if (estado && ['activo', 'inactivo', 'vacaciones'].includes(estado)) { 
            fields.push('estado = ?'); values.push(estado); 
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
        }

        const query = `UPDATE choferes SET ${fields.join(', ')} WHERE chofer_id = ?`;
        values.push(id);

        await db.query(query, values);
        
        res.json({ message: 'Chofer actualizado exitosamente', chofer_id: id });
    } catch (error) {
        console.error('Error al actualizar chofer:', error);
        res.status(500).json({ error: 'Error al actualizar chofer' });
    }
}

async function eliminarChofer(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "UPDATE choferes SET estado = 'inactivo' WHERE chofer_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Chofer no encontrado" });
    }

    res.json({ message: "Chofer desactivado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar Chofer:", error);
    res.status(500).json({ error: "Error al eliminar Chofer" });
  }
}

module.exports = {
  getChoferes,
  createChofer,
  actualizarChofer,
  eliminarChofer,
};
