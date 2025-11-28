const db = require("../config/db");

const palletCreationController = {
  /**
   * Crea un pallet y asocia las cajas a ese pallet en una transacción.
   * POST /api/pallets/armar
   */
  armarPallet: async (req, res) => {
    const {
      pallet_id,
      producto_id,
      lote_id,
      sublote_id,
      tipo_pallet,
      camara_id,
      cajas_a_incluir, // Array de IDs de caja: ['CAJ-0001', 'CAJ-0002', ...]
    } = req.body;

    // Validación básica
    if (!pallet_id || !producto_id || !cajas_a_incluir || cajas_a_incluir.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos obligatorios (pallet_id, producto_id, cajas_a_incluir).",
      });
    }

    let connection;

    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // 1. Obtener info de las cajas y BLOQUEARLAS (FOR UPDATE) para evitar concurrencia
      const placeholders = cajas_a_incluir.map(() => "?").join(",");
      
      // Nota: Agregamos 'FOR UPDATE' para que nadie más pueda tomar estas cajas mientras se procesa esta transacción
      const [cajasData] = await connection.query(
        `SELECT caja_id, peso_neto, estado FROM cajas WHERE caja_id IN (${placeholders}) FOR UPDATE`,
        cajas_a_incluir
      );

      // Verificación de existencia
      if (cajasData.length !== cajas_a_incluir.length) {
        // Identificar cuáles faltan (opcional, pero útil para debug)
        const encontrados = cajasData.map(c => c.caja_id);
        const faltantes = cajas_a_incluir.filter(id => !encontrados.includes(id));
        throw new Error(`Las siguientes cajas no existen: ${faltantes.join(', ')}`);
      }

      // Verificación de disponibilidad
      const cajasNoDisponibles = cajasData.filter(c => c.estado !== 'en_planta');
      if (cajasNoDisponibles.length > 0) {
        throw new Error(`Las cajas [${cajasNoDisponibles.map(c => c.caja_id).join(', ')}] no están disponibles (Estado actual: no es 'en_planta').`);
      }

      // Cálculos
      const total_cajas = cajasData.length;
      
      // CORRECCIÓN: Parsear el peso correctamente (manejar "19,20 kilogramos")
      const peso_total = cajasData.reduce((sum, caja) => {
        let peso = 0;
        if (caja.peso_neto) {
             // Limpiar string: "19,20 kg" -> "19.20"
             const limpio = String(caja.peso_neto).replace(/[^0-9.,]/g, '').replace(',', '.');
             peso = parseFloat(limpio) || 0;
        }
        return sum + peso;
      }, 0);

      // 2. Insertar el nuevo pallet
      // SE AGREGAN peso_total y cantidad_cajas
      const insertPalletQuery = `
        INSERT INTO pallets (
          pallet_id, producto_id, lote_id, sublote_id, 
          tipo_pallet, fecha_armado, estado, camara_id, 
          created_at, etiqueta_qr, peso_total, cantidad_cajas
        ) VALUES (?, ?, ?, ?, ?, NOW(), 'armado', ?, NOW(), ?, ?, ?)
      `;

      await connection.query(insertPalletQuery, [
        pallet_id,
        producto_id,
        lote_id || null,
        sublote_id || null,
        tipo_pallet || 'estándar',
        camara_id || null,
        `QR-${pallet_id}`,
        peso_total,
        total_cajas
      ]);

      // 3. Actualizar cajas: asociar pallet y cambiar estado
      const updateCajasQuery = `
        UPDATE cajas
        SET pallet_id = ?, estado = 'armado'
        WHERE caja_id IN (${placeholders})
      `;

      await connection.query(updateCajasQuery, [pallet_id, ...cajas_a_incluir]);

      await connection.commit();

      res.status(201).json({
        success: true,
        message: `Pallet ${pallet_id} armado con éxito.`,
        data: {
          pallet_id,
          total_cajas,
          peso_total: Number(peso_total.toFixed(2)), // Redondeo a 2 decimales por seguridad
          estado: 'armado',
          cajas_incluidas: cajas_a_incluir,
        },
      });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Error al armar el pallet:", error);
      
      // Manejo de error de clave duplicada (ej. si el pallet ID ya existe)
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: "Conflicto",
          message: `El ID de pallet ${pallet_id} ya existe.`,
        });
      }

      res.status(500).json({
        success: false,
        error: "Error interno al armar el pallet",
        message: error.message,
      });
    } finally {
      if (connection) connection.release();
    }
  }, // <--- COMA IMPORTANTE AQUÍ PARA SEPARAR MÉTODOS

  /**
   * Obtiene cajas disponibles para armar pallet filtradas por producto/lote
   * GET /api/pallets/cajas-disponibles
   */
  getCajasDisponibles: async (req, res) => {
    try {
      const { producto_id, lote_id, sublote_id } = req.query;

      if (!producto_id || !lote_id) {
        return res.status(400).json({
          success: false,
          message: 'producto_id y lote_id son obligatorios para filtrar cajas.'
        });
      }

      let query = `
        SELECT c.* FROM cajas c
        WHERE c.estado = 'en_planta'
          AND c.pallet_id IS NULL
          AND c.producto_id = ?
          AND c.lote_id = ?
      `;
      const params = [producto_id, lote_id];

      if (sublote_id) {
        query += ` AND c.sublote_id = ?`;
        params.push(sublote_id);
      }

      const [cajas] = await db.query(query, params);
      
      res.json({ 
        success: true, 
        cajas, 
        total: cajas.length 
      });

    } catch (error) {
      console.error("Error obteniendo cajas:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = palletCreationController;