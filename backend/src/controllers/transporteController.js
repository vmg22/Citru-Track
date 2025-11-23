const db = require('../config/db');

async function createTransportista(req, res) {
  try {
    const { nombre, cuit, contacto, telefono, email, seguros, habilitaciones } = req.body;

    if (!nombre || !cuit || !contacto || !telefono || !email) {
      return res.status(400).json({
        error: 'Los campos nombre, CUIT, contacto, teléfono y email son obligatorios.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO transportistas 
      (nombre, cuit, contacto, telefono, email, seguros, habilitaciones) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, cuit, contacto, telefono, email, seguros || null, habilitaciones || null]
    );

    res.status(201).json({
      message: 'Transportista creado exitosamente',
      transportista_id: result.insertId
    });
  } catch (error) {
    console.error('Error creando transportista:', error);
    res.status(500).json({ error: 'Error al crear transportista' });
  }
}

// Función: Obtener Transportistas
async function getTransportistas(req, res) {
  try {
    const [r] = await db.query('SELECT * FROM transportistas WHERE activo = TRUE ORDER BY transportista_id DESC');
    res.json(r);
  } catch (error) {
    console.error('Error al traer transportistas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Función: Actualizar Transportista
async function actualizarTransportista(req, res) {
  try {
    const { id } = req.params;
    const { nombre, cuit, contacto, telefono, email, seguros, habilitaciones } = req.body;

    const [transportistaExistente] = await db.query(
      'SELECT transportista_id FROM transportistas WHERE transportista_id = ?',
      [id]
    );

    if (transportistaExistente.length === 0) {
      return res.status(404).json({ error: 'Transportista no encontrado' });
    }

    if (!nombre || !cuit || !contacto || !telefono || !email) {
      return res.status(400).json({
        error: 'Los campos nombre, CUIT, contacto, teléfono y email son obligatorios para la actualización.'
      });
    }

    const fields = [];
    const values = [];

    if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }
    if (cuit !== undefined) { fields.push('cuit = ?'); values.push(cuit); }
    if (contacto !== undefined) { fields.push('contacto = ?'); values.push(contacto); }
    if (telefono !== undefined) { fields.push('telefono = ?'); values.push(telefono); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (seguros !== undefined) { fields.push('seguros = ?'); values.push(seguros); }
    if (habilitaciones !== undefined) { fields.push('habilitaciones = ?'); values.push(habilitaciones); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
    }

    const query = `UPDATE transportistas SET ${fields.join(', ')} WHERE transportista_id = ?`;
    values.push(id);

    await db.query(query, values);

    res.json({
      message: 'Transportista actualizado exitosamente',
      transportista_id: id
    });
  } catch (error) {
    console.error('Error al actualizar transportista:', error);
    res.status(500).json({ error: 'Error al actualizar transportista' });
  }
}

// Función: Eliminar Transportista
async function eliminarTransportista(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "UPDATE transportistas SET activo = FALSE WHERE transportista_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transportista no encontrado' });
    }

    res.json({ message: 'Transportista eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar transportista:', error);
    res.status(500).json({ error: 'Error al eliminar transportista' });
  }
}

// Crear Camión
async function createCamion(req, res) {
  try {
    const { transportista_id, patente, patente_acoplado, tipo_camion, temp_min, temp_max } = req.body;

    const [r] = await db.query(
      'INSERT INTO camiones (transportista_id, patente, patente_acoplado, tipo_camion, temp_min, temp_max) VALUES (?, ?, ?, ?, ?, ?)',
      [transportista_id, patente, patente_acoplado, tipo_camion, temp_min, temp_max]
    );

    res.status(201).json({ camion_id: r.insertId });
  } catch (error) {
    console.error('Error creando camión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Tracking
async function registrarTrackingEvento(req, res) {
  try {
    const data = req.body;

    await db.query(
      "INSERT INTO tracking_realtime (orden_despacho_id, camion_id, lat, lng, velocidad, evento) VALUES (?,?,?,?,?,?)",
      [data.orden_despacho_id, data.camion_id, data.lat, data.lng, data.velocidad, data.evento]
    );

    const io = req.app.get('io');
    io.emit(`tracking:od:${data.orden_despacho_id}`, data);

    res.json({ ok: true });
  } catch (error) {
    console.error('Error registrando tracking:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  createTransportista,
  getTransportistas,
  actualizarTransportista,
  eliminarTransportista,
  createCamion,
  registrarTrackingEvento
};
