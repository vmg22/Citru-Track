const db = require('../config/db');

async function getProductores(req, res){
  const [rows] = await db.query('SELECT * FROM productores WHERE activo = true ORDER BY productor_id DESC');
  res.json(rows);
}

async function createProductor(req,res){
    const { nombre, cuit, direccion, telefono, contactos } = req.body;

    if (!nombre || !cuit) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios: nombre y cuit.' });
    }

    try {
        // Verificar si el CUIT ya existe
        const [cuitCheck] = await db.query('SELECT productor_id FROM productores WHERE cuit = ?', [cuit]);
        if (cuitCheck.length > 0) {
            return res.status(409).json({ success: false, error: 'Ya existe un productor con ese CUIT.' });
        }

        // Insertar nuevo productor
        const [result] = await db.query(`
            INSERT INTO productores (nombre, cuit, direccion, telefono, contactos, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [
            nombre,
            cuit,
            direccion || null, // Usar null si no se proporciona
            telefono || null,
            contactos || null
        ]);

        const newId = result.insertId;

        res.status(201).json({
            success: true,
            message: 'Productor creado con éxito.',
            data: {
                productor_id: newId,
                nombre,
                cuit,
                direccion,
                telefono,
                contactos
            }
        });

    } catch (error) {
        console.error('Error al crear productor:', error);
        res.status(500).json({ success: false, error: 'Error del servidor al crear el productor.' });
    }
}

async function updateProductor(req, res) {
    const { id } = req.params;
    const { nombre, cuit, direccion, telefono, contactos } = req.body;

    // Validación básica
    if (!nombre || !cuit) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios: nombre y cuit.' });
    }

    try {
        // Verificar si el CUIT existe en otro registro
        const [cuitCheck] = await db.query('SELECT productor_id FROM productores WHERE cuit = ? AND productor_id != ?', [cuit, id]);
        if (cuitCheck.length > 0) {
            return res.status(409).json({ success: false, error: 'Ya existe otro productor con ese CUIT.' });
        }
        const [result] = await db.query(`
            UPDATE productores 
            SET nombre = ?, cuit = ?, direccion = ?, telefono = ?, contactos = ?
            WHERE productor_id = ?
        `, [
            nombre,
            cuit,
            direccion || null,
            telefono || null,
            contactos || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Productor no encontrado para actualizar.' });
        }

        res.status(200).json({
            success: true,
            message: 'Productor actualizado con éxito.',
            data: { productor_id: id, nombre, cuit, direccion, telefono, contactos }
        });

    } catch (error) {
        console.error('Error al actualizar productor:', error);
        res.status(500).json({ success: false, error: 'Error del servidor al actualizar el productor.' });
    }
}

async function eliminarProductor(req, res) {
    const { id } = req.params;
    try {
        // Obtener el estado actual
        const [productor] = await db.query('SELECT activo FROM productores WHERE productor_id = ?', [id]);
        
        if (productor.length === 0) {
            return res.status(404).json({ success: false, error: 'Productor no encontrado.' });
        }

        const nuevoEstado = !productor[0].activo;

        const [result] = await db.query(`
            UPDATE productores 
            SET activo = ?
            WHERE productor_id = ?
        `, [
            nuevoEstado,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, error: 'No se pudo modificar el estado activo del productor.' });
        }

        const mensaje = nuevoEstado ? 'Productor activado con éxito.' : 'Productor desactivado (baja lógica) con éxito.';

        res.status(200).json({
            success: true,
            message: mensaje,
            data: { productor_id: id, activo: nuevoEstado }
        });

    } catch (error) {
        console.error('Error en la baja lógica del productor:', error);
        res.status(500).json({ success: false, error: 'Error del servidor al realizar la baja lógica.' });
    }
}
module.exports = {getProductores, createProductor, updateProductor, eliminarProductor}