const db = require('./src/config/db');

async function checkSimulatorData() {
  try {
    // Verificar camiones simulados
    const [camiones] = await db.query(`
      SELECT COUNT(*) as total FROM camiones WHERE patente LIKE 'SIM%'
    `);
    console.log('✅ Camiones simulados:', camiones[0].total);

    // Verificar órdenes simuladas
    const [ordenes] = await db.query(`
      SELECT COUNT(*) as total FROM orden_despacho WHERE od_code LIKE 'OD-SIM-%'
    `);
    console.log('✅ Órdenes simuladas:', ordenes[0].total);

    // Verificar tracking
    const [tracking] = await db.query(`
      SELECT COUNT(*) as total FROM tracking_realtime tr
      JOIN orden_despacho od ON tr.orden_despacho_id = od.od_id
      WHERE od.od_code LIKE 'OD-SIM-%'
    `);
    console.log('✅ Registros de tracking:', tracking[0].total);

    // Mostrar último registro
    const [ultimo] = await db.query(`
      SELECT 
        c.patente,
        tr.lat,
        tr.lng,
        tr.velocidad,
        tr.evento,
        tr.timestamp
      FROM tracking_realtime tr
      JOIN camiones c ON tr.camion_id = c.camion_id
      WHERE c.patente LIKE 'SIM%'
      ORDER BY tr.timestamp DESC
      LIMIT 1
    `);

    if (ultimo.length > 0) {
      console.log('\n📍 Último registro:');
      console.log('   Patente:', ultimo[0].patente);
      console.log('   Posición: [', ultimo[0].lat, ',', ultimo[0].lng, ']');
      console.log('   Velocidad:', ultimo[0].velocidad, 'km/h');
      console.log('   Estado:', ultimo[0].evento);
      console.log('   Timestamp:', ultimo[0].timestamp);
    } else {
      console.log('\n⚠️  No hay registros de tracking aún');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

checkSimulatorData();
