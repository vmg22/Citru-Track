const db = require("../config/db");

const stockController = {
  /**
   * Obtener datos completos de stock con filtros
   * GET /api/stock
   */
  getStockData: async (req, res) => {
    try {
      const { producto_id, fecha_desde, fecha_hasta } = req.query;

      let query = `
        SELECT 
          p.pallet_id,
          p.producto_id,
          prod.nombre as producto_nombre,
          prod.categoria,
          p.lote_id,
          p.sublote_id,
          p.cantidad_cajas,
          p.peso_total,
          p.tipo_pallet,
          p.fecha_armado,
          p.camara_id, 					
          c.nombre as camara_nombre, 
          p.estado,
          p.etiqueta_qr,
          p.created_at
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        LEFT JOIN camaras c ON p.camara_id = c.camara_id
        WHERE 1=1 AND prod.activo = 1 -- <--- MODIFICADO: Solo productos activos
      `;

      const params = [];

      // Aplicar filtros
      if (producto_id) {
        query += " AND p.producto_id = ?";
        params.push(producto_id);
      }

      if (fecha_desde) {
        query += " AND DATE(p.fecha_armado) >= ?";
        params.push(fecha_desde);
      }

      if (fecha_hasta) {
        query += " AND DATE(p.fecha_armado) <= ?";
        params.push(fecha_hasta);
      }

      query += " ORDER BY p.fecha_armado DESC";

      const [rows] = await db.query(query, params);

      res.json(rows);
    } catch (error) {
      console.error("Error al obtener stock:", error);
      res.status(500).json({
        error: "Error al obtener datos de stock",
        message: error.message,
      });
    }
  },

  /**
   * Obtener resumen de stock agregado
   * GET /api/stock/resumen
   */
  getResumenStock: async (req, res) => {
    try {
      const { producto_id, fecha_desde, fecha_hasta } = req.query;

      // Base condition para las consultas que NO usan JOIN a productos o camaras (totales, porEstado)
      let baseCondition = "WHERE 1=1";
      const params = [];

      if (producto_id) {
        baseCondition += " AND p.producto_id = ?";
        params.push(producto_id);
      }

      if (fecha_desde) {
        baseCondition += " AND DATE(p.fecha_armado) >= ?";
        params.push(fecha_desde);
      }

      if (fecha_hasta) {
        baseCondition += " AND DATE(p.fecha_armado) <= ?";
        params.push(fecha_hasta);
      }

      // Condición de producto activo para consultas que hacen JOIN a 'productos'
      // Esto es crucial para queryPorProducto. Se aplicará la condición `prod.activo = 1` en el WHERE de esas consultas.

      // Total de cajas y pallets (Se beneficia del producto_id, NO requiere JOIN a productos)
      const queryTotales = `
        SELECT 
          COUNT(DISTINCT p.pallet_id) as total_pallets,
          COALESCE(SUM(p.cantidad_cajas), 0) as total_cajas,
          COALESCE(SUM(p.peso_total), 0) as peso_total
        FROM pallets p
        ${baseCondition}
      `;

      // Los parámetros para totales y porEstado son los mismos que para baseCondition
      const [totales] = await db.query(queryTotales, params);

      // Stock por estado (NO requiere JOIN a productos)
      const queryPorEstado = `
        SELECT 
          p.estado,
          COUNT(DISTINCT p.pallet_id) as cantidad_pallets,
          COALESCE(SUM(p.cantidad_cajas), 0) as cantidad_cajas,
          COALESCE(SUM(p.peso_total), 0) as peso_total
        FROM pallets p
        ${baseCondition}
        GROUP BY p.estado
      `;

      const [porEstado] = await db.query(queryPorEstado, params);

      // Stock por producto (REQUIERE JOIN a productos y filtro de ACTIVO)
      const queryPorProducto = `
        SELECT 
          p.producto_id,
          prod.nombre as producto_nombre,
          prod.categoria,
          COUNT(DISTINCT p.pallet_id) as cantidad_pallets,
          COALESCE(SUM(p.cantidad_cajas), 0) as cantidad_cajas,
          COALESCE(SUM(p.peso_total), 0) as peso_total
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        ${baseCondition} AND prod.activo = 1 -- <--- MODIFICADO: Solo productos activos
        GROUP BY p.producto_id, prod.nombre, prod.categoria
        ORDER BY cantidad_cajas DESC
      `;

      const [porProducto] = await db.query(queryPorProducto, params);

      // Stock por ubicación (REQUIERE JOIN a camaras, NO requiere JOIN a productos)
      const queryPorUbicacion = `
SELECT 
c.camara_id, 
c.nombre as ubicacion_nombre,
COUNT(DISTINCT p.pallet_id) as cantidad_pallets,
COALESCE(SUM(p.cantidad_cajas), 0) as cantidad_cajas
FROM pallets p
LEFT JOIN camaras c ON p.camara_id = c.camara_id
${baseCondition}
AND p.camara_id IS NOT NULL 
AND p.estado = 'en_camara' -- <--- AÑADIDO: Filtra solo pallets que están físicamente en la cámara
GROUP BY c.camara_id, c.nombre
ORDER BY cantidad_cajas DESC
`;

      const [porUbicacion] = await db.query(queryPorUbicacion, params);

      res.json({
        totales: totales[0],
        porEstado,
        porProducto,
        porUbicacion,
      });
    } catch (error) {
      console.error("Error al obtener resumen de stock:", error);
      res.status(500).json({
        error: "Error al obtener resumen de stock",
        message: error.message,
      });
    }
  },

  /**
   * Obtener stock por estado específico
   * GET /api/stock/estado/:estado
   */
  getStockPorEstado: async (req, res) => {
    try {
      const { estado } = req.params;
      const { producto_id } = req.query;

      let query = `
        SELECT 
          p.pallet_id,
          p.producto_id,
          prod.nombre as producto_nombre,
          p.cantidad_cajas,
          p.peso_total,
          p.fecha_armado,
          p.camara_id,
          c.nombre as camara_nombre
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        LEFT JOIN camaras c ON p.camara_id = c.camara_id
        WHERE p.estado = ? AND prod.activo = 1 -- <--- MODIFICADO: Solo productos activos
      `;

      const params = [estado];

      if (producto_id) {
        query += " AND p.producto_id = ?";
        params.push(producto_id);
      }

      query += " ORDER BY p.fecha_armado DESC";

      const [rows] = await db.query(query, params);

      res.json(rows);
    } catch (error) {
      console.error("Error al obtener stock por estado:", error);
      res.status(500).json({
        error: "Error al obtener stock por estado",
        message: error.message,
      });
    }
  },

  /**
   * Obtener stock por producto específico
   * GET /api/stock/producto/:producto_id
   */
  getStockPorProducto: async (req, res) => {
    try {
      const { producto_id } = req.params;
      const { estado, fecha_desde, fecha_hasta } = req.query;

      // 1. Obtener pallets de ese producto
      let query = `
        SELECT 
          p.pallet_id,
          p.lote_id,
          p.sublote_id,
          p.cantidad_cajas,
          p.peso_total,
          p.tipo_pallet,
          p.fecha_armado,
          p.camara_id,
          c.nombre as camara_nombre,
          p.estado,
          p.etiqueta_qr
        FROM pallets p
        LEFT JOIN camaras c ON p.camara_id = c.camara_id
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id -- <--- AGREGADO: JOIN a productos para el filtro
        WHERE p.producto_id = ? AND prod.activo = 1 -- <--- MODIFICADO: Verificar que el producto esté activo
      `;

      const params = [producto_id];

      if (estado) {
        query += " AND p.estado = ?";
        params.push(estado);
      }

      if (fecha_desde) {
        query += " AND DATE(p.fecha_armado) >= ?";
        params.push(fecha_desde);
      }

      if (fecha_hasta) {
        query += " AND DATE(p.fecha_armado) <= ?";
        params.push(fecha_hasta);
      }

      query += " ORDER BY p.fecha_armado DESC";

      const [rows] = await db.query(query, params);

      // Si no se encuentran pallets (ej. producto_id no existe o no está activo),
      // se puede devolver una respuesta vacía o un error 404/400.
      // Aquí, simplemente continuamos con el resumen.

      // 2. Obtener resumen (Asegura que solo cuenta si el producto está activo, aunque el producto_id ya está en el WHERE)
      // Usaremos un conjunto de parámetros que solo incluye el producto_id y los filtros opcionales.
      // Reconstruimos los params para el resumen, ya que la lógica del query condicional es un poco diferente.
      const resumenParams = [producto_id];
      if (estado) resumenParams.push(estado);
      if (fecha_desde) resumenParams.push(fecha_desde);
      if (fecha_hasta) resumenParams.push(fecha_hasta);

      const queryResumen = `
        SELECT 
          COUNT(DISTINCT p.pallet_id) as total_pallets,
          COALESCE(SUM(p.cantidad_cajas), 0) as total_cajas,
          COALESCE(SUM(p.peso_total), 0) as peso_total
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id -- <--- AGREGADO: JOIN a productos para el filtro
        WHERE p.producto_id = ? AND prod.activo = 1 -- <--- MODIFICADO: Verificar que el producto esté activo
        ${estado ? "AND p.estado = ?" : ""}
        ${fecha_desde ? "AND DATE(p.fecha_armado) >= ?" : ""}
        ${fecha_hasta ? "AND DATE(p.fecha_armado) <= ?" : ""}
      `;
      // Nota: Si el producto_id no está activo, ambas consultas devolverán conjuntos vacíos o totales en cero, lo cual es correcto.

      const [resumen] = await db.query(queryResumen, resumenParams);

      res.json({
        pallets: rows,
        resumen: resumen[0],
      });
    } catch (error) {
      console.error("Error al obtener stock por producto:", error);
      res.status(500).json({
        error: "Error al obtener stock por producto",
        message: error.message,
      });
    }
  },

  /**
   * Obtener alertas de stock bajo (Solo productos disponibles y activos)
   * GET /api/stock/alertas
   */
  getAlertasStock: async (req, res) => {
    try {
      const query = `
        SELECT 
          p.producto_id,
          prod.nombre as producto_nombre,
          prod.categoria,
          COUNT(DISTINCT p.pallet_id) as pallets_disponibles,
          COALESCE(SUM(p.cantidad_cajas), 0) as cajas_disponibles
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        WHERE p.estado IN ('armado', 'en_camara') AND prod.activo = 1 -- <--- MODIFICADO: Solo productos activos
        GROUP BY p.producto_id, prod.nombre, prod.categoria
        ORDER BY cajas_disponibles ASC
        LIMIT 10
      `;

      const [rows] = await db.query(query);

      res.json(rows);
    } catch (error) {
      console.error("Error al obtener alertas de stock:", error);
      res.status(500).json({
        error: "Error al obtener alertas de stock",
        message: error.message,
      });
    }
  },

  /**
   * Obtener histórico de movimientos de stock (Solo para productos activos)
   * GET /api/stock/historico
   */
  getHistoricoStock: async (req, res) => {
    try {
      const { producto_id, dias = 30 } = req.query;

      let query = `
        SELECT 
          DATE(p.fecha_armado) as fecha,
          p.producto_id,
          prod.nombre as producto_nombre,
          p.estado,
          COUNT(DISTINCT p.pallet_id) as cantidad_pallets,
          COALESCE(SUM(p.cantidad_cajas), 0) as cantidad_cajas
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        WHERE p.fecha_armado >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND prod.activo = 1 -- <--- MODIFICADO: Solo productos activos
      `;

      const params = [dias];

      if (producto_id) {
        query += " AND p.producto_id = ?";
        params.push(producto_id);
      }

      query += `
        GROUP BY DATE(p.fecha_armado), p.producto_id, prod.nombre, p.estado
        ORDER BY fecha DESC, p.producto_id, p.estado
      `;

      const [rows] = await db.query(query, params);

      res.json(rows);
    } catch (error) {
      console.error("Error al obtener histórico de stock:", error);
      res.status(500).json({
        error: "Error al obtener histórico de stock",
        message: error.message,
      });
    }
  },
};

module.exports = stockController;
