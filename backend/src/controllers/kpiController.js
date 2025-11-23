// // controllers/kpi.controller.js
// const pool = require("../config/db");

// /**
//  * Helper: parse optional query params: producto_id, fecha_from, fecha_to
//  */
// function parseFilters(req) {
//   const producto_id = req.query.producto_id
//     ? parseInt(req.query.producto_id, 10)
//     : null;
//   const fecha_from = req.query.fecha_from || null; // 'YYYY-MM-DD'
//   const fecha_to = req.query.fecha_to || null;
//   return { producto_id, fecha_from, fecha_to };
// }

// /**
//  * 1) Volumen ingresado a planta
//  * - total kg por dia/mes
//  * - por producto (bins.producto_id)
//  * - por finca y productor
//  */
// exports.getVolume = async (req, res) => {
//   const { producto_id, fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let where = "WHERE 1=1 ";
//     if (producto_id) {
//       where += " AND b.producto_id = ? ";
//       params.push(producto_id);
//     }
//     if (fecha_from) {
//       where += " AND DATE(b.registrado_at) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       where += " AND DATE(b.registrado_at) <= ? ";
//       params.push(fecha_to);
//     }

//     // total por dia (últimos 30 días si no se filtra)
//     const [perDay] = await pool.query(
//       `SELECT DATE(b.registrado_at) AS fecha, SUM(IFNULL(b.peso_bruto,0)) AS kg_ingresados
//        FROM bins b
//        ${where}
//        GROUP BY DATE(b.registrado_at)
//        ORDER BY fecha DESC
//        LIMIT 90`,
//       params
//     );

//     // total por productor
//     const [byProductor] = await pool.query(
//       `SELECT pr.productor_id, pr.nombre AS productor, SUM(IFNULL(b.peso_bruto,0)) AS kg_ingresados
//        FROM bins b
//        LEFT JOIN productores pr ON b.productor_id = pr.productor_id
//        ${where}
//        GROUP BY pr.productor_id, pr.nombre
//        ORDER BY kg_ingresados DESC
//        LIMIT 50`,
//       params
//     );

//     // total por finca
//     const [byFinca] = await pool.query(
//       `SELECT f.finca_id, f.nombre AS finca, SUM(IFNULL(b.peso_bruto,0)) AS kg_ingresados
//        FROM bins b
//        LEFT JOIN fincas f ON b.finca_id = f.finca_id
//        ${where}
//        GROUP BY f.finca_id, f.nombre
//        ORDER BY kg_ingresados DESC
//        LIMIT 50`,
//       params
//     );

//     res.json({ perDay, byProductor, byFinca });
//   } catch (err) {
//     console.error("getVolume error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * 2) Rendimiento de lotes
//  * - % rendimiento = kg empaquetado (cajas.peso_neto) / kg bin (bins.peso_bruto)
//  * - % descartes por lote (sublotes.porcentaje_descartes)
//  * - cajas producidas por lote
//  */
// exports.getRendimientoPorLote = async (req, res) => {
//   const { producto_id, fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let whereL = "WHERE 1=1 ";
//     if (producto_id) {
//       whereL += " AND l.producto_id = ? ";
//       params.push(producto_id);
//     }
//     if (fecha_from) {
//       whereL += " AND DATE(l.fecha_ingreso) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       whereL += " AND DATE(l.fecha_ingreso) <= ? ";
//       params.push(fecha_to);
//     }

//     // For each lote: entrada (sum bins.peso_bruto), salida (sum cajas.peso_neto), rendimiento, descartes promedio, cajas totales
//     const [rows] = await pool.query(
//       `SELECT
//          l.lote_id,
//          COALESCE(l.descripcion, CONCAT('Lote ', l.lote_id)) AS descripcion,
//          IFNULL(SUM(DISTINCT b.peso_bruto),0) AS kg_entrada,
//          IFNULL(SUM(c.peso_neto),0) AS kg_salida,
//          CASE WHEN IFNULL(SUM(DISTINCT b.peso_bruto),0) > 0 THEN
//            (IFNULL(SUM(c.peso_neto),0) / IFNULL(SUM(DISTINCT b.peso_bruto),0)) * 100
//          ELSE NULL END AS rendimiento_pct,
//          IFNULL(SUM(s.cantidad_cajas),0) AS cajas_totales,
//          CASE WHEN IFNULL(SUM(s.cantidad_cajas),0) > 0 THEN
//            (SUM(s.porcentaje_descartes * s.cantidad_cajas) / SUM(s.cantidad_cajas))
//          ELSE 0 END AS porcentaje_descartes_prom
//        FROM lotes l
//        LEFT JOIN bins b ON l.bin_id = b.bin_id
//        LEFT JOIN cajas c ON c.lote_id = l.lote_id
//        LEFT JOIN sublotes s ON s.lote_id = l.lote_id
//        ${whereL}
//        GROUP BY l.lote_id, l.descripcion
//        ORDER BY l.fecha_ingreso DESC
//        LIMIT 200`,
//       params
//     );

//     // Additionally: descartes por calibre (group by calibre)
//     const params2 = [];
//     let whereS = "WHERE 1=1 ";
//     if (producto_id) {
//       whereS += " AND l.producto_id = ? ";
//       params2.push(producto_id);
//     }
//     if (fecha_from) {
//       whereS += " AND DATE(l.fecha_ingreso) >= ? ";
//       params2.push(fecha_from);
//     }
//     if (fecha_to) {
//       whereS += " AND DATE(l.fecha_ingreso) <= ? ";
//       params2.push(fecha_to);
//     }

//     const [byCalibre] = await pool.query(
//       `SELECT s.calibre, SUM(s.cantidad_cajas) AS cajas, AVG(s.porcentaje_descartes) AS desc_prom
//        FROM sublotes s
//        JOIN lotes l ON s.lote_id = l.lote_id
//        ${whereS}
//        GROUP BY s.calibre
//        ORDER BY cajas DESC`,
//       params2
//     );

//     res.json({ rows, byCalibre });
//   } catch (err) {
//     console.error("getRendimientoPorLote error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * 3) Eficiencia de empaque
//  * - Cajas/hora por operario (uso created_at en cajas y created_by)
//  * - Pallets por día (pallets.fecha_armado)
//  * - Peso promedio de cada caja (cajas.peso_neto)
//  * - Proporción de tipo de caja (cajas.tipo_caja)
//  */
// exports.getEficienciaEmpaque = async (req, res) => {
//   const { producto_id, fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let where = "WHERE 1=1 ";
//     if (producto_id) {
//       where += " AND c.producto_id = ? ";
//       params.push(producto_id);
//     }
//     if (fecha_from) {
//       where += " AND DATE(c.created_at) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       where += " AND DATE(c.created_at) <= ? ";
//       params.push(fecha_to);
//     }

//     // cajas/hora por operario (count cajas grouped by created_by per hour)
//     const [cajasPorOperario] = await pool.query(
//       `SELECT c.created_by AS operario, DATE(c.created_at) AS fecha, HOUR(c.created_at) AS hora,
//          COUNT(*) AS cajas
//        FROM cajas c
//        ${where}
//        GROUP BY c.created_by, DATE(c.created_at), HOUR(c.created_at)
//        ORDER BY fecha DESC, hora DESC
//        LIMIT 200`,
//       params
//     );

//     // pallets por día
//     const params2 = [];
//     let whereP = "WHERE 1=1 ";
//     if (producto_id) {
//       whereP += " AND p.producto_id = ? ";
//       params2.push(producto_id);
//     }
//     if (fecha_from) {
//       whereP += " AND DATE(p.fecha_armado) >= ? ";
//       params2.push(fecha_from);
//     }
//     if (fecha_to) {
//       whereP += " AND DATE(p.fecha_armado) <= ? ";
//       params2.push(fecha_to);
//     }

//     const [palletsPorDia] = await pool.query(
//       `SELECT DATE(p.fecha_armado) AS fecha, COUNT(*) AS pallets
//        FROM pallets p
//        ${whereP}
//        GROUP BY DATE(p.fecha_armado)
//        ORDER BY fecha DESC
//        LIMIT 90`,
//       params2
//     );

//     // peso promedio de caja
//     const [pesoPromedio] = await pool.query(
//       `SELECT AVG(peso_neto) AS peso_promedio
//        FROM cajas c
//        WHERE 1=1 ${producto_id ? " AND c.producto_id = ? " : ""}`,
//       producto_id ? [producto_id] : []
//     );

//     // proporción de tipo de caja
//     const [tipoCaja] = await pool.query(
//       `SELECT tipo_caja, COUNT(*) AS cantidad
//        FROM cajas c
//        WHERE 1=1 ${producto_id ? " AND c.producto_id = ? " : ""}
//        GROUP BY tipo_caja
//        ORDER BY cantidad DESC`,
//       producto_id ? [producto_id] : []
//     );

//     res.json({
//       cajasPorOperario,
//       palletsPorDia,
//       pesoPromedio: pesoPromedio[0] ? pesoPromedio[0].peso_promedio || 0 : 0,
//       tipoCaja,
//     });
//   } catch (err) {
//     console.error("getEficienciaEmpaque error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * 4) Rotación de cámara frigorífica
//  * - tiempo promedio en cámara por pallet (entrada->salida)
//  * - ocupación real vs capacidad
//  * - pallets por estado
//  */
// exports.getCamarasKPIs = async (req, res) => {
//   parseFilters(req);
//   try {

//     // --- 1) tiempo por pallet (evitar pallets NULL)
//     const [times] = await pool.query(
//       `SELECT 
//            t.pallet_id,
//            TIMESTAMPDIFF(MINUTE, t.ingreso, t.salida) AS minutos_en_camara
//        FROM (
//            SELECT 
//                cm_ing.pallet_id,
//                cm_ing.fecha_movimiento AS ingreso,
//                (
//                    SELECT cm2.fecha_movimiento
//                    FROM camaras_movimientos cm2
//                    WHERE cm2.pallet_id = cm_ing.pallet_id
//                      AND cm2.tipo_movimiento = 'salida_camara'
//                      AND cm2.fecha_movimiento > cm_ing.fecha_movimiento
//                    ORDER BY cm2.fecha_movimiento ASC
//                    LIMIT 1
//                ) AS salida
//            FROM camaras_movimientos cm_ing
//            WHERE cm_ing.tipo_movimiento = 'ingreso_camara'
//              AND cm_ing.pallet_id IS NOT NULL
//        ) t
//        WHERE t.salida IS NOT NULL
//          AND t.pallet_id IS NOT NULL`
//     );

//     const promedioMinutos = times.length
//       ? times.reduce((a, b) => a + (b.minutos_en_camara || 0), 0) / times.length
//       : 0;

//     // --- 2) ocupación (evitar pallets sin ubicación o estado NULL)
//     const [ocupacion] = await pool.query(
//       `SELECT c.camara_id, c.nombre, c.capacidad_pallets,
//               COUNT(p.pallet_id) AS pallets_en_camara
//        FROM camaras c
//        LEFT JOIN pallets p
//          ON p.ubicacion_camara = c.nombre
//         AND p.estado = 'en_camara'
//         AND p.pallet_id IS NOT NULL
//        GROUP BY c.camara_id, c.nombre, c.capacidad_pallets`
//     );

//     // --- 3) pallets por estado (evitar NULL)
//     const [porEstado] = await pool.query(
//       `SELECT estado, COUNT(*) AS cantidad
//        FROM pallets
//        WHERE estado IS NOT NULL
//        GROUP BY estado`
//     );

//     res.json({
//       tiempo_promedio_minutos: promedioMinutos,
//       ocupacion,
//       porEstado,
//     });
//   } catch (err) {
//     console.error("getCamarasKPIs error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * 5) KPIs de despacho / logística
//  * - tiempo promedio armado -> carga -> salida (usando pallets.fecha_armado, od_pallets.hora_carga, orden_despacho.fecha_programada/fecha_creacion)
//  * - cumplimiento temperatura consignada (comparar seguimiento_camion.temperatura vs orden_despacho.temperatura_consigne)
//  * - desviaciones de temperatura
//  * - trazabilidad por pallet/caja (simple)
//  * - tiempo total del viaje (desde primer tracking hasta último)
//  * - % entregas con temperatura fuera de rango, % entregas a tiempo
//  */
// exports.getDespachoKPIs = async (req, res) => {
//   const { fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let whereOD = "WHERE 1=1 ";
//     if (fecha_from) {
//       whereOD += " AND DATE(od.fecha_creacion) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       whereOD += " AND DATE(od.fecha_creacion) <= ? ";
//       params.push(fecha_to);
//     }

//     // tiempo armado -> carga: difference between pallet.fecha_armado and od_pallets.hora_carga
//     // avoid double WHERE: append condition to where string
//     let whereOD2 = whereOD + " AND op.hora_carga IS NOT NULL ";

//     const [times] = await pool.query(
//       `SELECT op.pallet_id,
//               TIMESTAMPDIFF(MINUTE, p.fecha_armado, op.hora_carga) AS minutos_armado_a_carga,
//               TIMESTAMPDIFF(MINUTE, op.hora_carga, od.fecha_programada) AS minutos_carga_a_programado
//        FROM od_pallets op
//        JOIN pallets p ON op.pallet_id = p.pallet_id
//        JOIN orden_despacho od ON op.od_id = od.od_id
//        ${whereOD2}`,
//       params
//     );

//     // promedio minutos
//     const minutosArmadoACarga = times.length
//       ? times.reduce((a, b) => a + (b.minutos_armado_a_carga || 0), 0) /
//         times.length
//       : 0;
//     const minutosCargaAProgramado = times.length
//       ? times.reduce((a, b) => a + (b.minutos_carga_a_programado || 0), 0) /
//         times.length
//       : 0;

//     // cumplimiento temperatura: compare tracking_realtime temperatura vs od.temperatura_consigne
//     const [tempIssues] = await pool.query(
//       `SELECT tr.orden_despacho_id, od.od_code, od.temperatura_consigne, AVG(tr.temperatura) AS temp_prom
//        FROM tracking_realtime tr
//        JOIN orden_despacho od ON od.od_id = tr.orden_despacho_id
//        ${whereOD}
//        GROUP BY tr.orden_despacho_id, od.od_code, od.temperatura_consigne
//        HAVING od.temperatura_consigne IS NOT NULL`,
//       params
//     );

//     // % entregas fuera de rango: count orders where avg temp deviates more than allowed (1°C tolerance)
//     const fueraRango = tempIssues.filter(
//       (r) => Math.abs(r.temp_prom - (r.temperatura_consigne || 0)) > 1
//     ).length;
//     const totalTracked = tempIssues.length;
//     const pctFueraRango = totalTracked ? (fueraRango / totalTracked) * 100 : 0;

//     // tiempo total del viaje por od: first and last tracking timestamp dif
//     const [tiemposViaje] = await pool.query(
//       `SELECT tr.orden_despacho_id,
//               MIN(tr.timestamp) AS inicio,
//               MAX(tr.timestamp) AS fin,
//               TIMESTAMPDIFF(MINUTE, MIN(tr.timestamp), MAX(tr.timestamp)) AS minutos_viaje
//        FROM tracking_realtime tr
//        JOIN orden_despacho od ON od.od_id = tr.orden_despacho_id
//        ${whereOD}
//        GROUP BY tr.orden_despacho_id`,
//       params
//     );

//     // % entregas a tiempo vs retrasadas: compare orden_despacho.fecha_programada with ultima tracking (fin)
//     // Note: frontend can compute exact "on time" with fecha_programada; here we send raw tiemposViaje
//     const entregaOnTimeCount = tiemposViaje.filter((r) => {
//       if (!r.fin || !r.inicio) return false;
//       // placeholder: need orden_despacho.fecha_programada to compare; keep as false by default
//       return false;
//     }).length;

//     res.json({
//       minutosArmadoACarga,
//       minutosCargaAProgramado,
//       tempIssues,
//       pctFueraRango,
//       tiemposViaje,
//       entregaOnTimeCount,
//     });
//   } catch (err) {
//     console.error("getDespachoKPIs error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * 6) Movimientos de pallets
//  * - Movimientos diarios por operario (movimientos_pallets.operario)
//  * - Pallets reubicados por día
//  * - Instancias de pallet mal movido (e.g. asociado en pallet_cajas pero estado inconsistente)
//  */
// exports.getMovimientosKPIs = async (req, res) => {
//   const { fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let where = "WHERE 1=1 ";
//     if (fecha_from) {
//       where += " AND DATE(m.fecha_movimiento) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       where += " AND DATE(m.fecha_movimiento) <= ? ";
//       params.push(fecha_to);
//     }

//     const [movPorOperario] = await pool.query(
//       `SELECT m.operario, DATE(m.fecha_movimiento) AS fecha, COUNT(*) AS movimientos
//        FROM movimientos_pallets m
//        ${where}
//        GROUP BY m.operario, DATE(m.fecha_movimiento)
//        ORDER BY fecha DESC
//        LIMIT 200`,
//       params
//     );

//     const [reubicados] = await pool.query(
//       `SELECT DATE(m.fecha_movimiento) AS fecha, COUNT(DISTINCT m.pallet_id) AS pallets_reubicados
//        FROM movimientos_pallets m
//        ${where}
//        GROUP BY DATE(m.fecha_movimiento)
//        ORDER BY fecha DESC
//        LIMIT 90`,
//       params
//     );

//     // pallet mal movido: pallet registrado en pallet_cajas but pallet state 'armado' not matching? We'll find pallets with no salida_camara but estado 'despachado' etc.
//     const [inconsistencias] = await pool.query(
//       `SELECT p.pallet_id, p.estado, COUNT(pc.caja_id) AS cajas_asociadas
//        FROM pallets p
//        LEFT JOIN pallet_cajas pc ON pc.pallet_id = p.pallet_id
//        WHERE (p.estado = 'despachado' AND p.ubicacion_camara IS NOT NULL)
//        GROUP BY p.pallet_id, p.estado
//        LIMIT 100`
//     );

//     res.json({ movPorOperario, reubicados, inconsistencias });
//   } catch (err) {
//     console.error("getMovimientosKPIs error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * 7) Auditoría
//  * - Usuario con más operaciones por día
//  * - Operaciones sospechosas (DELETE/UPDATE count > threshold)
//  * - Horarios con más actividad
//  */
// exports.getAuditKPIs = async (req, res) => {
//   const { fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let where = "WHERE 1=1 ";
//     if (fecha_from) {
//       where += " AND DATE(a.fecha) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       where += " AND DATE(a.fecha) <= ? ";
//       params.push(fecha_to);
//     }

//     const [byUser] = await pool.query(
//       `SELECT a.usuario_id, u.nombre, COUNT(*) AS acciones
//        FROM audit_logs a
//        LEFT JOIN users u ON a.usuario_id = u.user_id
//        ${where}
//        GROUP BY a.usuario_id, u.nombre
//        ORDER BY acciones DESC
//        LIMIT 50`,
//       params
//     );

//     const [sospechosas] = await pool.query(
//       `SELECT a.usuario_id, u.nombre, a.accion, COUNT(*) AS cantidad
//        FROM audit_logs a
//        LEFT JOIN users u ON a.usuario_id = u.user_id
//        ${where} AND a.accion IN ('DELETE','UPDATE')
//        GROUP BY a.usuario_id, u.nombre, a.accion
//        HAVING cantidad > 5
//        ORDER BY cantidad DESC`,
//       params
//     );

//     const [horarios] = await pool.query(
//       `SELECT HOUR(a.fecha) AS hora, COUNT(*) AS acciones
//        FROM audit_logs a
//        ${where}
//        GROUP BY HOUR(a.fecha)
//        ORDER BY acciones DESC`,
//       params
//     );

//     res.json({ byUser, sospechosas, horarios });
//   } catch (err) {
//     console.error("getAuditKPIs error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * Productos list
//  */
// exports.getProductos = async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       `SELECT producto_id, nombre FROM productos ORDER BY nombre`
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error("getProductos error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };





// // controllers/kpi.controller.js - VERSIÓN CORREGIDA
// const pool = require("../config/db");

// /**
//  * Helper: parse optional query params
//  */
// function parseFilters(req) {
//   const producto_id = req.query.producto_id
//     ? parseInt(req.query.producto_id, 10)
//     : null;
//   const fecha_from = req.query.fecha_from || null;
//   const fecha_to = req.query.fecha_to || null;
//   return { producto_id, fecha_from, fecha_to };
// }

// /**
//  * 1) Volumen ingresado a planta - ✅ CORRECTO
//  */
// exports.getVolume = async (req, res) => {
//   const { producto_id, fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let where = "WHERE 1=1 ";
//     if (producto_id) {
//       where += " AND b.producto_id = ? ";
//       params.push(producto_id);
//     }
//     if (fecha_from) {
//       where += " AND DATE(b.registrado_at) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       where += " AND DATE(b.registrado_at) <= ? ";
//       params.push(fecha_to);
//     }

//     const [perDay] = await pool.query(
//       `SELECT DATE(b.registrado_at) AS fecha, SUM(IFNULL(b.peso_bruto,0)) AS kg_ingresados
//        FROM bins b
//        ${where}
//        GROUP BY DATE(b.registrado_at)
//        ORDER BY fecha DESC
//        LIMIT 90`,
//       params
//     );

//     const [byProductor] = await pool.query(
//       `SELECT pr.productor_id, pr.nombre AS productor, SUM(IFNULL(b.peso_bruto,0)) AS kg_ingresados
//        FROM bins b
//        LEFT JOIN productores pr ON b.productor_id = pr.productor_id
//        ${where}
//        GROUP BY pr.productor_id, pr.nombre
//        ORDER BY kg_ingresados DESC
//        LIMIT 50`,
//       params
//     );

//     const [byFinca] = await pool.query(
//       `SELECT f.finca_id, f.nombre AS finca, SUM(IFNULL(b.peso_bruto,0)) AS kg_ingresados
//        FROM bins b
//        LEFT JOIN fincas f ON b.finca_id = f.finca_id
//        ${where}
//        GROUP BY f.finca_id, f.nombre
//        ORDER BY kg_ingresados DESC
//        LIMIT 50`,
//       params
//     );

//     res.json({ perDay, byProductor, byFinca });
//   } catch (err) {
//     console.error("getVolume error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * 2) Rendimiento de lotes - ⚠️ CORREGIDO
//  * NOTA: El esquema actual solo vincula un lote a UN bin (lotes.bin_id)
//  * Si necesitas vincular múltiples bins a un lote, debes agregar una tabla intermedia
//  */
// exports.getRendimientoPorLote = async (req, res) => {
//   const { producto_id, fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let whereL = "WHERE 1=1 ";
//     if (producto_id) {
//       whereL += " AND l.producto_id = ? ";
//       params.push(producto_id);
//     }
//     if (fecha_from) {
//       whereL += " AND DATE(l.fecha_ingreso) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       whereL += " AND DATE(l.fecha_ingreso) <= ? ";
//       params.push(fecha_to);
//     }

//     // CORREGIDO: Removido DISTINCT de peso_bruto
//     const [rows] = await pool.query(
//       `SELECT
//          l.lote_id,
//          COALESCE(l.descripcion, CONCAT('Lote ', l.lote_id)) AS descripcion,
//          IFNULL(b.peso_bruto, 0) AS kg_entrada,
//          IFNULL(SUM(c.peso_neto), 0) AS kg_salida,
//          CASE WHEN IFNULL(b.peso_bruto, 0) > 0 THEN
//            (IFNULL(SUM(c.peso_neto), 0) / b.peso_bruto) * 100
//          ELSE NULL END AS rendimiento_pct,
//          IFNULL(SUM(s.cantidad_cajas), 0) AS cajas_totales,
//          CASE WHEN IFNULL(SUM(s.cantidad_cajas), 0) > 0 THEN
//            (SUM(s.porcentaje_descartes * s.cantidad_cajas) / SUM(s.cantidad_cajas))
//          ELSE 0 END AS porcentaje_descartes_prom
//        FROM lotes l
//        LEFT JOIN bins b ON l.bin_id = b.bin_id
//        LEFT JOIN cajas c ON c.lote_id = l.lote_id
//        LEFT JOIN sublotes s ON s.lote_id = l.lote_id
//        ${whereL}
//        GROUP BY l.lote_id, l.descripcion, b.peso_bruto
//        ORDER BY l.fecha_ingreso DESC
//        LIMIT 200`,
//       params
//     );

//     const params2 = [];
//     let whereS = "WHERE 1=1 ";
//     if (producto_id) {
//       whereS += " AND l.producto_id = ? ";
//       params2.push(producto_id);
//     }
//     if (fecha_from) {
//       whereS += " AND DATE(l.fecha_ingreso) >= ? ";
//       params2.push(fecha_from);
//     }
//     if (fecha_to) {
//       whereS += " AND DATE(l.fecha_ingreso) <= ? ";
//       params2.push(fecha_to);
//     }

//     const [byCalibre] = await pool.query(
//       `SELECT s.calibre, SUM(s.cantidad_cajas) AS cajas, AVG(s.porcentaje_descartes) AS desc_prom
//        FROM sublotes s
//        JOIN lotes l ON s.lote_id = l.lote_id
//        ${whereS}
//        GROUP BY s.calibre
//        ORDER BY cajas DESC`,
//       params2
//     );

//     res.json({ rows, byCalibre });
//   } catch (err) {
//     console.error("getRendimientoPorLote error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * 3) Eficiencia de empaque - ✅ CORRECTO
//  */
// exports.getEficienciaEmpaque = async (req, res) => {
//   const { producto_id, fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let where = "WHERE 1=1 ";
//     if (producto_id) {
//       where += " AND c.producto_id = ? ";
//       params.push(producto_id);
//     }
//     if (fecha_from) {
//       where += " AND DATE(c.created_at) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       where += " AND DATE(c.created_at) <= ? ";
//       params.push(fecha_to);
//     }

//     const [cajasPorOperario] = await pool.query(
//       `SELECT c.created_by AS operario, DATE(c.created_at) AS fecha, HOUR(c.created_at) AS hora,
//          COUNT(*) AS cajas
//        FROM cajas c
//        ${where}
//        GROUP BY c.created_by, DATE(c.created_at), HOUR(c.created_at)
//        ORDER BY fecha DESC, hora DESC
//        LIMIT 200`,
//       params
//     );

//     const params2 = [];
//     let whereP = "WHERE 1=1 ";
//     if (producto_id) {
//       whereP += " AND p.producto_id = ? ";
//       params2.push(producto_id);
//     }
//     if (fecha_from) {
//       whereP += " AND DATE(p.fecha_armado) >= ? ";
//       params2.push(fecha_from);
//     }
//     if (fecha_to) {
//       whereP += " AND DATE(p.fecha_armado) <= ? ";
//       params2.push(fecha_to);
//     }

//     const [palletsPorDia] = await pool.query(
//       `SELECT DATE(p.fecha_armado) AS fecha, COUNT(*) AS pallets
//        FROM pallets p
//        ${whereP}
//        GROUP BY DATE(p.fecha_armado)
//        ORDER BY fecha DESC
//        LIMIT 90`,
//       params2
//     );

//     const [pesoPromedio] = await pool.query(
//       `SELECT AVG(peso_neto) AS peso_promedio
//        FROM cajas c
//        WHERE 1=1 ${producto_id ? " AND c.producto_id = ? " : ""}`,
//       producto_id ? [producto_id] : []
//     );

//     const [tipoCaja] = await pool.query(
//       `SELECT tipo_caja, COUNT(*) AS cantidad
//        FROM cajas c
//        WHERE 1=1 ${producto_id ? " AND c.producto_id = ? " : ""}
//        GROUP BY tipo_caja
//        ORDER BY cantidad DESC`,
//       producto_id ? [producto_id] : []
//     );

//     res.json({
//       cajasPorOperario,
//       palletsPorDia,
//       pesoPromedio: pesoPromedio[0] ? pesoPromedio[0].peso_promedio || 0 : 0,
//       tipoCaja,
//     });
//   } catch (err) {
//     console.error("getEficienciaEmpaque error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * 4) Rotación de cámara frigorífica - ✅ CORRECTO
//  */
// exports.getCamarasKPIs = async (req, res) => {
//   parseFilters(req);
//   try {
//     const [times] = await pool.query(
//       `SELECT 
//            t.pallet_id,
//            TIMESTAMPDIFF(MINUTE, t.ingreso, t.salida) AS minutos_en_camara
//        FROM (
//            SELECT 
//                cm_ing.pallet_id,
//                cm_ing.fecha_movimiento AS ingreso,
//                (
//                    SELECT cm2.fecha_movimiento
//                    FROM camaras_movimientos cm2
//                    WHERE cm2.pallet_id = cm_ing.pallet_id
//                      AND cm2.tipo_movimiento = 'salida_camara'
//                      AND cm2.fecha_movimiento > cm_ing.fecha_movimiento
//                    ORDER BY cm2.fecha_movimiento ASC
//                    LIMIT 1
//                ) AS salida
//            FROM camaras_movimientos cm_ing
//            WHERE cm_ing.tipo_movimiento = 'ingreso_camara'
//              AND cm_ing.pallet_id IS NOT NULL
//        ) t
//        WHERE t.salida IS NOT NULL
//          AND t.pallet_id IS NOT NULL`
//     );

//     const promedioMinutos = times.length
//       ? times.reduce((a, b) => a + (b.minutos_en_camara || 0), 0) / times.length
//       : 0;

//     const [ocupacion] = await pool.query(
//       `SELECT c.camara_id, c.nombre, c.capacidad_pallets,
//               COUNT(p.pallet_id) AS pallets_en_camara
//        FROM camaras c
//        LEFT JOIN pallets p
//          ON p.ubicacion_camara = c.nombre
//         AND p.estado = 'en_camara'
//         AND p.pallet_id IS NOT NULL
//        GROUP BY c.camara_id, c.nombre, c.capacidad_pallets`
//     );

//     const [porEstado] = await pool.query(
//       `SELECT estado, COUNT(*) AS cantidad
//        FROM pallets
//        WHERE estado IS NOT NULL
//        GROUP BY estado`
//     );

//     res.json({
//       tiempo_promedio_minutos: promedioMinutos,
//       ocupacion,
//       porEstado,
//     });
//   } catch (err) {
//     console.error("getCamarasKPIs error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * 
//  * CORREGIDO: Usar 'seguimiento_camion' en lugar de 'tracking_realtime'
//  */
// /**
//  * 5) KPIs de despacho - ✅ CORRECCIÓN FINAL
//  */
// exports.getDespachoKPIs = async (req, res) => {
//   const { fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let whereOD = "WHERE 1=1 ";
//     if (fecha_from) {
//       whereOD += " AND DATE(od.fecha_creacion) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       whereOD += " AND DATE(od.fecha_creacion) <= ? ";
//       params.push(fecha_to);
//     }

//     let whereOD2 = whereOD + " AND op.hora_carga IS NOT NULL ";

//     // Tiempos armado -> carga
//     const [times] = await pool.query(
//       `SELECT op.pallet_id,
//               TIMESTAMPDIFF(MINUTE, p.fecha_armado, op.hora_carga) AS minutos_armado_a_carga,
//               TIMESTAMPDIFF(MINUTE, op.hora_carga, od.fecha_programada) AS minutos_carga_a_programado
//        FROM od_pallets op
//        JOIN pallets p ON op.pallet_id = p.pallet_id
//        JOIN orden_despacho od ON op.od_id = od.od_id
//        ${whereOD2}`,
//       params
//     );

//     const minutosArmadoACarga = times.length
//       ? times.reduce((a, b) => a + (b.minutos_armado_a_carga || 0), 0) / times.length
//       : 0;
//     const minutosCargaAProgramado = times.length
//       ? times.reduce((a, b) => a + (b.minutos_carga_a_programado || 0), 0) / times.length
//       : 0;

//     // ✅ CORREGIDO: Usar sc.temperatura (no tr.temperatura)
//     const [tempIssues] = await pool.query(
//       `SELECT sc.od_id, od.od_code, od.temperatura_consigne, AVG(sc.temperatura) AS temp_prom
//        FROM seguimiento_camion sc
//        JOIN orden_despacho od ON od.od_id = sc.od_id
//        ${whereOD}
//        GROUP BY sc.od_id, od.od_code, od.temperatura_consigne
//        HAVING od.temperatura_consigne IS NOT NULL`,
//       params
//     );

//     const fueraRango = tempIssues.filter(
//       (r) => Math.abs((r.temp_prom || 0) - (r.temperatura_consigne || 0)) > 1
//     ).length;
//     const totalTracked = tempIssues.length;
//     const pctFueraRango = totalTracked ? (fueraRango / totalTracked) * 100 : 0;

//     // ✅ CORREGIDO: Usar sc.timestamp (no tr.timestamp)
//     const [tiemposViaje] = await pool.query(
//       `SELECT sc.od_id,
//               MIN(sc.timestamp) AS inicio,
//               MAX(sc.timestamp) AS fin,
//               TIMESTAMPDIFF(MINUTE, MIN(sc.timestamp), MAX(sc.timestamp)) AS minutos_viaje
//        FROM seguimiento_camion sc
//        JOIN orden_despacho od ON od.od_id = sc.od_id
//        ${whereOD}
//        GROUP BY sc.od_id`,
//       params
//     );

//     const entregaOnTimeCount = tiemposViaje.filter((r) => {
//       if (!r.fin || !r.inicio) return false;
//       return false; // Placeholder - necesitas lógica para comparar con fecha_programada
//     }).length;

//     res.json({
//       minutosArmadoACarga,
//       minutosCargaAProgramado,
//       tempIssues,
//       pctFueraRango,
//       tiemposViaje,
//       entregaOnTimeCount,
//     });
//   } catch (err) {
//     console.error("getDespachoKPIs error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };
// /**
//  * 6) Movimientos de pallets - ✅ CORRECTO
//  */
// exports.getMovimientosKPIs = async (req, res) => {
//   const { fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let where = "WHERE 1=1 ";
//     if (fecha_from) {
//       where += " AND DATE(m.fecha_movimiento) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       where += " AND DATE(m.fecha_movimiento) <= ? ";
//       params.push(fecha_to);
//     }

//     const [movPorOperario] = await pool.query(
//       `SELECT m.operario, DATE(m.fecha_movimiento) AS fecha, COUNT(*) AS movimientos
//        FROM movimientos_pallets m
//        ${where}
//        GROUP BY m.operario, DATE(m.fecha_movimiento)
//        ORDER BY fecha DESC
//        LIMIT 200`,
//       params
//     );

//     const [reubicados] = await pool.query(
//       `SELECT DATE(m.fecha_movimiento) AS fecha, COUNT(DISTINCT m.pallet_id) AS pallets_reubicados
//        FROM movimientos_pallets m
//        ${where}
//        GROUP BY DATE(m.fecha_movimiento)
//        ORDER BY fecha DESC
//        LIMIT 90`,
//       params
//     );

//     const [inconsistencias] = await pool.query(
//       `SELECT p.pallet_id, p.estado, COUNT(pc.caja_id) AS cajas_asociadas
//        FROM pallets p
//        LEFT JOIN pallet_cajas pc ON pc.pallet_id = p.pallet_id
//        WHERE (p.estado = 'despachado' AND p.ubicacion_camara IS NOT NULL)
//        GROUP BY p.pallet_id, p.estado
//        LIMIT 100`
//     );

//     res.json({ movPorOperario, reubicados, inconsistencias });
//   } catch (err) {
//     console.error("getMovimientosKPIs error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * 7) Auditoría - ✅ CORRECTO
//  */
// exports.getAuditKPIs = async (req, res) => {
//   const { fecha_from, fecha_to } = parseFilters(req);
//   try {
//     const params = [];
//     let where = "WHERE 1=1 ";
//     if (fecha_from) {
//       where += " AND DATE(a.fecha) >= ? ";
//       params.push(fecha_from);
//     }
//     if (fecha_to) {
//       where += " AND DATE(a.fecha) <= ? ";
//       params.push(fecha_to);
//     }

//     const [byUser] = await pool.query(
//       `SELECT a.usuario_id, u.nombre, COUNT(*) AS acciones
//        FROM audit_logs a
//        LEFT JOIN users u ON a.usuario_id = u.user_id
//        ${where}
//        GROUP BY a.usuario_id, u.nombre
//        ORDER BY acciones DESC
//        LIMIT 50`,
//       params
//     );

//     const [sospechosas] = await pool.query(
//       `SELECT a.usuario_id, u.nombre, a.accion, COUNT(*) AS cantidad
//        FROM audit_logs a
//        LEFT JOIN users u ON a.usuario_id = u.user_id
//        ${where} AND a.accion IN ('DELETE','UPDATE')
//        GROUP BY a.usuario_id, u.nombre, a.accion
//        HAVING cantidad > 5
//        ORDER BY cantidad DESC`,
//       params
//     );

//     const [horarios] = await pool.query(
//       `SELECT HOUR(a.fecha) AS hora, COUNT(*) AS acciones
//        FROM audit_logs a
//        ${where}
//        GROUP BY HOUR(a.fecha)
//        ORDER BY acciones DESC`,
//       params
//     );

//     res.json({ byUser, sospechosas, horarios });
//   } catch (err) {
//     console.error("getAuditKPIs error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * Productos list - ✅ CORRECTO
//  */
// exports.getProductos = async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       `SELECT producto_id, nombre FROM productos ORDER BY nombre`
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error("getProductos error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };



// controllers/kpi.controller.js
const pool = require("../config/db");

/**
 * Helper: parse optional query params: producto_id, fecha_from, fecha_to
 */
function parseFilters(req) {
  const producto_id = req.query.producto_id
    ? parseInt(req.query.producto_id, 10)
    : null;
  const fecha_from = req.query.fecha_from || null; // 'YYYY-MM-DD'
  const fecha_to = req.query.fecha_to || null;
  return { producto_id, fecha_from, fecha_to };
}

/**
 * 1) Volumen ingresado a planta
 * - total kg por dia/mes
 * - por producto (bins.producto_id)
 * - por finca y productor
 */
exports.getVolume = async (req, res) => {
  const { producto_id, fecha_from, fecha_to } = parseFilters(req);
  try {
    const params = [];
    let where = "WHERE 1=1 ";
    if (producto_id) {
      where += " AND b.producto_id = ? ";
      params.push(producto_id);
    }
    if (fecha_from) {
      where += " AND DATE(b.registrado_at) >= ? ";
      params.push(fecha_from);
    }
    if (fecha_to) {
      where += " AND DATE(b.registrado_at) <= ? ";
      params.push(fecha_to);
    }

    // total por dia (últimos 30 días si no se filtra)
    const [perDay] = await pool.query(
      `SELECT DATE(b.registrado_at) AS fecha, SUM(IFNULL(b.peso_bruto,0)) AS kg_ingresados
       FROM bins b
       ${where}
       GROUP BY DATE(b.registrado_at)
       ORDER BY fecha DESC
       LIMIT 90`,
      params
    );

    // total por productor
    const [byProductor] = await pool.query(
      `SELECT pr.productor_id, pr.nombre AS productor, SUM(IFNULL(b.peso_bruto,0)) AS kg_ingresados
       FROM bins b
       LEFT JOIN productores pr ON b.productor_id = pr.productor_id
       ${where}
       GROUP BY pr.productor_id, pr.nombre
       ORDER BY kg_ingresados DESC
       LIMIT 50`,
      params
    );

    // total por finca
    const [byFinca] = await pool.query(
      `SELECT f.finca_id, f.nombre AS finca, SUM(IFNULL(b.peso_bruto,0)) AS kg_ingresados
       FROM bins b
       LEFT JOIN fincas f ON b.finca_id = f.finca_id
       ${where}
       GROUP BY f.finca_id, f.nombre
       ORDER BY kg_ingresados DESC
       LIMIT 50`,
      params
    );

    res.json({ perDay, byProductor, byFinca });
  } catch (err) {
    console.error("getVolume error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 2) Rendimiento de lotes
 * - % rendimiento = kg empaquetado (cajas.peso_neto) / kg bin (bins.peso_bruto)
 * - % descartes por lote (sublotes.porcentaje_descartes)
 * - cajas producidas por lote
 */
exports.getRendimientoPorLote = async (req, res) => {
  const { producto_id, fecha_from, fecha_to } = parseFilters(req);
  try {
    const params = [];
    let whereL = "WHERE 1=1 ";
    if (producto_id) {
      whereL += " AND l.producto_id = ? ";
      params.push(producto_id);
    }
    if (fecha_from) {
      whereL += " AND DATE(l.fecha_ingreso) >= ? ";
      params.push(fecha_from);
    }
    if (fecha_to) {
      whereL += " AND DATE(l.fecha_ingreso) <= ? ";
      params.push(fecha_to);
    }

    // For each lote: entrada (sum bins.peso_bruto), salida (sum cajas.peso_neto), rendimiento, descartes promedio, cajas totales
    const [rows] = await pool.query(
      `SELECT
         l.lote_id,
         COALESCE(l.descripcion, CONCAT('Lote ', l.lote_id)) AS descripcion,
         IFNULL(SUM(DISTINCT b.peso_bruto),0) AS kg_entrada,
         IFNULL(SUM(c.peso_neto),0) AS kg_salida,
         CASE WHEN IFNULL(SUM(DISTINCT b.peso_bruto),0) > 0 THEN
           (IFNULL(SUM(c.peso_neto),0) / IFNULL(SUM(DISTINCT b.peso_bruto),0)) * 100
         ELSE NULL END AS rendimiento_pct,
         IFNULL(SUM(s.cantidad_cajas),0) AS cajas_totales,
         CASE WHEN IFNULL(SUM(s.cantidad_cajas),0) > 0 THEN
           (SUM(s.porcentaje_descartes * s.cantidad_cajas) / SUM(s.cantidad_cajas))
         ELSE 0 END AS porcentaje_descartes_prom
       FROM lotes l
       LEFT JOIN bins b ON l.bin_id = b.bin_id
       LEFT JOIN cajas c ON c.lote_id = l.lote_id
       LEFT JOIN sublotes s ON s.lote_id = l.lote_id
       ${whereL}
       GROUP BY l.lote_id, l.descripcion
       ORDER BY l.fecha_ingreso DESC
       LIMIT 200`,
      params
    );

    // Additionally: descartes por calibre (group by calibre)
    const params2 = [];
    let whereS = "WHERE 1=1 ";
    if (producto_id) {
      whereS += " AND l.producto_id = ? ";
      params2.push(producto_id);
    }
    if (fecha_from) {
      whereS += " AND DATE(l.fecha_ingreso) >= ? ";
      params2.push(fecha_from);
    }
    if (fecha_to) {
      whereS += " AND DATE(l.fecha_ingreso) <= ? ";
      params2.push(fecha_to);
    }

    const [byCalibre] = await pool.query(
      `SELECT s.calibre, SUM(s.cantidad_cajas) AS cajas, AVG(s.porcentaje_descartes) AS desc_prom
       FROM sublotes s
       JOIN lotes l ON s.lote_id = l.lote_id
       ${whereS}
       GROUP BY s.calibre
       ORDER BY cajas DESC`,
      params2
    );

    res.json({ rows, byCalibre });
  } catch (err) {
    console.error("getRendimientoPorLote error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 3) Eficiencia de empaque
 * - Cajas/hora por operario (uso created_at en cajas y created_by)
 * - Pallets por día (pallets.fecha_armado)
 * - Peso promedio de cada caja (cajas.peso_neto)
 * - Proporción de tipo de caja (cajas.tipo_caja)
 */
exports.getEficienciaEmpaque = async (req, res) => {
  const { producto_id, fecha_from, fecha_to } = parseFilters(req);
  try {
    const params = [];
    let where = "WHERE 1=1 ";
    if (producto_id) {
      where += " AND c.producto_id = ? ";
      params.push(producto_id);
    }
    if (fecha_from) {
      where += " AND DATE(c.created_at) >= ? ";
      params.push(fecha_from);
    }
    if (fecha_to) {
      where += " AND DATE(c.created_at) <= ? ";
      params.push(fecha_to);
    }

    // cajas/hora por operario (count cajas grouped by created_by per hour)
    const [cajasPorOperario] = await pool.query(
      `SELECT c.created_by AS operario, DATE(c.created_at) AS fecha, HOUR(c.created_at) AS hora,
         COUNT(*) AS cajas
       FROM cajas c
       ${where}
       GROUP BY c.created_by, DATE(c.created_at), HOUR(c.created_at)
       ORDER BY fecha DESC, hora DESC
       LIMIT 200`,
      params
    );

    // pallets por día
    const params2 = [];
    let whereP = "WHERE 1=1 ";
    if (producto_id) {
      whereP += " AND p.producto_id = ? ";
      params2.push(producto_id);
    }
    if (fecha_from) {
      whereP += " AND DATE(p.fecha_armado) >= ? ";
      params2.push(fecha_from);
    }
    if (fecha_to) {
      whereP += " AND DATE(p.fecha_armado) <= ? ";
      params2.push(fecha_to);
    }

    const [palletsPorDia] = await pool.query(
      `SELECT DATE(p.fecha_armado) AS fecha, COUNT(*) AS pallets
       FROM pallets p
       ${whereP}
       GROUP BY DATE(p.fecha_armado)
       ORDER BY fecha DESC
       LIMIT 90`,
      params2
    );

    // peso promedio de caja
    const [pesoPromedio] = await pool.query(
      `SELECT AVG(peso_neto) AS peso_promedio
       FROM cajas c
       WHERE 1=1 ${producto_id ? " AND c.producto_id = ? " : ""}`,
      producto_id ? [producto_id] : []
    );

    // proporción de tipo de caja
    const [tipoCaja] = await pool.query(
      `SELECT tipo_caja, COUNT(*) AS cantidad
       FROM cajas c
       WHERE 1=1 ${producto_id ? " AND c.producto_id = ? " : ""}
       GROUP BY tipo_caja
       ORDER BY cantidad DESC`,
      producto_id ? [producto_id] : []
    );

    res.json({
      cajasPorOperario,
      palletsPorDia,
      pesoPromedio: pesoPromedio[0] ? pesoPromedio[0].peso_promedio || 0 : 0,
      tipoCaja,
    });
  } catch (err) {
    console.error("getEficienciaEmpaque error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 4) Rotación de cámara frigorífica
 * - tiempo promedio en cámara por pallet (entrada->salida)
 * - ocupación real vs capacidad
 * - pallets por estado
 */
exports.getCamarasKPIs = async (req, res) => {
  parseFilters(req);
  try {

    // --- 1) tiempo por pallet (evitar pallets NULL)
    const [times] = await pool.query(
      `SELECT 
           t.pallet_id,
           TIMESTAMPDIFF(MINUTE, t.ingreso, t.salida) AS minutos_en_camara
       FROM (
           SELECT 
               cm_ing.pallet_id,
               cm_ing.fecha_movimiento AS ingreso,
               (
                   SELECT cm2.fecha_movimiento
                   FROM camaras_movimientos cm2
                   WHERE cm2.pallet_id = cm_ing.pallet_id
                     AND cm2.tipo_movimiento = 'salida_camara'
                     AND cm2.fecha_movimiento > cm_ing.fecha_movimiento
                   ORDER BY cm2.fecha_movimiento ASC
                   LIMIT 1
               ) AS salida
           FROM camaras_movimientos cm_ing
           WHERE cm_ing.tipo_movimiento = 'ingreso_camara'
             AND cm_ing.pallet_id IS NOT NULL
       ) t
       WHERE t.salida IS NOT NULL
         AND t.pallet_id IS NOT NULL`
    );

    const promedioMinutos = times.length
      ? times.reduce((a, b) => a + (b.minutos_en_camara || 0), 0) / times.length
      : 0;

    // --- 2) ocupación (evitar pallets sin ubicación o estado NULL)
    const [ocupacion] = await pool.query(
      `SELECT c.camara_id, c.nombre, c.capacidad_pallets,
              COUNT(p.pallet_id) AS pallets_en_camara
       FROM camaras c
       LEFT JOIN pallets p
         ON p.ubicacion_camara = c.nombre
        AND p.estado = 'en_camara'
        AND p.pallet_id IS NOT NULL
       GROUP BY c.camara_id, c.nombre, c.capacidad_pallets`
    );

    // --- 3) pallets por estado (evitar NULL)
    const [porEstado] = await pool.query(
      `SELECT estado, COUNT(*) AS cantidad
       FROM pallets
       WHERE estado IS NOT NULL
       GROUP BY estado`
    );

    res.json({
      tiempo_promedio_minutos: promedioMinutos,
      ocupacion,
      porEstado,
    });
  } catch (err) {
    console.error("getCamarasKPIs error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 5) KPIs de despacho / logística
 * - tiempo promedio armado -> carga -> salida (usando pallets.fecha_armado, od_pallets.hora_carga, orden_despacho.fecha_programada/fecha_creacion)
 * - cumplimiento temperatura consignada (comparar seguimiento_camion.temperatura vs orden_despacho.temperatura_consigne)
 * - desviaciones de temperatura
 * - trazabilidad por pallet/caja (simple)
 * - tiempo total del viaje (desde primer tracking hasta último)
 * - % entregas con temperatura fuera de rango, % entregas a tiempo
 */
exports.getDespachoKPIs = async (req, res) => {
  const { fecha_from, fecha_to } = parseFilters(req);
  try {
    const params = [];
    let whereOD = "WHERE 1=1 ";
    if (fecha_from) {
      whereOD += " AND DATE(od.fecha_creacion) >= ? ";
      params.push(fecha_from);
    }
    if (fecha_to) {
      whereOD += " AND DATE(od.fecha_creacion) <= ? ";
      params.push(fecha_to);
    }

    // tiempo armado -> carga: difference between pallet.fecha_armado and od_pallets.hora_carga
    // avoid double WHERE: append condition to where string
    let whereOD2 = whereOD + " AND op.hora_carga IS NOT NULL ";

    const [times] = await pool.query(
      `SELECT op.pallet_id,
              TIMESTAMPDIFF(MINUTE, p.fecha_armado, op.hora_carga) AS minutos_armado_a_carga,
              TIMESTAMPDIFF(MINUTE, op.hora_carga, od.fecha_programada) AS minutos_carga_a_programado
       FROM od_pallets op
       JOIN pallets p ON op.pallet_id = p.pallet_id
       JOIN orden_despacho od ON op.od_id = od.od_id
       ${whereOD2}`,
      params
    );

    // promedio minutos
    const minutosArmadoACarga = times.length
      ? times.reduce((a, b) => a + (b.minutos_armado_a_carga || 0), 0) /
        times.length
      : 0;
    const minutosCargaAProgramado = times.length
      ? times.reduce((a, b) => a + (b.minutos_carga_a_programado || 0), 0) /
        times.length
      : 0;

    // cumplimiento temperatura: compare tracking_realtime temperatura vs od.temperatura_consigne
    const [tempIssues] = await pool.query(
      `SELECT tr.orden_despacho_id, od.od_code, od.temperatura_consigne, AVG(tr.temperatura) AS temp_prom
       FROM tracking_realtime tr
       JOIN orden_despacho od ON od.od_id = tr.orden_despacho_id
       ${whereOD}
       GROUP BY tr.orden_despacho_id, od.od_code, od.temperatura_consigne
       HAVING od.temperatura_consigne IS NOT NULL`,
      params
    );

    // % entregas fuera de rango: count orders where avg temp deviates more than allowed (1°C tolerance)
    const fueraRango = tempIssues.filter(
      (r) => Math.abs(r.temp_prom - (r.temperatura_consigne || 0)) > 1
    ).length;
    const totalTracked = tempIssues.length;
    const pctFueraRango = totalTracked ? (fueraRango / totalTracked) * 100 : 0;

    // tiempo total del viaje por od: first and last tracking timestamp dif
    const [tiemposViaje] = await pool.query(
      `SELECT tr.orden_despacho_id,
              MIN(tr.timestamp) AS inicio,
              MAX(tr.timestamp) AS fin,
              TIMESTAMPDIFF(MINUTE, MIN(tr.timestamp), MAX(tr.timestamp)) AS minutos_viaje
       FROM tracking_realtime tr
       JOIN orden_despacho od ON od.od_id = tr.orden_despacho_id
       ${whereOD}
       GROUP BY tr.orden_despacho_id`,
      params
    );

    // % entregas a tiempo vs retrasadas: compare orden_despacho.fecha_programada with ultima tracking (fin)
    // Note: frontend can compute exact "on time" with fecha_programada; here we send raw tiemposViaje
    const entregaOnTimeCount = tiemposViaje.filter((r) => {
      if (!r.fin || !r.inicio) return false;
      // placeholder: need orden_despacho.fecha_programada to compare; keep as false by default
      return false;
    }).length;

    res.json({
      minutosArmadoACarga,
      minutosCargaAProgramado,
      tempIssues,
      pctFueraRango,
      tiemposViaje,
      entregaOnTimeCount,
    });
  } catch (err) {
    console.error("getDespachoKPIs error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 6) Movimientos de pallets
 * - Movimientos diarios por operario (movimientos_pallets.operario)
 * - Pallets reubicados por día
 * - Instancias de pallet mal movido (e.g. asociado en pallet_cajas pero estado inconsistente)
 */
exports.getMovimientosKPIs = async (req, res) => {
  const { fecha_from, fecha_to } = parseFilters(req);
  try {
    const params = [];
    let where = "WHERE 1=1 ";
    if (fecha_from) {
      where += " AND DATE(m.fecha_movimiento) >= ? ";
      params.push(fecha_from);
    }
    if (fecha_to) {
      where += " AND DATE(m.fecha_movimiento) <= ? ";
      params.push(fecha_to);
    }

    const [movPorOperario] = await pool.query(
      `SELECT m.operario, DATE(m.fecha_movimiento) AS fecha, COUNT(*) AS movimientos
       FROM movimientos_pallets m
       ${where}
       GROUP BY m.operario, DATE(m.fecha_movimiento)
       ORDER BY fecha DESC
       LIMIT 200`,
      params
    );

    const [reubicados] = await pool.query(
      `SELECT DATE(m.fecha_movimiento) AS fecha, COUNT(DISTINCT m.pallet_id) AS pallets_reubicados
       FROM movimientos_pallets m
       ${where}
       GROUP BY DATE(m.fecha_movimiento)
       ORDER BY fecha DESC
       LIMIT 90`,
      params
    );

    // pallet mal movido: pallet registrado en pallet_cajas but pallet state 'armado' not matching? We'll find pallets with no salida_camara but estado 'despachado' etc.
    const [inconsistencias] = await pool.query(
      `SELECT p.pallet_id, p.estado, COUNT(pc.caja_id) AS cajas_asociadas
       FROM pallets p
       LEFT JOIN pallet_cajas pc ON pc.pallet_id = p.pallet_id
       WHERE (p.estado = 'despachado' AND p.ubicacion_camara IS NOT NULL)
       GROUP BY p.pallet_id, p.estado
       LIMIT 100`
    );

    res.json({ movPorOperario, reubicados, inconsistencias });
  } catch (err) {
    console.error("getMovimientosKPIs error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 7) Auditoría
 * - Usuario con más operaciones por día
 * - Operaciones sospechosas (DELETE/UPDATE count > threshold)
 * - Horarios con más actividad
 */
exports.getAuditKPIs = async (req, res) => {
  const { fecha_from, fecha_to } = parseFilters(req);
  try {
    const params = [];
    let where = "WHERE 1=1 ";
    if (fecha_from) {
      where += " AND DATE(a.fecha) >= ? ";
      params.push(fecha_from);
    }
    if (fecha_to) {
      where += " AND DATE(a.fecha) <= ? ";
      params.push(fecha_to);
    }

    const [byUser] = await pool.query(
      `SELECT a.usuario_id, u.nombre, COUNT(*) AS acciones
       FROM audit_logs a
       LEFT JOIN users u ON a.usuario_id = u.user_id
       ${where}
       GROUP BY a.usuario_id, u.nombre
       ORDER BY acciones DESC
       LIMIT 50`,
      params
    );

    const [sospechosas] = await pool.query(
      `SELECT a.usuario_id, u.nombre, a.accion, COUNT(*) AS cantidad
       FROM audit_logs a
       LEFT JOIN users u ON a.usuario_id = u.user_id
       ${where} AND a.accion IN ('DELETE','UPDATE')
       GROUP BY a.usuario_id, u.nombre, a.accion
       HAVING cantidad > 5
       ORDER BY cantidad DESC`,
      params
    );

    const [horarios] = await pool.query(
      `SELECT HOUR(a.fecha) AS hora, COUNT(*) AS acciones
       FROM audit_logs a
       ${where}
       GROUP BY HOUR(a.fecha)
       ORDER BY acciones DESC`,
      params
    );

    res.json({ byUser, sospechosas, horarios });
  } catch (err) {
    console.error("getAuditKPIs error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Productos list
 */
exports.getProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT producto_id, nombre FROM productos ORDER BY nombre`
    );
    res.json(rows);
  } catch (err) {
    console.error("getProductos error:", err);
    res.status(500).json({ error: err.message });
  }
};
