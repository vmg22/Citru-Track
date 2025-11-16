const db = require('../config/db');

async function createTransportista(req, res) {
  try {
    const { nombre, cuit, contacto, telefono, email } = req.body;
    const [r] = await db.query(
      'INSERT INTO transportistas (nombre, cuit, contacto, telefono, email) VALUES (?, ?, ?, ?, ?)', 
      [nombre, cuit, contacto, telefono, email]
    );
    res.status(201).json({ transportista_id: r.insertId });
  } catch (error) {
    console.error('Error creando transportista:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

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

async function registrarTrackingEvento(req, res) {
  try {
    const data = req.body;
    
    await db.query(
      "INSERT INTO tracking_realtime (orden_despacho_id, camion_id, lat, lng, velocidad, evento) VALUES (?,?,?,?,?,?)",
      [data.orden_despacho_id, data.camion_id, data.lat, data.lng, data.velocidad, data.evento]
    );

    // Obtener io desde la app - FORMA CORRECTA
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
  createCamion, 
  registrarTrackingEvento 
};