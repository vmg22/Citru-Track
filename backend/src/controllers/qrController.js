const QRCode = require('qrcode');
const db = require('../config/db');

// --- Función Auxiliar para Generar el QR ---
const generateQRCode = async (qrData, format) => {
    const qrString = JSON.stringify(qrData);

    if (format === 'svg') {
        const qrSVG = await QRCode.toString(qrString, { type: 'svg' });
        return { type: 'image/svg+xml', data: qrSVG };
    } else if (format === 'dataURL') {
        const qrDataURL = await QRCode.toDataURL(qrString, { width: 200, margin: 1 });
        return { type: 'application/json', data: { success: true, dataURL: qrDataURL, data: qrData } };
    } else {
        // PNG por defecto
        const qrBuffer = await QRCode.toBuffer(qrString);
        return { type: 'image/png', data: qrBuffer };
    }
};

// ============================================
// 1. GENERAR QR PARA CAJA
// ============================================
/**
 * @desc    Generar código QR para una caja
 * @route   GET /api/cajas/:id/qr
 * @access  Public
 */
const generarQRCaja = async (req, res) => {
  try {
    const { id: caja_id } = req.params;
    const { format = 'png' } = req.query; 

    // Obtener información completa de la caja
    // Usamos las uniones necesarias para obtener los nombres descriptivos
    const [cajas] = await db.query(
      `SELECT c.caja_id, c.producto_id, c.lote_id, c.sublote_id, c.tipo_caja, c.peso_neto, c.estado, 
              pr.nombre as producto_nombre,
              l.descripcion as lote_descripcion,
              sl.calibre as sublote_calibre
       FROM cajas c
       LEFT JOIN productos pr ON c.producto_id = pr.producto_id
       LEFT JOIN lotes l ON c.lote_id = l.lote_id
       LEFT JOIN sublotes sl ON c.sublote_id = sl.sublote_id
       WHERE c.caja_id = ?
       LIMIT 1`,
      [caja_id]
    );

    if (cajas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    const caja = cajas[0];

    // Preparar datos para el QR (datos esenciales de la caja para la lectura)
    const qrData = {
      caja_id: caja.caja_id,
      producto_id: caja.producto_id,
      lote_id: caja.lote_id,
      sublote_id: caja.sublote_id,
      tipo_caja: caja.tipo_caja || null,
      peso_neto: parseFloat(caja.peso_neto) || null,
      // Opcional: Puedes incluir el nombre para la vista previa, aunque no es esencial para el escaneo
      producto_nombre: caja.producto_nombre, 
      estado: caja.estado
    };

    const result = await generateQRCode(qrData, format);

    if (format === 'dataURL') {
      return res.json(result.data);
    } else {
      res.setHeader('Content-Type', result.type);
      return res.send(result.data);
    }

  } catch (error) {
    console.error('Error generando QR para caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar código QR para caja',
      error: error.message
    });
  }
};


// ============================================
// 2. GENERAR QR PARA PALLET (EXISTENTE)
// ============================================
/**
 * @desc    Generar código QR para un pallet
 * @route   GET /api/pallets/:id/qr
 * @access  Public
 */
const generarQRPallet = async (req, res) => {
  try {
    const { id: pallet_id } = req.params;
    const { format = 'png' } = req.query; // png, svg, dataURL

    // ... (Tu lógica de obtención de pallet permanece igual) ...
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
    
    const result = await generateQRCode(qrData, format);

    // Devolver la respuesta en el formato correcto
    if (format === 'dataURL') {
        return res.json(result.data);
    } else {
        res.setHeader('Content-Type', result.type);
        return res.send(result.data);
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

/**
 * @desc    Generar código QR para una caja
 * @route   GET /api/cajas/:caja_id/qr
 * @access  Public
 */
const generarQRCaja = async (req, res) => {
  try {
    const { caja_id } = req.params;
    const { format = 'png' } = req.query; // png, svg, dataURL

    // Obtener información completa de la caja
    const [cajas] = await db.query(
      `SELECT c.*, 
              pr.nombre as producto_nombre,
              l.descripcion as lote_descripcion,
              sl.calibre as sublote_calibre
       FROM cajas c
       LEFT JOIN productos pr ON c.producto_id = pr.producto_id
       LEFT JOIN lotes l ON c.lote_id = l.lote_id
       LEFT JOIN sublotes sl ON c.sublote_id = sl.sublote_id
       WHERE c.caja_id = ?
       LIMIT 1`,
      [caja_id]
    );

    if (cajas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    const caja = cajas[0];

    // Preparar datos para el QR
    const qrData = {
      caja_id: caja.caja_id,
      producto: caja.producto_nombre,
      producto_id: caja.producto_id,
      lote: caja.lote_descripcion,
      lote_id: caja.lote_id,
      sublote: caja.sublote_calibre,
      sublote_id: caja.sublote_id,
      tipo_caja: caja.tipo_caja,
      peso_neto: parseFloat(caja.peso_neto),
      estado: caja.estado,
      pallet_id: caja.pallet_id,
      created_at: caja.created_at
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
        res.setHeader('Content-Type', result.type);
        return res.send(result.data);
    }

  } catch (error) {
    console.error('Error generando QR de caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar código QR de caja',
      error: error.message
    });
  }
};

/**
 * @desc    Generar código QR para una caja
 * @route   GET /api/cajas/:caja_id/qr
 * @access  Public
 */
const generarQRCaja = async (req, res) => {
  try {
    const { caja_id } = req.params;
    const { format = 'png' } = req.query; // png, svg, dataURL

    // Obtener información completa de la caja
    const [cajas] = await db.query(
      `SELECT c.*, 
              pr.nombre as producto_nombre,
              l.descripcion as lote_descripcion,
              sl.calibre as sublote_calibre
       FROM cajas c
       LEFT JOIN productos pr ON c.producto_id = pr.producto_id
       LEFT JOIN lotes l ON c.lote_id = l.lote_id
       LEFT JOIN sublotes sl ON c.sublote_id = sl.sublote_id
       WHERE c.caja_id = ?
       LIMIT 1`,
      [caja_id]
    );

    if (cajas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    const caja = cajas[0];

    // Preparar datos para el QR
    const qrData = {
      caja_id: caja.caja_id,
      producto: caja.producto_nombre,
      producto_id: caja.producto_id,
      lote: caja.lote_descripcion,
      lote_id: caja.lote_id,
      sublote: caja.sublote_calibre,
      sublote_id: caja.sublote_id,
      tipo_caja: caja.tipo_caja,
      peso_neto: parseFloat(caja.peso_neto),
      estado: caja.estado,
      pallet_id: caja.pallet_id,
      created_at: caja.created_at
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
    console.error('Error generando QR de caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar código QR de caja',
      error: error.message
    });
  }
};

module.exports = {
  generarQRPallet
};