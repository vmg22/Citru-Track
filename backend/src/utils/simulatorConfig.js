/**
 * Configuración del Simulador de GPS
 * 
 * Puedes modificar estos valores para personalizar el comportamiento del simulador
 */

module.exports = {
  // Número de camiones a simular
  NUM_CAMIONES: 10,

  // Intervalo de actualización en milisegundos (3000 = 3 segundos)
  UPDATE_INTERVAL: 3000,

  // Velocidad mínima en km/h
  VELOCIDAD_MIN: 40,

  // Velocidad máxima en km/h
  VELOCIDAD_MAX: 90,

  // URL del servidor de sockets
  SOCKET_URL: 'http://localhost:4000',

  // Probabilidad de cambiar velocidad (0.0 - 1.0)
  // 0.3 = 30% de probabilidad cada vez que llega a un punto
  PROBABILIDAD_CAMBIO_VELOCIDAD: 0.3,

  // Probabilidad de cambiar estado (0.0 - 1.0)
  // 0.1 = 10% de probabilidad de detenerse/cargar/descargar
  PROBABILIDAD_CAMBIO_ESTADO: 0.1,

  // Factor de velocidad de avance en la ruta
  // Valores más altos = camiones se mueven más rápido entre puntos
  FACTOR_AVANCE: 0.05,

  // Mostrar logs detallados
  VERBOSE: true,

  // Frecuencia de logs en consola (0.0 - 1.0)
  // 0.1 = mostrar 10% de las actualizaciones
  LOG_FREQUENCY: 0.1,

  // Limpiar datos automáticamente al iniciar
  AUTO_CLEAN_ON_START: false,

  // Camiones específicos (deja vacío para generar automáticamente)
  // Si especificas camiones aquí, se usarán en lugar de generarlos
  CAMIONES_CUSTOM: [
    // Ejemplo:
    // { patente: 'ABC123', ruta_index: 0 },
    // { patente: 'DEF456', ruta_index: 1 },
  ]
};
