-- Vista CORREGIDA: Solo el punto GPS más reciente de cada camión
-- Ejecuta este SQL en MySQL

DROP VIEW IF EXISTS vw_tracking_activo;

CREATE VIEW vw_tracking_activo AS
SELECT 
    tr.orden_despacho_id,
    od.od_code,
    c.camion_id,
    c.patente,
    ch.nombre AS chofer,
    tr.lat,
    tr.lng,
    tr.velocidad,
    tr.evento AS estado_actual,
    tr.timestamp AS ultima_actualizacion,
    od.destino,
    od.tipo_destino,
    od.producto_id,
    od.estado,
    p.nombre AS producto_nombre
FROM tracking_realtime tr
JOIN orden_despacho od ON tr.orden_despacho_id = od.od_id
JOIN camiones c ON tr.camion_id = c.camion_id
LEFT JOIN choferes ch ON od.chofer_id = ch.chofer_id
LEFT JOIN productos p ON od.producto_id = p.producto_id
WHERE od.estado IN ('en_ruta', 'pendiente', 'en_carga')
  AND tr.timestamp = (
    -- Solo el registro más reciente de cada orden
    SELECT MAX(tr2.timestamp)
    FROM tracking_realtime tr2
    WHERE tr2.orden_despacho_id = tr.orden_despacho_id
  );
