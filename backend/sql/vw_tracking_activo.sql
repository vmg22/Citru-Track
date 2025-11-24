-- Vista mejorada para tracking con filtros adicionales
-- Ejecutar en MySQL para reemplazar la vista existente

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
    od.producto_id,           -- AGREGADO: Para filtrar por tipo de carga
    od.estado,                -- AGREGADO: Para filtrar por estado de orden
    p.nombre AS producto_nombre  -- AGREGADO: Nombre del producto para mostrar
FROM tracking_realtime tr
JOIN orden_despacho od ON tr.orden_despacho_id = od.od_id
JOIN camiones c ON tr.camion_id = c.camion_id
LEFT JOIN choferes ch ON od.chofer_id = ch.chofer_id
LEFT JOIN productos p ON od.producto_id = p.producto_id  -- JOIN con productos
WHERE od.estado IN ('en_ruta', 'pendiente', 'en_carga');
