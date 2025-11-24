#!/usr/bin/env node

/**
 * Script de ejecución rápida del simulador de GPS
 * Uso: node runSimulator.js
 */

const SimuladorGPS = require('./utils/gpsSimulator');

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚛  SIMULADOR DE GPS PARA CAMIONES - CITRU TRACK  🚛   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

📋 Características:
   • 10 camiones simulados
   • Rutas reales de Argentina
   • Velocidad variable (40-90 km/h)
   • Actualización cada 3 segundos
   • Integración con WebSockets
   • Almacenamiento en base de datos

🎯 Presiona CTRL+C para detener la simulación
`);

const simulador = new SimuladorGPS();

async function main() {
  try {
    console.log('⏳ Preparando simulación...\n');
    
    // Inicializar
    await simulador.inicializar();
    
    console.log('\n');
    
    // Iniciar simulación
    simulador.iniciarSimulacion();
    
    console.log('\n📡 Puedes ver los datos en tiempo real en:');
    console.log('   • Dashboard: http://localhost:5173');
    console.log('   • API: http://localhost:4000/api/tracking/live');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error fatal al iniciar simulador:', error);
    console.error('\n💡 Asegúrate de:');
    console.error('   1. Tener el servidor backend corriendo');
    console.error('   2. La base de datos esté accesible');
    console.error('   3. Las tablas necesarias existan\n');
    process.exit(1);
  }
}

// Manejar cierre del proceso
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Deteniendo simulador...');
  simulador.detener();
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('\n¿Deseas limpiar los datos de simulación de la BD? (s/n): ', async (answer) => {
    if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
      await simulador.limpiarDatos();
    } else {
      console.log('ℹ️  Los datos simulados permanecerán en la base de datos');
    }
    
    console.log('\n👋 Simulador cerrado\n');
    process.exit(0);
  });
});

// Ejecutar
main();
