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

    // Validación básica, se necesita un middleware más completo
    if (!pallet_id || !producto_id || !cajas_a_incluir || cajas_a_incluir.length === 0) {
      return res.status(400).json({
        error: "Faltan campos obligatorios para armar el pallet (pallet_id, producto_id, cajas_a_incluir).",
      });
    }

    let connection;

    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // 1. Obtener la información de las cajas (peso y conteo) y validar disponibilidad
      const placeholders = cajas_a_incluir.map(() => "?").join(",");
      const [cajasData] = await connection.query(
        `SELECT caja_id, peso_neto, estado FROM cajas WHERE caja_id IN (${placeholders})`,
        cajas_a_incluir
      );

      if (cajasData.length !== cajas_a_incluir.length) {
        throw new Error("Una o más cajas no fueron encontradas.");
      }

      // Validación: Las cajas deben estar disponibles (ej. 'en_planta')
      const cajasNoDisponibles = cajasData.filter(c => c.estado !== 'en_planta');
      if (cajasNoDisponibles.length > 0) {
          throw new Error(`Las cajas con ID: ${cajasNoDisponibles.map(c => c.caja_id).join(', ')} no están en estado 'en_planta'.`);
      }

      const total_cajas = cajasData.length;
      const peso_total = cajasData.reduce((sum, caja) => sum + parseFloat(caja.peso_neto), 0);
      
      // 2. Insertar el nuevo pallet (Aquí podrías eliminar cantidad_cajas y peso_total si ya no existen en tu tabla pallets)
      const insertPalletQuery = `
        INSERT INTO pallets (
          pallet_id, producto_id, lote_id, sublote_id, 
          tipo_pallet, fecha_armado, estado, camara_id, 
          created_at, etiqueta_qr
        ) VALUES (?, ?, ?, ?, ?, NOW(), 'armado', ?, NOW(), ?)
      `;
      
      await connection.query(insertPalletQuery, [
        pallet_id,
        producto_id,
        lote_id || null,
        sublote_id || null,
        tipo_pallet || 'estándar',
        camara_id || null,
        `QR-${pallet_id}` // Simulación de etiqueta QR
      ]);

      // 3. Asociar el pallet_id y actualizar el estado de las cajas a 'armado'
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
          peso_total,
          estado: 'armado',
          cajas_incluidas: cajas_a_incluir,
        },
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Error al armar el pallet:", error);
      res.status(500).json({
        success: false,
        error: "Error al armar el pallet",
        message: error.message,
      });
    } finally {
      if (connection) connection.release();
    }
  },
};

module.exports = palletCreationController;