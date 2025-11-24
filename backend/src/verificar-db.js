// Script de verificación de base de datos
const db = require('./config/db');

async function verificarDB() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...\n');
    
    // Test de conexión
    const [testConnection] = await db.query('SELECT 1 as test');
    console.log('✅ Conexión a MySQL exitosa\n');
    
    // Verificar vista vw_tracking_activo
    try {
      const [viewCheck] = await db.query("SHOW FULL TABLES WHERE Table_type = 'VIEW' AND Tables_in_citru_track = 'vw_tracking_activo'");
      if (viewCheck.length) {
        console.log('✅ Vista vw_tracking_activo existe');
        const [viewData] = await db.query('SELECT * FROM vw_tracking_activo LIMIT 5');
        console.log(`   Registros en vista: ${viewData.length}\n`);
      } else {
        console.log('❌ Vista vw_tracking_activo NO existe - necesitas ejecutar el SQL\n');
      }
    } catch (e) {
      console.log('❌ Error con vista vw_tracking_activo:', e.message, '\n');
    }
    
    // Verificar tablas
    const tablas = ['camiones', 'transportistas', 'choferes', 'orden_despacho', 'tracking_realtime', 'productos'];
    
    for (const tabla of tablas) {
      try {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM ${tabla}`);
        console.log(`✅ Tabla ${tabla.padEnd(20)} - ${rows[0].count} registros`);
      } catch (e) {
        console.log(`❌ Tabla ${tabla.padEnd(20)} - ERROR: ${e.message}`);
      }
    }
    
    console.log('\n🎉 Verificación completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  }
}

verificarDB();
