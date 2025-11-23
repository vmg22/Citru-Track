const https = require('https');

/**
 * Controlador para manejar cálculos de rutas
 * Actúa como proxy para OSRM evitando problemas de CORS y firewall
 */

/**
 * Calcula una ruta optimizada entre dos puntos
 * @route GET /api/routing/calculate
 * @query {string} start - Coordenadas de inicio (lat,lng)
 * @query {string} end - Coordenadas de destino (lat,lng)
 */
exports.calculateRoute = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren parámetros start y end (formato: lat,lng)'
      });
    }

    // Validar formato de coordenadas
    const startCoords = start.split(',').map(Number);
    const endCoords = end.split(',').map(Number);

    if (startCoords.length !== 2 || endCoords.length !== 2 ||
        startCoords.some(isNaN) || endCoords.some(isNaN)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de coordenadas inválido. Use: lat,lng'
      });
    }

    const [startLat, startLng] = startCoords;
    const [endLat, endLng] = endCoords;

    // Construir URL para OSRM
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

    console.log('🔍 Calculando ruta via proxy:', osrmUrl);

    // Hacer petición a OSRM desde el backend
    const osrmData = await fetchFromOSRM(osrmUrl);

    if (osrmData.code !== 'Ok') {
      throw new Error('No se pudo calcular la ruta');
    }

    const route = osrmData.routes[0];

    // Formatear respuesta
    const routeInfo = {
      distance: route.distance, // metros
      duration: route.duration, // segundos
      geometry: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // [lat, lng]
      distanceKm: (route.distance / 1000).toFixed(2),
      durationMin: Math.round(route.duration / 60),
      durationHours: (route.duration / 3600).toFixed(1)
    };

    console.log('✅ Ruta calculada:', {
      distancia: routeInfo.distanceKm + ' km',
      tiempo: routeInfo.durationMin + ' min'
    });

    res.json({
      success: true,
      data: routeInfo
    });

  } catch (error) {
    console.error('❌ Error calculando ruta:', error.message);
    
    // Intentar fallback con línea recta
    try {
      const { start, end } = req.query;
      const startCoords = start.split(',').map(Number);
      const endCoords = end.split(',').map(Number);
      
      const fallbackRoute = calculateStraightLine(startCoords, endCoords);
      
      console.log('⚠️ Usando fallback (línea recta)');
      
      res.json({
        success: true,
        fallback: true,
        data: fallbackRoute
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        message: 'Error al calcular la ruta',
        error: error.message
      });
    }
  }
};

/**
 * Calcula ruta con múltiples paradas
 * @route GET /api/routing/calculate-multi
 * @query {string} waypoints - Coordenadas separadas por ; (lat1,lng1;lat2,lng2;...)
 */
exports.calculateMultiStopRoute = async (req, res) => {
  try {
    const { waypoints } = req.query;

    if (!waypoints) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere parámetro waypoints (formato: lat1,lng1;lat2,lng2;...)'
      });
    }

    // Parsear waypoints
    const waypointsList = waypoints.split(';').map(wp => {
      const coords = wp.split(',').map(Number);
      if (coords.length !== 2 || coords.some(isNaN)) {
        throw new Error('Formato de waypoint inválido');
      }
      return coords;
    });

    if (waypointsList.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren al menos 2 waypoints'
      });
    }

    // Construir coordenadas para OSRM (lng,lat formato)
    const coordinates = waypointsList
      .map(point => `${point[1]},${point[0]}`)
      .join(';');

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

    console.log('🔍 Calculando ruta multi-parada via proxy');

    const osrmData = await fetchFromOSRM(osrmUrl);

    if (osrmData.code !== 'Ok') {
      throw new Error('No se pudo calcular la ruta');
    }

    const route = osrmData.routes[0];

    const routeInfo = {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
      legs: route.legs.map(leg => ({
        distance: leg.distance,
        duration: leg.duration,
        steps: leg.steps
      })),
      distanceKm: (route.distance / 1000).toFixed(2),
      durationMin: Math.round(route.duration / 60),
      durationHours: (route.duration / 3600).toFixed(1)
    };

    res.json({
      success: true,
      data: routeInfo
    });

  } catch (error) {
    console.error('❌ Error calculando ruta multi-parada:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al calcular la ruta',
      error: error.message
    });
  }
};

/**
 * Helper: Hacer petición HTTPS a OSRM
 */
function fetchFromOSRM(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'CitrusTrack/1.0',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 segundos timeout
    }, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Error parseando respuesta de OSRM'));
        }
      });

    }).on('error', (error) => {
      reject(error);
    }).on('timeout', () => {
      reject(new Error('Timeout conectando con OSRM'));
    });
  });
}

/**
 * Helper: Calcular línea recta como fallback
 */
function calculateStraightLine(start, end) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(end[0] - start[0]);
  const dLon = toRad(end[1] - start[1]);
  const lat1 = toRad(start[0]);
  const lat2 = toRad(end[0]);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // en metros

  // Estimar duración (60 km/h promedio)
  const duration = (distance / 1000) / 60 * 3600; // segundos

  return {
    distance: distance,
    duration: duration,
    geometry: [start, end],
    distanceKm: (distance / 1000).toFixed(2),
    durationMin: Math.round(duration / 60),
    durationHours: (duration / 3600).toFixed(1)
  };
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
