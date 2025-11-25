const db = require('./src/config/db');

async function testCrearOrden() {
  console.log('🧪 Probando creación de orden de despacho...\n');
  
  try {
    // Verificar productos
    const [productos] = await db.query('SELECT producto_id, nombre FROM productos LIMIT 1');
    if (productos.length === 0) {
      console.error('❌ No hay productos en la BD. Inserta al menos uno primero.');
      await db.end();
      return;
    }
    
    console.log('✅ Producto encontrado:', productos[0].nombre, '(ID:', productos[0].producto_id + ')');
    
    // Verificar camión simulado
    const [camiones] = await db.query(`SELECT camion_id, patente FROM camiones WHERE patente = 'SIM1000'`);
    if (camiones.length === 0) {
      console.error('❌ No se encontró el camión SIM1000');
      await db.end();
      return;
    }
    
    console.log('✅ Camión encontrado:', camiones[0].patente, '(ID:', camiones[0].camion_id + ')');
    
    // Intentar crear orden de despacho de prueba
    const [result] = await db.query(`
      INSERT INTO orden_despacho 
      (od_code, camion_id, producto_id, destino, tipo_destino, estado, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, 'en_ruta', NOW())`,
      [
        'OD-TEST-001',
        camiones[0].camion_id,
        productos[0].producto_id,
        'Rosario, Santa Fe',
        'otra_ciudad'
      ]
    );
    
    console.log('✅ Orden de despacho creada exitosamente (ID:', result.insertId + ')');
    
    // Limpiar la orden de prueba
    await db.query('DELETE FROM orden_despacho WHERE od_code = ?', ['OD-TEST-001']);
    console.log('✅ Orden de prueba eliminada');
    
    console.log('\n✅ ¡Todo funciona correctamente! El simulador debería funcionar ahora.\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Detalles:', error.sqlMessage || error);
  } finally {
    await db.end();
  }
}

testCrearOrden();
