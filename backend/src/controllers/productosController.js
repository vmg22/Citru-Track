const db = require('../config/db');

async function list(req, res){
  const [rows] = await db.query('SELECT * FROM productos ORDER BY producto_id DESC');
  res.json(rows);
}
async function getOne(req, res){
  const id = req.params.id;
  const [rows] = await db.query('SELECT * FROM productos WHERE producto_id = ?', [id]);
  if(!rows[0]) return res.status(404).json({ error: 'No existe' });
  res.json(rows[0]);
}
async function create(req, res){
  const { nombre, categoria, unidad_base } = req.body;
  const [r] = await db.query('INSERT INTO productos (nombre,categoria,unidad_base) VALUES (?, ?, ?)', [nombre,categoria,unidad_base]);
  res.status(201).json({ producto_id: r.insertId });
}

async function getProductByName (req, res) {
    try {
        // 🎯 CORRECCIÓN CLAVE: OBTENER EL NOMBRE DEL PARÁMETRO DE LA RUTA
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
                p.flujo_proceso_id,
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
                p.flujo_proceso_id,
                p.created_at AS producto_created_at,
                v.variedad_id,
                v.nombre AS nombre_variedad,
                v.descripcion AS descripcion_variedad,
                v.created_at AS variedad_created_at
            FROM
                productos p  -- Usamos 'productos' (plural)
            LEFT JOIN
                variedades v ON p.producto_id = v.producto_id
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
module.exports = { list, getOne, create, getProductByName,groupProductsAndVarieties, listProductsWithVarieties};
