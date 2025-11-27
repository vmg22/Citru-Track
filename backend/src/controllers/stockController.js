const db = require("../config/db");

const stockController = {
  /**
   * Obtener datos completos de stock con filtros (Detalle por Pallet)
   * GET /api/stock
   * NOTA: Usa subconsultas para calcular cajas y peso para mantener 1 fila por pallet.
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
          -- ----------------------------------------------------
          -- CAMPOS RECALCULADOS DINÁMICAMENTE DESDE LA TABLA CAJAS
          -- ----------------------------------------------------
          (
            SELECT COALESCE(COUNT(caja_id), 0) FROM cajas c WHERE c.pallet_id = p.pallet_id
          ) as cantidad_cajas,
          (
            SELECT COALESCE(SUM(c.peso_neto), 0) FROM cajas c WHERE c.pallet_id = p.pallet_id
          ) as peso_total,
          -- ----------------------------------------------------
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
        WHERE 1=1 AND prod.activo = 1 
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
   * Obtener resumen de stock agregado (Agregación dinámica sobre pallets y cajas)
   * GET /api/stock/resumen
   */
  getResumenStock: async (req, res) => {
    try {
      const { producto_id, fecha_desde, fecha_hasta } = req.query;

      // Base condition (solo para filtros de tiempo y producto, NO estado/activo)
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

      // 1. Total de cajas y pallets (Incluye JOIN a Cajas, excluye despachados y anulados)
      const queryTotales = `
        SELECT 
          COUNT(DISTINCT p.pallet_id) as total_pallets,
          COALESCE(SUM(c.peso_neto), 0) as peso_total, 
          COUNT(c.caja_id) as total_cajas
        FROM pallets p
        LEFT JOIN cajas c ON c.pallet_id = p.pallet_id
        ${baseCondition} 
        AND p.estado NOT IN ('despachado', 'anulado')
      `;

      const [totales] = await db.query(queryTotales, params);

      // 2. Stock por estado (Incluye JOIN a Cajas)
      const queryPorEstado = `
        SELECT 
          p.estado,
          COUNT(DISTINCT p.pallet_id) as cantidad_pallets,
          COALESCE(SUM(c.peso_neto), 0) as peso_total, 
          COUNT(c.caja_id) as cantidad_cajas
        FROM pallets p
        LEFT JOIN cajas c ON c.pallet_id = p.pallet_id
        ${baseCondition}
        GROUP BY p.estado
      `;

      const [porEstado] = await db.query(queryPorEstado, params);

      // 3. Stock por producto (Incluye JOIN a Cajas y filtro de ACTIVO)
      const queryPorProducto = `
        SELECT 
          p.producto_id,
          prod.nombre as producto_nombre,
          prod.categoria,
          COUNT(DISTINCT p.pallet_id) as cantidad_pallets,
          COALESCE(SUM(c.peso_neto), 0) as peso_total, 
          COUNT(c.caja_id) as cantidad_cajas
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        LEFT JOIN cajas c ON c.pallet_id = p.pallet_id
        ${baseCondition} 
        AND prod.activo = 1 
        AND p.estado NOT IN ('despachado', 'anulado')
        GROUP BY p.producto_id, prod.nombre, prod.categoria
        ORDER BY cantidad_cajas DESC
      `;

      const [porProducto] = await db.query(queryPorProducto, params);

      // 4. Stock por ubicación (Cámaras) (Requiere JOIN a Camaras y Cajas)
      const queryPorUbicacion = `
        SELECT 
          c.camara_id, 
          c.nombre as ubicacion_nombre,
          COUNT(DISTINCT p.pallet_id) as cantidad_pallets,
          COUNT(ca.caja_id) as cantidad_cajas
        FROM pallets p
        LEFT JOIN camaras c ON p.camara_id = c.camara_id
        LEFT JOIN cajas ca ON ca.pallet_id = p.pallet_id
        ${baseCondition}
        AND p.camara_id IS NOT NULL 
        AND p.estado = 'en_camara'
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
   * Obtener stock por estado específico (Detalle por Pallet)
   * GET /api/stock/estado/:estado
   * NOTA: Usa subconsultas para calcular cajas y peso para mantener 1 fila por pallet.
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
          -- ----------------------------------------------------
          -- CAMPOS RECALCULADOS DINÁMICAMENTE DESDE LA TABLA CAJAS
          -- ----------------------------------------------------
          (
            SELECT COALESCE(COUNT(caja_id), 0) FROM cajas c WHERE c.pallet_id = p.pallet_id
          ) as cantidad_cajas,
          (
            SELECT COALESCE(SUM(c.peso_neto), 0) FROM cajas c WHERE c.pallet_id = p.pallet_id
          ) as peso_total,
          -- ----------------------------------------------------
          p.fecha_armado,
          p.camara_id,
          c.nombre as camara_nombre
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        LEFT JOIN camaras c ON p.camara_id = c.camara_id
        WHERE p.estado = ? AND prod.activo = 1 
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
   * Obtener stock por producto específico (Detalle por Pallet y Resumen)
   * GET /api/stock/producto/:producto_id
   * NOTA: Usa subconsultas para calcular cajas y peso en la consulta principal.
   */
  getStockPorProducto: async (req, res) => {
    try {
      const { producto_id } = req.params;
      const { estado, fecha_desde, fecha_hasta } = req.query;

      // 1. Obtener pallets de ese producto (Consulta principal)
      let query = `
        SELECT 
          p.pallet_id,
          p.lote_id,
          p.sublote_id,
          -- ----------------------------------------------------
          -- CAMPOS RECALCULADOS DINÁMICAMENTE DESDE LA TABLA CAJAS
          -- ----------------------------------------------------
          (
            SELECT COALESCE(COUNT(caja_id), 0) FROM cajas c WHERE c.pallet_id = p.pallet_id
          ) as cantidad_cajas,
          (
            SELECT COALESCE(SUM(c.peso_neto), 0) FROM cajas c WHERE c.pallet_id = p.pallet_id
          ) as peso_total,
          -- ----------------------------------------------------
          p.tipo_pallet,
          p.fecha_armado,
          p.camara_id,
          c.nombre as camara_nombre,
          p.estado,
          p.etiqueta_qr
        FROM pallets p
        LEFT JOIN camaras c ON p.camara_id = c.camara_id
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        WHERE p.producto_id = ? AND prod.activo = 1 
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

      // 2. Obtener resumen (Agregación sobre pallets y cajas)
      const resumenParams = [producto_id];
      if (estado) resumenParams.push(estado);
      if (fecha_desde) resumenParams.push(fecha_desde);
      if (fecha_hasta) resumenParams.push(fecha_hasta);

      // Base query para el resumen
      let whereClause = "WHERE p.producto_id = ? AND prod.activo = 1";
      if (estado) {
        whereClause += " AND p.estado = ?";
      } else {
        whereClause += " AND p.estado NOT IN ('despachado', 'anulado')";
      }
      if (fecha_desde) whereClause += " AND DATE(p.fecha_armado) >= ?";
      if (fecha_hasta) whereClause += " AND DATE(p.fecha_armado) <= ?";

      const queryResumen = `
        SELECT 
          COUNT(DISTINCT p.pallet_id) as total_pallets,
          COALESCE(SUM(c.peso_neto), 0) as peso_total, 
          COUNT(c.caja_id) as total_cajas
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        LEFT JOIN cajas c ON c.pallet_id = p.pallet_id
        ${whereClause}
      `;

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
   * Obtener alertas de stock bajo (Agregación sobre pallets y cajas)
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
          COALESCE(SUM(c.peso_neto), 0) as peso_total, 
          COUNT(c.caja_id) as cajas_disponibles
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        LEFT JOIN cajas c ON c.pallet_id = p.pallet_id
        WHERE p.estado IN ('armado', 'en_camara') AND prod.activo = 1 
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
   * Obtener histórico de movimientos de stock (Agregación sobre pallets y cajas)
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
          COUNT(c.caja_id) as cantidad_cajas
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        LEFT JOIN cajas c ON c.pallet_id = p.pallet_id
        WHERE p.fecha_armado >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND prod.activo = 1 
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