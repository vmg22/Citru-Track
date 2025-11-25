#!/usr/bin/env node

/**
 * Script de verificación de requisitos para el simulador
 * Valida que todas las dependencias y configuraciones estén correctas
 */

const db = require('./config/db');

console.log(`
╔════════════════════════════════════════════════════════╗
║  🔍 VERIFICACIÓN DE REQUISITOS - SIMULADOR GPS  🔍    ║
╚════════════════════════════════════════════════════════╝
`);

async function verificarBaseDatos() {
  console.log('📊 Verificando conexión a base de datos...');
  
  try {
    await db.query('SELECT 1');
    console.log('   ✅ Conexión a base de datos exitosa\n');
    return true;
  } catch (error) {
    console.error('   ❌ Error de conexión a base de datos:', error.message);
    console.error('   💡 Verifica tu archivo .env y que MySQL esté corriendo\n');
    return false;
  }
}

async function verificarTablas() {
  console.log('📋 Verificando tablas requeridas...');
  
  const tablasRequeridas = [
    'camiones',
    'orden_despacho',
    'tracking_realtime',
    'productos'
  ];
  
  let todasExisten = true;
  
  for (const tabla of tablasRequeridas) {
    try {
      await db.query(`SELECT 1 FROM ${tabla} LIMIT 1`);
      console.log(`   ✅ Tabla '${tabla}' existe`);
    } catch (error) {
      console.error(`   ❌ Tabla '${tabla}' no encontrada`);
      todasExisten = false;
    }
  }
  
  console.log('');
  return todasExisten;
}

async function verificarProductos() {
  console.log('🍊 Verificando productos en base de datos...');
  
  try {
    const [productos] = await db.query('SELECT producto_id, nombre FROM productos LIMIT 5');
    
    if (productos.length === 0) {
      console.warn('   ⚠️  No hay productos en la base de datos');
      console.warn('   💡 El simulador necesita al menos 1 producto');
      console.warn('   💡 Inserta productos manualmente o el simulador fallará\n');
      return false;
    }
    
    console.log(`   ✅ ${productos.length} producto(s) encontrado(s):`);
    productos.forEach(p => {
      console.log(`      - ID: ${p.producto_id}, Nombre: ${p.nombre}`);
    });
    console.log('');
    return true;
  } catch (error) {
    console.error('   ❌ Error al verificar productos:', error.message, '\n');
    return false;
  }
}

async function verificarTransportistas() {
  console.log('🚛 Verificando transportistas...');
  
  try {
    const [transportistas] = await db.query('SELECT transportista_id, nombre FROM transportistas LIMIT 1');
    
    if (transportistas.length === 0) {
      console.warn('   ⚠️  No hay transportistas en la base de datos');
      console.warn('   💡 Insertando transportista por defecto...');
      
      try {
        await db.query(`
          INSERT INTO transportistas (nombre, email, telefono, estado, created_at)
          VALUES ('Simulador S.A.', 'sim@citrutrack.com', '000-0000000', 'activo', NOW())
        `);
        console.log('   ✅ Transportista creado exitosamente\n');
        return true;
      } catch (insertError) {
        console.error('   ❌ Error al crear transportista:', insertError.message, '\n');
        return false;
      }
    }
    
    console.log(`   ✅ Transportista encontrado: ${transportistas[0].nombre}\n`);
    return true;
  } catch (error) {
    console.error('   ❌ Error al verificar transportistas:', error.message, '\n');
    return false;
  }
}

async function verificarSocket() {
  console.log('🔌 Verificando servidor Socket.IO...');
  
  const io = require('socket.io-client');
  const CONFIG = require('./utils/simulatorConfig');
  
  return new Promise((resolve) => {
    const socket = io(CONFIG.SOCKET_URL || 'http://localhost:3000', {
      timeout: 5000,
      reconnection: false
    });
    
    socket.on('connect', () => {
      console.log('   ✅ Servidor Socket.IO disponible\n');
      socket.disconnect();
      resolve(true);
    });
    
    socket.on('connect_error', (error) => {
      console.error('   ❌ No se pudo conectar al servidor Socket.IO');
      console.error(`   💡 Asegúrate de que el backend esté corriendo en ${CONFIG.SOCKET_URL || 'http://localhost:3000'}`);
      console.error('   💡 Ejecuta: npm run dev\n');
      socket.disconnect();
      resolve(false);
    });
    
    setTimeout(() => {
      console.error('   ❌ Timeout al conectar con Socket.IO\n');
      socket.disconnect();
      resolve(false);
    }, 5000);
  });
}

async function verificarDatosExistentes() {
  console.log('🗂️  Verificando datos de simulación existentes...');
  
  try {
    const [camiones] = await db.query(`
      SELECT COUNT(*) as count FROM camiones WHERE patente LIKE 'SIM%'
    `);
    
    const [ordenes] = await db.query(`
      SELECT COUNT(*) as count FROM orden_despacho WHERE od_code LIKE 'OD-SIM-%'
    `);
    
    if (camiones[0].count > 0 || ordenes[0].count > 0) {
      console.log(`   ⚠️  Datos de simulación existentes encontrados:`);
      console.log(`      - ${camiones[0].count} camión(es) simulado(s)`);
      console.log(`      - ${ordenes[0].count} orden(es) simulada(s)`);
      console.log('   💡 El simulador los reutilizará si es posible\n');
    } else {
      console.log('   ✅ No hay datos de simulación previos\n');
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Error al verificar datos existentes:', error.message, '\n');
    return false;
  }
}

async function main() {
  let todoCorrecto = true;
  
  try {
    // Ejecutar todas las verificaciones
    const resultados = await Promise.all([
      verificarBaseDatos(),
      verificarTablas(),
      verificarProductos(),
      verificarTransportistas(),
      verificarDatosExistentes()
    ]);
    
    todoCorrecto = resultados.every(r => r);
    
    // Verificar socket (separado porque puede tardar)
    const socketOk = await verificarSocket();
    todoCorrecto = todoCorrecto && socketOk;
    
    // Resumen
    console.log('═══════════════════════════════════════════════════════\n');
    
    if (todoCorrecto) {
      console.log('✅ ¡Todas las verificaciones pasaron exitosamente!\n');
      console.log('🚀 Puedes ejecutar el simulador con:');
      console.log('   npm run simulator');
      console.log('   o');
      console.log('   node src/runSimulator.js\n');
    } else {
      console.log('❌ Algunas verificaciones fallaron\n');
      console.log('💡 Corrige los errores antes de ejecutar el simulador\n');
      process.exitCode = 1;
    }
    
  } catch (error) {
    console.error('❌ Error fatal durante la verificación:', error);
    process.exitCode = 1;
  } finally {
    await db.end();
    process.exit();
  }
}

main();
