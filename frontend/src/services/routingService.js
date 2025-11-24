import L from 'leaflet';
import 'leaflet-routing-machine';

// URL base del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Servicio para calcular rutas optimizadas usando el backend proxy
 * El backend hace las peticiones a OSRM evitando problemas de CORS/firewall
 */

/**
 * Crea un control de routing para Leaflet
 * @param {Array} waypoints - Array de coordenadas [[lat, lng], [lat, lng], ...]
 * @param {Object} options - Opciones adicionales
 * @returns {L.Routing.Control} Control de routing
 */
export const createRoutingControl = (waypoints, options = {}) => {
  const defaultOptions = {
    waypoints: waypoints.map(point => L.latLng(point[0], point[1])),
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    showAlternatives: false,
    lineOptions: {
      styles: [
        { color: '#2196F3', opacity: 0.8, weight: 6 },
        { color: 'white', opacity: 0.3, weight: 2 }
      ]
    },
    createMarker: function() { return null; }, // No crear marcadores adicionales
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1',
      profile: 'driving', // driving, car, bicycle, foot
    }),
    ...options
  };

  return L.Routing.control(defaultOptions);
};

/**
 * Calcula la ruta entre dos puntos y retorna información
 * @param {Array} start - Coordenadas de inicio [lat, lng]
 * @param {Array} end - Coordenadas de destino [lat, lng]
 * @returns {Promise} Promesa con información de la ruta
 */
export const calculateRoute = async (start, end) => {
  try {
    // Llamar al backend proxy en lugar de OSRM directo
    const url = `${API_URL}/routing/calculate?start=${start[0]},${start[1]}&end=${end[0]},${end[1]}`;
    
    console.log('🔍 Calculando ruta via backend proxy:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Error calculando ruta');
    }

    console.log('✅ Ruta calculada:', data.data);
    
    return data.data;

  } catch (error) {
    console.error('❌ Error calculando ruta:', error);
    // Fallback: retornar una línea recta si falla el backend
    console.warn('⚠️ Usando línea recta como fallback');
    return calculateStraightLine(start, end);
  }
};

/**
 * Calcula una línea recta como fallback cuando OSRM no está disponible
 * @param {Array} start - Coordenadas de inicio [lat, lng]
 * @param {Array} end - Coordenadas de destino [lat, lng]
 * @returns {Object} Información de ruta estimada
 */
const calculateStraightLine = (start, end) => {
  // Calcular distancia haversine
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(end[0] - start[0]);
  const dLon = toRad(end[1] - start[1]);
  const lat1 = toRad(start[0]);
  const lat2 = toRad(end[0]);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // en metros

  // Estimar duración (asumiendo 60 km/h promedio)
  const duration = (distance / 1000) / 60 * 3600; // en segundos

  return {
    distance: distance,
    duration: duration,
    geometry: [start, end], // línea recta
    distanceKm: (distance / 1000).toFixed(2),
    durationMin: Math.round(duration / 60),
    durationHours: (duration / 3600).toFixed(1)
  };
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calcula ruta con múltiples paradas (waypoints)
 * @param {Array} waypoints - Array de coordenadas [[lat, lng], [lat, lng], ...]
 * @returns {Promise} Promesa con información de la ruta
 */
export const calculateMultiStopRoute = async (waypoints) => {
  try {
    // Convertir waypoints a formato esperado por el backend
    const waypointsParam = waypoints
      .map(point => `${point[0]},${point[1]}`)
      .join(';');
    
    const url = `${API_URL}/routing/calculate-multi?waypoints=${waypointsParam}`;
    
    console.log('🔍 Calculando ruta multi-parada via backend proxy');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Error calculando ruta');
    }

    return data.data;

  } catch (error) {
    console.error('❌ Error calculando ruta multi-parada:', error);
    throw error;
  }
};

/**
 * Formatea la duración en formato legible
 * @param {number} seconds - Duración en segundos
 * @returns {string} Duración formateada
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
};

/**
 * Formatea la distancia en formato legible
 * @param {number} meters - Distancia en metros
 * @returns {string} Distancia formateada
 */
export const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

export default {
  createRoutingControl,
  calculateRoute,
  calculateMultiStopRoute,
  formatDuration,
  formatDistance
};
