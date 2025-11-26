const QRCode = require('qrcode');
const db = require('../config/db');

/**
 * @desc    Generar código QR para un pallet
 * @route   GET /api/pallets/:id/qr
 * @access  Public
 */
const generarQRPallet = async (req, res) => {
  try {
    const { id: pallet_id } = req.params;
    const { format = 'png' } = req.query; // png, svg, dataURL

    // Obtener información completa del pallet
    const [pallets] = await db.query(
      `SELECT p.*, 
              pr.nombre as producto_nombre,
              l.descripcion as lote_descripcion,
              sl.calibre as sublote_calibre
       FROM pallets p
       LEFT JOIN productos pr ON p.producto_id = pr.producto_id
       LEFT JOIN lotes l ON p.lote_id = l.lote_id
       LEFT JOIN sublotes sl ON p.sublote_id = sl.sublote_id
       WHERE p.pallet_id = ?
       LIMIT 1`,
      [pallet_id]
    );

    if (pallets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pallet no encontrado'
      });
    }

    const pallet = pallets[0];

    // Preparar datos para el QR
    const qrData = {
      pallet_id: pallet.pallet_id,
      producto: pallet.producto_nombre,
      producto_id: pallet.producto_id,
      lote: pallet.lote_descripcion,
      lote_id: pallet.lote_id,
      sublote: pallet.sublote_calibre,
      sublote_id: pallet.sublote_id,
      cantidad_cajas: pallet.cantidad_cajas,
      peso_total: parseFloat(pallet.peso_total),
      tipo_pallet: pallet.tipo_pallet,
      fecha_armado: pallet.fecha_armado,
      estado: pallet.estado
    };

    const qrString = JSON.stringify(qrData);

    // Generar QR según formato solicitado
    if (format === 'svg') {
      const qrSVG = await QRCode.toString(qrString, { type: 'svg' });
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(qrSVG);
    } else if (format === 'dataURL') {
      const qrDataURL = await QRCode.toDataURL(qrString);
      return res.json({
        success: true,
        dataURL: qrDataURL,
        data: qrData
      });
    } else {
      // PNG por defecto
      const qrBuffer = await QRCode.toBuffer(qrString);
      res.setHeader('Content-Type', 'image/png');
      return res.send(qrBuffer);
    }

  } catch (error) {
    console.error('Error generando QR:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar código QR',
      error: error.message
    });
  }
};

module.exports = {
  generarQRPallet
};
