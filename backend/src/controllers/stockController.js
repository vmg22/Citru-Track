const db = require('../config/db');

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
        LEFT JOIN camaras c ON p.camara_id = c.camara_id  -- <--- AGREGADO: JOIN a camaras
        WHERE 1=1
      `;

      const params = [];

      // Aplicar filtros
      if (producto_id) {
        query += ' AND p.producto_id = ?';
        params.push(producto_id);
      }

      if (fecha_desde) {
        query += ' AND DATE(p.fecha_armado) >= ?';
        params.push(fecha_desde);
      }

      if (fecha_hasta) {
        query += ' AND DATE(p.fecha_armado) <= ?';
        params.push(fecha_hasta);
      }

      query += ' ORDER BY p.fecha_armado DESC';

      const [rows] = await db.query(query, params);

      res.json(rows);
    } catch (error) {
      console.error('Error al obtener stock:', error);
      res.status(500).json({ 
        error: 'Error al obtener datos de stock',
        message: error.message 
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

      let baseCondition = 'WHERE 1=1';
      const params = [];

      if (producto_id) {
        baseCondition += ' AND p.producto_id = ?';
        params.push(producto_id);
      }

      if (fecha_desde) {
        baseCondition += ' AND DATE(p.fecha_armado) >= ?';
        params.push(fecha_desde);
      }

      if (fecha_hasta) {
        baseCondition += ' AND DATE(p.fecha_armado) <= ?';
        params.push(fecha_hasta);
      }

      // Total de cajas y pallets (No requiere cambios)
      const queryTotales = `
        SELECT 
          COUNT(DISTINCT p.pallet_id) as total_pallets,
          COALESCE(SUM(p.cantidad_cajas), 0) as total_cajas,
          COALESCE(SUM(p.peso_total), 0) as peso_total
        FROM pallets p
        ${baseCondition}
      `;

      const [totales] = await db.query(queryTotales, params);

      // Stock por estado (No requiere cambios)
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

      // Stock por producto (No requiere cambios en la selección de campos)
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
        ${baseCondition}
        GROUP BY p.producto_id, prod.nombre, prod.categoria
        ORDER BY cantidad_cajas DESC
      `;

      const [porProducto] = await db.query(queryPorProducto, params);

      // Stock por ubicación (MODIFICADO: Ahora usa el camara_id y obtiene el nombre)
      const queryPorUbicacion = `
        SELECT 
          c.camara_id,               -- <--- MODIFICADO: Usar el ID
          c.nombre as ubicacion_nombre,  -- <--- AGREGADO: Nombre de la cámara para mostrar
          COUNT(DISTINCT p.pallet_id) as cantidad_pallets,
          COALESCE(SUM(p.cantidad_cajas), 0) as cantidad_cajas
        FROM pallets p
        LEFT JOIN camaras c ON p.camara_id = c.camara_id  -- <--- AGREGADO: JOIN a camaras
        ${baseCondition}
        AND p.camara_id IS NOT NULL  -- <--- MODIFICADO: Filtro por el nuevo ID
        GROUP BY c.camara_id, c.nombre  -- <--- MODIFICADO: Agrupar por ID y Nombre
        ORDER BY cantidad_cajas DESC
      `;

      const [porUbicacion] = await db.query(queryPorUbicacion, params);

      res.json({
        totales: totales[0],
        porEstado,
        porProducto,
        porUbicacion
      });
    } catch (error) {
      console.error('Error al obtener resumen de stock:', error);
      res.status(500).json({ 
        error: 'Error al obtener resumen de stock',
        message: error.message 
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
          p.camara_id,              -- <--- MODIFICADO: Nueva columna ID
          c.nombre as camara_nombre  -- <--- AGREGADO: Nombre de la cámara
        FROM pallets p
        LEFT JOIN productos prod ON p.producto_id = prod.producto_id
        LEFT JOIN camaras c ON p.camara_id = c.camara_id  -- <--- AGREGADO: JOIN a camaras
        WHERE p.estado = ?
      `;

      const params = [estado];

      if (producto_id) {
        query += ' AND p.producto_id = ?';
        params.push(producto_id);
      }

      query += ' ORDER BY p.fecha_armado DESC';

      const [rows] = await db.query(query, params);

      res.json(rows);
    } catch (error) {
      console.error('Error al obtener stock por estado:', error);
      res.status(500).json({ 
        error: 'Error al obtener stock por estado',
        message: error.message 
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

      let query = `
        SELECT 
          p.pallet_id,
          p.lote_id,
          p.sublote_id,
          p.cantidad_cajas,
          p.peso_total,
          p.tipo_pallet,
          p.fecha_armado,
          p.camara_id,              -- <--- MODIFICADO: Nueva columna ID
          c.nombre as camara_nombre,  -- <--- AGREGADO: Nombre de la cámara
          p.estado,
          p.etiqueta_qr
        FROM pallets p
        LEFT JOIN camaras c ON p.camara_id = c.camara_id  -- <--- AGREGADO: JOIN a camaras
        WHERE p.producto_id = ?
      `;

      const params = [producto_id];

      if (estado) {
        query += ' AND p.estado = ?';
        params.push(estado);
      }

      if (fecha_desde) {
        query += ' AND DATE(p.fecha_armado) >= ?';
        params.push(fecha_desde);
      }

      if (fecha_hasta) {
        query += ' AND DATE(p.fecha_armado) <= ?';
        params.push(fecha_hasta);
      }

      query += ' ORDER BY p.fecha_armado DESC';

      const [rows] = await db.query(query, params);

      // Obtener resumen (No requiere cambios en la selección de campos, solo en los JOINS si aplica)
      const queryResumen = `
        SELECT 
          COUNT(DISTINCT p.pallet_id) as total_pallets,
          COALESCE(SUM(p.cantidad_cajas), 0) as total_cajas,
          COALESCE(SUM(p.peso_total), 0) as peso_total
        FROM pallets p
        WHERE p.producto_id = ?
        ${estado ? 'AND p.estado = ?' : ''}
        ${fecha_desde ? 'AND DATE(p.fecha_armado) >= ?' : ''}
        ${fecha_hasta ? 'AND DATE(p.fecha_armado) <= ?' : ''}
      `;

      const [resumen] = await db.query(queryResumen, params);

      res.json({
        pallets: rows,
        resumen: resumen[0]
      });
    } catch (error) {
      console.error('Error al obtener stock por producto:', error);
      res.status(500).json({ 
        error: 'Error al obtener stock por producto',
        message: error.message 
      });
    }
  },

  /**
   * Obtener alertas de stock bajo (No requiere cambios de JOIN/SELECT)
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
        WHERE p.estado IN ('armado', 'en_camara')
        GROUP BY p.producto_id, prod.nombre, prod.categoria
        ORDER BY cajas_disponibles ASC
        LIMIT 10
      `;

      const [rows] = await db.query(query);

      res.json(rows);
    } catch (error) {
      console.error('Error al obtener alertas de stock:', error);
      res.status(500).json({ 
        error: 'Error al obtener alertas de stock',
        message: error.message 
      });
    }
  },

  /**
   * Obtener histórico de movimientos de stock (No requiere cambios de JOIN/SELECT)
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
        WHERE p.fecha_armado >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      `;

      const params = [dias];

      if (producto_id) {
        query += ' AND p.producto_id = ?';
        params.push(producto_id);
      }

      query += `
        GROUP BY DATE(p.fecha_armado), p.producto_id, prod.nombre, p.estado
        ORDER BY fecha DESC, p.producto_id, p.estado
      `;

      const [rows] = await db.query(query, params);

      res.json(rows);
    } catch (error) {
      console.error('Error al obtener histórico de stock:', error);
      res.status(500).json({ 
        error: 'Error al obtener histórico de stock',
        message: error.message 
      });
    }
  },

};

module.exports = stockController;