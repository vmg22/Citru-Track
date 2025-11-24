const db = require('../config/db');

async function list(req, res){
    const [rows] = await db.query('SELECT * FROM productos WHERE activo = true ORDER BY producto_id DESC'); 
    res.json(rows);
}
async function getOne(req, res){
  const id = req.params.id;
  const [rows] = await db.query('SELECT * FROM productos WHERE producto_id = ?', [id]);
  if(!rows[0]) return res.status(404).json({ error: 'No existe' });
  res.json(rows[0]);
}
async function create(req, res){
  const { nombre, categoria, unidad_base, perecedero,requiere_frio, permite_sublotes } = req.body;
  const [r] = await db.query('INSERT INTO productos (nombre,categoria,unidad_base , perecedero,requiere_frio, permite_sublotes) VALUES (?, ?, ?,?,?,?)', [nombre,categoria,unidad_base, perecedero,requiere_frio, permite_sublotes]);
  res.status(201).json({ producto_id: r.insertId });
}

async function crearVariedad(req, res){
  const { producto_id,nombre, descripcion} = req.body;
  const [r] = await db.query('INSERT INTO variedades (producto_id,nombre,descripcion) VALUES (?, ?,?)', [producto_id, nombre, descripcion]);
  res.status(201).json({ variedad_id: r.insertId });
}

async function getProductByName (req, res) {
    try {
        const nameFromParam = req.params.name; 
        
        if (!nameFromParam) {
            return res.status(400).json({ error: 'El nombre del producto es requerido.' });
        }
        
       const searchName = nameFromParam.toLowerCase();

        const query = `
            SELECT
                p.producto_id,
                p.nombre AS nombre_producto,
                p.categoria,
                p.unidad_base,
                p.perecedero,
                p.requiere_frio,
                p.permite_sublotes,
                p.created_at AS producto_created_at,
                v.variedad_id,
                v.nombre AS nombre_variedad,
                v.descripcion AS descripcion_variedad,
                v.created_at AS variedad_created_at
            FROM
                productos p
            LEFT JOIN
                variedad v ON p.producto_id = v.producto_id
            WHERE
                LOWER(p.nombre) = ?  -- 🎯 Cláusula segura y case-insensitive
            ORDER BY
                v.variedad_id;
        `;
        
        const [rows] = await db.query(query, [searchName]);

        if (rows.length === 0) {
            // El error 404 que recibes proviene de aquí, pero productName debería ser searchName
            return res.status(404).json({ error: 'No existe el producto o no tiene variedades.' });
        }
        res.status(200).json(rows);

    } catch (error) {
        console.error("Error al obtener el producto:", error);
        res.status(500).json({ error: 'Error interno del servidor al consultar la base de datos.' });
    }
}

async function listProductsWithVarieties(req, res) {
    try {
        const query = `
            SELECT
                p.producto_id,
                p.nombre AS nombre_producto,
                p.categoria,
                p.unidad_base,
                p.perecedero,
                p.requiere_frio,
                p.permite_sublotes,
                p.created_at AS producto_created_at,
                v.variedad_id,
                v.nombre AS nombre_variedad,
                v.descripcion AS descripcion_variedad,
                v.created_at AS variedad_created_at
            FROM
                productos p 
            LEFT JOIN
                variedades v ON p.producto_id = v.producto_id
            WHERE
                p.activo = true 
                AND (v.variedad_id IS NULL OR v.activo = true) -- 🎯 SOLUCIÓN: Solo variedades activas o si no tiene variedades (LEFT JOIN)
            ORDER BY
                p.producto_id, v.variedad_id;
        `;

        const [rows] = await db.query(query);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron productos ni variedades.' });
        }

        // 🎯 Opcional pero recomendado: Agrupar la data para el frontend
        const groupedData = groupProductsAndVarieties(rows); 
        
        res.status(200).json(groupedData); // Devuelve la data agrupada
    } catch (error) {
        console.error("Error al obtener productos con variedades:", error);
        res.status(500).json({ error: 'Error interno del servidor al consultar la base de datos.' });
    }
}

// Función auxiliar para agrupar las filas SQL en una estructura anidada JSON
function groupProductsAndVarieties(rows) {
    const productsMap = new Map();
    
    rows.forEach(row => {
        // Inicializar o obtener el producto padre
        if (!productsMap.has(row.producto_id)) {
            productsMap.set(row.producto_id, {
                producto_id: row.producto_id,
                nombre: row.nombre_producto,
                categoria: row.categoria,
                unidad_base: row.unidad_base,
                perecedero: row.perecedero,
                requiere_frio: row.requiere_frio,
                permite_sublotes: row.permite_sublotes,
                created_at: row.producto_created_at,
                variedades: []
            });
        }

        const product = productsMap.get(row.producto_id);

        // Si existe variedad_id, añadirla al array de variedades
        if (row.variedad_id !== null) {
            product.variedades.push({
                variedad_id: row.variedad_id,
                nombre: row.nombre_variedad,
                descripcion: row.descripcion_variedad,
                created_at: row.variedad_created_at
            });
        }
    });

    return Array.from(productsMap.values());
}

async function editarProducto(req, res) {
    const id = req.params.id;
    const { nombre, categoria, unidad_base, perecedero, requiere_frio, permite_sublotes } = req.body;

    // Validación básica
    if (!nombre || !categoria || !unidad_base) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios: nombre, categoria y unidad_base.' });
    }

    try {
        const [check] = await db.query('SELECT producto_id FROM productos WHERE producto_id = ?', [id]);
        if (check.length === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
        }

        const [result] = await db.query(`
            UPDATE productos 
            SET nombre = ?, categoria = ?, unidad_base = ?, perecedero = ?, requiere_frio = ?, permite_sublotes = ?
            WHERE producto_id = ?
        `, [
            nombre,
            categoria,
            unidad_base,
            // Los campos booleanos vienen como 1/0 desde el frontend (o se convierten)
            perecedero,
            requiere_frio,
            permite_sublotes,
            id
        ]);

        if (result.affectedRows === 0) {
            // Esto solo ocurre si el producto existía (check pasado) pero no se pudo modificar.
            return res.status(500).json({ success: false, error: 'No se pudo actualizar el producto.' });
        }

        res.status(200).json({
            success: true,
            message: 'Producto actualizado con éxito.',
            data: { producto_id: id, ...req.body }
        });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ success: false, error: 'Error del servidor al actualizar el producto.' });
    }
}

async function eliminarProducto(req, res) {
    const id = req.params.id;
    try {
        const [rows] = await db.query('SELECT activo, nombre FROM productos WHERE producto_id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
        }

        const producto = rows[0];
        const nuevoEstado = producto.activo === 1 ? 0 : 1; 

        const [result] = await db.query(`
            UPDATE productos 
            SET activo = ?
            WHERE producto_id = ?
        `, [
            nuevoEstado,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, error: 'No se pudo modificar el estado del producto.' });
        }

        const mensaje = nuevoEstado === 1 
            ? `Producto "${producto.nombre}" activado con éxito.` 
            : `Producto "${producto.nombre}" desactivado (baja lógica).`;

        res.status(200).json({
            success: true,
            message: mensaje,
            data: { producto_id: id, activo: nuevoEstado }
        });

    } catch (error) {
        console.error('Error en la baja lógica del producto:', error);
        res.status(500).json({ success: false, error: 'Error del servidor al realizar la baja lógica.' });
    }
}

async function editarVariedad(req, res) {
    const id = req.params.id; 
    const { nombre, descripcion } = req.body;

    // Validación básica
    if (!nombre) {
        return res.status(400).json({ success: false, error: 'El nombre de la variedad es obligatorio.' });
    }

    try {
        // 1. Ejecutar la actualización
        const [result] = await db.query(`
            UPDATE variedades 
            SET nombre = ?, descripcion = ?
            WHERE variedad_id = ?
        `, [
            nombre,
            descripcion || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Variedad no encontrada para actualizar.' });
        }

        res.status(200).json({
            success: true,
            message: `Variedad ${nombre} (ID: ${id}) actualizada con éxito.`,
            data: { variedad_id: id, nombre, descripcion }
        });

    } catch (error) {
        console.error('Error al actualizar variedad:', error);
        res.status(500).json({ success: false, error: 'Error del servidor al actualizar la variedad.' });
    }
}

async function eliminarVariedad(req, res) {
    const id = req.params.id; // variedad_id

    try {
        const [result] = await db.query('UPDATE variedades SET activo = false WHERE variedad_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Variedad no encontrada para desactivar.' });
        }

        res.status(200).json({
            success: true,
            message: `Variedad (ID: ${id}) desactivada (baja lógica).`,
            data: { variedad_id: id, activo: false }
        });

    } catch (error) {
        console.error('Error al desactivar variedad:', error);
        // Manejo de error de clave foránea si es necesario
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
             return res.status(409).json({ success: false, error: 'La variedad no puede eliminarse porque está siendo referenciada por otros registros (ej: lotes).' });
        }
        res.status(500).json({ success: false, error: 'Error del servidor al desactivar la variedad.' });
    }
}


module.exports = { list, getOne, create,crearVariedad, getProductByName,groupProductsAndVarieties, listProductsWithVarieties, editarProducto, eliminarProducto, editarVariedad, eliminarVariedad};
