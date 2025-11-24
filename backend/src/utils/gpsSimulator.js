/**
 * Simulador de GPS para Camiones
 * Este archivo genera datos de posición GPS simulados para 10 camiones en tiempo real
 * con velocidades realistas y movimiento a lo largo de rutas
 */

const io = require('socket.io-client');
const db = require('../config/db');
const userConfig = require('./simulatorConfig');

// Configuración del simulador (puede ser sobrescrita por simulatorConfig.js)
const CONFIG = {
  NUM_CAMIONES: 10,
  UPDATE_INTERVAL: 3000,
  VELOCIDAD_MIN: 40,
  VELOCIDAD_MAX: 90,
  SOCKET_URL: 'http://localhost:4000',
  PROBABILIDAD_CAMBIO_VELOCIDAD: 0.3,
  PROBABILIDAD_CAMBIO_ESTADO: 0.1,
  FACTOR_AVANCE: 0.05,
  VERBOSE: true,
  LOG_FREQUENCY: 0.1,
  AUTO_CLEAN_ON_START: false,
  ...userConfig // Sobrescribir con configuración del usuario
};

// Rutas predefinidas en Argentina (Buenos Aires - diferentes destinos)
const RUTAS = [
  {
    nombre: 'Buenos Aires - Rosario',
    puntos: [
      { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
      { lat: -34.2, lng: -58.5 },
      { lat: -33.8, lng: -59.0 },
      { lat: -33.4, lng: -59.5 },
      { lat: -33.0, lng: -60.0 },
      { lat: -32.9468, lng: -60.6393 }  // Rosario
    ],
    destino: 'Rosario, Santa Fe',
    tipo_destino: 'otra_ciudad'
  },
  {
    nombre: 'Buenos Aires - Córdoba',
    puntos: [
      { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
      { lat: -34.1, lng: -58.8 },
      { lat: -33.5, lng: -59.5 },
      { lat: -32.8, lng: -60.5 },
      { lat: -32.2, lng: -61.5 },
      { lat: -31.4201, lng: -64.1888 }  // Córdoba
    ],
    destino: 'Córdoba Capital',
    tipo_destino: 'otra_ciudad'
  },
  {
    nombre: 'Buenos Aires - Mar del Plata',
    puntos: [
      { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
      { lat: -35.0, lng: -58.0 },
      { lat: -36.0, lng: -57.5 },
      { lat: -37.0, lng: -57.3 },
      { lat: -38.0055, lng: -57.5426 }  // Mar del Plata
    ],
    destino: 'Mar del Plata, Bs. As.',
    tipo_destino: 'puerto'
  },
  {
    nombre: 'Buenos Aires - Mendoza',
    puntos: [
      { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
      { lat: -34.0, lng: -59.5 },
      { lat: -33.5, lng: -61.0 },
      { lat: -33.0, lng: -63.0 },
      { lat: -32.8895, lng: -68.8458 }  // Mendoza
    ],
    destino: 'Mendoza Capital',
    tipo_destino: 'aeropuerto'
  },
  {
    nombre: 'Buenos Aires - Bahía Blanca',
    puntos: [
      { lat: -34.6037, lng: -58.3816 },
      { lat: -35.5, lng: -59.0 },
      { lat: -36.5, lng: -60.0 },
      { lat: -37.5, lng: -61.0 },
      { lat: -38.7183, lng: -62.2663 }  // Bahía Blanca
    ],
    destino: 'Bahía Blanca, Bs. As.',
    tipo_destino: 'puerto'
  }
];

// Productos típicos para transporte
const PRODUCTOS = [
  { id: 1, nombre: 'Naranjas', requiere_temp: true },
  { id: 2, nombre: 'Limones', requiere_temp: true },
  { id: 3, nombre: 'Mandarinas', requiere_temp: true },
  { id: 4, nombre: 'Pomelos', requiere_temp: true }
];

// Estados posibles del camión
const EVENTOS = ['en_ruta', 'detenido', 'cargando', 'descargando'];

class CamionSimulado {
  constructor(id, patente, ruta, camion_id, orden_despacho_id) {
    this.id = id;
    this.patente = patente;
    this.camion_id = camion_id;
    this.orden_despacho_id = orden_despacho_id;
    this.ruta = ruta;
    this.puntoActual = 0;
    this.progreso = 0; // 0 a 1 entre dos puntos
    this.velocidad = this.randomVelocidad();
    this.evento = 'en_ruta';
    this.lat = ruta.puntos[0].lat;
    this.lng = ruta.puntos[0].lng;
  }

  randomVelocidad() {
    return Math.floor(Math.random() * (CONFIG.VELOCIDAD_MAX - CONFIG.VELOCIDAD_MIN)) + CONFIG.VELOCIDAD_MIN;
  }

  // Interpolar entre dos puntos
  interpolar(punto1, punto2, t) {
    return {
      lat: punto1.lat + (punto2.lat - punto1.lat) * t,
      lng: punto1.lng + (punto2.lng - punto1.lng) * t
    };
  }

  actualizar() {
    // Avanzar en la ruta
    const velocidadNormalizada = this.velocidad / 100; // Factor de avance
    this.progreso += velocidadNormalizada * CONFIG.FACTOR_AVANCE;

    if (this.progreso >= 1) {
      this.progreso = 0;
      this.puntoActual++;
      
      // Reiniciar ruta si llegamos al final
      if (this.puntoActual >= this.ruta.puntos.length - 1) {
        this.puntoActual = 0;
        console.log(`🔄 Camión ${this.patente} completó la ruta, reiniciando...`);
      }

      // Cambiar velocidad aleatoriamente
      if (Math.random() < CONFIG.PROBABILIDAD_CAMBIO_VELOCIDAD) {
        this.velocidad = this.randomVelocidad();
      }

      // Cambiar evento ocasionalmente
      if (Math.random() < CONFIG.PROBABILIDAD_CAMBIO_ESTADO) {
        this.evento = EVENTOS[Math.floor(Math.random() * EVENTOS.length)];
      } else {
        this.evento = 'en_ruta';
      }
    }

    // Calcular posición actual interpolando entre dos puntos
    const punto1 = this.ruta.puntos[this.puntoActual];
    const punto2 = this.ruta.puntos[this.puntoActual + 1];
    const posicion = this.interpolar(punto1, punto2, this.progreso);

    this.lat = posicion.lat;
    this.lng = posicion.lng;
  }

  getData() {
    return {
      orden_despacho_id: this.orden_despacho_id,
      camion_id: this.camion_id,
      patente: this.patente,
      lat: this.lat,
      lng: this.lng,
      velocidad: this.velocidad,
      evento: this.evento,
      timestamp: new Date()
    };
  }
}

class SimuladorGPS {
  constructor() {
    this.camiones = [];
    this.socket = null;
    this.intervalId = null;
  }

  async inicializar() {
    console.log('🚀 Iniciando simulador de GPS...');
    
    try {
      // Conectar al socket
      this.socket = io(CONFIG.SOCKET_URL);
      
      this.socket.on('connect', () => {
        console.log('✅ Conectado al servidor de sockets');
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Desconectado del servidor de sockets');
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión al socket:', error.message);
      });

      // Crear camiones simulados
      await this.crearCamiones();
      
      console.log(`✅ ${this.camiones.length} camiones creados y listos para simulación`);
      
    } catch (error) {
      console.error('❌ Error al inicializar simulador:', error);
      throw error;
    }
  }

  async crearCamiones() {
    for (let i = 0; i < CONFIG.NUM_CAMIONES; i++) {
      const patente = `SIM${(1000 + i).toString()}`;
      const ruta = RUTAS[i % RUTAS.length];
      const producto = PRODUCTOS[i % PRODUCTOS.length];
      
      try {
        // Verificar si el camión ya existe
        const [existingCamion] = await db.query(
          'SELECT camion_id FROM camiones WHERE patente = ?',
          [patente]
        );

        let camion_id;
        
        if (existingCamion.length > 0) {
          camion_id = existingCamion[0].camion_id;
          console.log(`ℹ️  Camión ${patente} ya existe (ID: ${camion_id})`);
        } else {
          // Crear camión en la BD
          const [result] = await db.query(
            `INSERT INTO camiones 
            (transportista_id, patente, tipo_camion, capacidad_pallets, estado, created_at)
            VALUES (1, ?, 'Refrigerado', 33, 'activo', NOW())`,
            [patente]
          );
          camion_id = result.insertId;
          console.log(`✅ Camión ${patente} creado (ID: ${camion_id})`);
        }

        // Crear orden de despacho
        try {
          const [odResult] = await db.query(
            `INSERT INTO orden_despacho 
            (od_code, camion_id, producto_id, destino, tipo_destino, estado, fecha_creacion)
            VALUES (?, ?, ?, ?, ?, 'en_ruta', NOW())`,
            [`OD-SIM-${i + 1}`, camion_id, producto.id, ruta.destino, ruta.tipo_destino]
          );
          const orden_despacho_id = odResult.insertId;
          console.log(`✅ Orden ${`OD-SIM-${i + 1}`} creada (ID: ${orden_despacho_id})`);

          // Crear instancia del camión simulado
          const camionSimulado = new CamionSimulado(
            i + 1,
            patente,
            ruta,
            camion_id,
            orden_despacho_id
          );

          this.camiones.push(camionSimulado);
        } catch (odError) {
          console.error(`❌ Error al crear orden para ${patente}:`, odError.message);
          console.error(`   SQL: ${odError.sqlMessage || odError.sql || ''}`);
        }
        
      } catch (error) {
        console.error(`❌ Error al crear camión ${patente}:`, error);
      }
    }
  }

  iniciarSimulacion() {
    console.log('🎬 Iniciando simulación de movimiento...');
    
    this.intervalId = setInterval(() => {
      this.camiones.forEach(camion => {
        // Actualizar posición del camión
        camion.actualizar();
        const data = camion.getData();

        // Enviar datos por socket
        if (this.socket && this.socket.connected) {
          this.socket.emit('tracking:update', data);
        }

        // Guardar en base de datos
        this.guardarTracking(data).catch(err => {
          console.error('Error al guardar tracking:', err);
        });

        // Log según configuración
        if (CONFIG.VERBOSE && Math.random() < CONFIG.LOG_FREQUENCY) {
          console.log(
            `🚚 ${data.patente} | ` +
            `Pos: [${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}] | ` +
            `Vel: ${data.velocidad} km/h | ` +
            `Estado: ${data.evento}`
          );
        }
      });
    }, CONFIG.UPDATE_INTERVAL);

    console.log(`✅ Simulación activa (actualización cada ${CONFIG.UPDATE_INTERVAL / 1000}s)`);
  }

  async guardarTracking(data) {
    try {
      await db.query(
        `INSERT INTO tracking_realtime
        (orden_despacho_id, camion_id, lat, lng, velocidad, evento)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.orden_despacho_id,
          data.camion_id,
          data.lat,
          data.lng,
          data.velocidad,
          data.evento
        ]
      );
    } catch (error) {
      // Silenciar errores de inserción para no saturar la consola
      if (!error.message.includes('Duplicate')) {
        console.error('Error guardando tracking:', error.message);
      }
    }
  }

  detener() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('⏹️  Simulación detenida');
    }
    if (this.socket) {
      this.socket.disconnect();
      console.log('🔌 Socket desconectado');
    }
  }

  async limpiarDatos() {
    console.log('🧹 Limpiando datos de simulación...');
    try {
      // Eliminar tracking de órdenes simuladas
      await db.query(`
        DELETE tr FROM tracking_realtime tr
        JOIN orden_despacho od ON tr.orden_despacho_id = od.od_id
        WHERE od.od_code LIKE 'OD-SIM-%'
      `);

      // Eliminar órdenes simuladas
      await db.query(`DELETE FROM orden_despacho WHERE od_code LIKE 'OD-SIM-%'`);

      // Marcar camiones simulados como inactivos
      await db.query(`UPDATE camiones SET estado = 'inactivo' WHERE patente LIKE 'SIM%'`);

      console.log('✅ Datos de simulación limpiados');
    } catch (error) {
      console.error('❌ Error al limpiar datos:', error);
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const simulador = new SimuladorGPS();

  async function main() {
    try {
      await simulador.inicializar();
      simulador.iniciarSimulacion();

      // Manejar cierre graceful
      process.on('SIGINT', async () => {
        console.log('\n\n🛑 Deteniendo simulador...');
        simulador.detener();
        
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        readline.question('¿Deseas limpiar los datos de simulación? (s/n): ', async (answer) => {
          if (answer.toLowerCase() === 's') {
            await simulador.limpiarDatos();
          }
          await db.end();
          process.exit(0);
        });
      });

    } catch (error) {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    }
  }

  main();
}

module.exports = SimuladorGPS;
