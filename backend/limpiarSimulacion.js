const db = require('./src/config/db');

async function limpiarDatosSimulacion() {
  console.log('🧹 Limpiando datos de simulación...\n');
  
  try {
    // Eliminar tracking de órdenes simuladas
    const [tr] = await db.query(`
      DELETE tr FROM tracking_realtime tr
      JOIN orden_despacho od ON tr.orden_despacho_id = od.od_id
      WHERE od.od_code LIKE 'OD-SIM-%'
    `);
    console.log(`✅ ${tr.affectedRows} registros de tracking eliminados`);

    // Eliminar órdenes simuladas
    const [od] = await db.query(`DELETE FROM orden_despacho WHERE od_code LIKE 'OD-SIM-%'`);
    console.log(`✅ ${od.affectedRows} órdenes de despacho eliminadas`);

    // Marcar camiones simulados como inactivos
    const [cam] = await db.query(`UPDATE camiones SET estado = 'inactivo' WHERE patente LIKE 'SIM%'`);
    console.log(`✅ ${cam.affectedRows} camiones marcados como inactivos`);

    console.log('\n✅ Limpieza completada exitosamente\n');
  } catch (error) {
    console.error('❌ Error al limpiar:', error.message);
  } finally {
    await db.end();
  }
}

limpiarDatosSimulacion();
