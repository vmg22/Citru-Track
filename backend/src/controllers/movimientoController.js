const db = require("../config/db");

const movementController = {
  /**
   * Actualiza el estado de un pallet y sincroniza el estado de sus cajas.
   * PUT /api/pallets/:pallet_id/mover
   */
  moverPallet: async (req, res) => {
    const { pallet_id } = req.params;
    const { nuevo_estado, nueva_camara_id = null } = req.body; 

    if (!nuevo_estado) {
      return res.status(400).json({ error: "El nuevo estado es obligatorio." });
    }
    
    let connection;

    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // 1. Actualizar el estado y/o cámara del pallet
      const updatePalletQuery = `
        UPDATE pallets 
        SET estado = ?, camara_id = ?
        WHERE pallet_id = ?
      `;
      const [palletResult] = await connection.query(updatePalletQuery, [
        nuevo_estado,
        nueva_camara_id,
        pallet_id,
      ]);

      if (palletResult.affectedRows === 0) {
        throw new Error(`Pallet ${pallet_id} no encontrado.`);
      }

      // 2. Sincronizar el estado de todas las cajas asociadas
      const updateCajasQuery = `
        UPDATE cajas 
        SET estado = ? 
        WHERE pallet_id = ?
      `;
      await connection.query(updateCajasQuery, [nuevo_estado, pallet_id]);

      await connection.commit();

      res.status(200).json({
        success: true,
        message: `Pallet ${pallet_id} movido a estado '${nuevo_estado}' con éxito.`,
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Error al registrar el movimiento del pallet:", error);
      res.status(500).json({
        success: false,
        error: "Error al registrar el movimiento del pallet",
        message: error.message,
      });
    } finally {
      if (connection) connection.release();
    }
  },
};

module.exports = movementController;