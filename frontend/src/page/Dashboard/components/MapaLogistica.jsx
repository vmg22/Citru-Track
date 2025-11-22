import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { calculateRoute, formatDuration, formatDistance } from '../../../services/routingService';

// Fix para los iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Iconos personalizados
const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const myLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para centrar el mapa y mostrar ubicación
const LocationMarker = ({ position, accuracy }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 16);
    }
  }, [position, map]);

  return position ? (
    <>
      <Marker position={position} icon={myLocationIcon}>
        <Popup>
          <div style={{ minWidth: '250px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>📍 Tu Ubicación Actual</h4>
            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}>
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <strong>Latitud:</strong> {position[0].toFixed(6)}°
              </p>
              <p style={{ margin: '4px 0', fontSize: '13px' }}>
                <strong>Longitud:</strong> {position[1].toFixed(6)}°
              </p>
              {accuracy && (
                <p style={{ margin: '4px 0', fontSize: '13px' }}>
                  <strong>Precisión:</strong> ±{accuracy.toFixed(0)} metros
                </p>
              )}
              <p style={{ margin: '8px 0 4px 0', fontSize: '12px', color: '#666' }}>
                <i className="fas fa-info-circle"></i> Coordenadas GPS de alta precisión
              </p>
            </div>
          </div>
        </Popup>
      </Marker>
      
      {/* Círculo de precisión */}
      {accuracy && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{
            color: '#2196F3',
            fillColor: '#2196F3',
            fillOpacity: 0.1,
            weight: 2
          }}
        />
      )}
    </>
  ) : null;
};

const MapaLogistica = () => {
  const centerPosition = [-26.8241, -65.2226];
  const [myLocation, setMyLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [routeInfo, setRouteInfo] = useState({});
  const [routeGeometries, setRouteGeometries] = useState({});
  const [calculatingRoutes, setCalculatingRoutes] = useState(false);

  const [trucks] = useState([
    {
      id: '#12',
      driver: 'Carlos Gómez',
      position: [-26.8241, -65.2226],
      destination: 'Aeropuerto Tucumán',
      destinationPos: [-26.8406, -65.1045],
      temperature: '5.4°C',
      status: 'En tránsito'
    },
    {
      id: '#13',
      driver: 'María López',
      position: [-32.4, -63.2],
      destination: 'Mercado Central Bs.As.',
      destinationPos: [-34.6037, -58.3816],
      temperature: '6.2°C',
      status: 'En tránsito'
    },
    {
      id: '#14',
      driver: 'Juan Pérez',
      position: [-32.9442, -60.6505],
      destination: 'Puerto Rosario',
      destinationPos: [-32.9520, -60.6397],
      temperature: '7.1°C',
      status: 'En destino'
    }
  ]);

  const getMyLocation = () => {
    setIsTracking(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización');
      setIsTracking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
        
        setMyLocation([latitude, longitude]);
        setLocationAccuracy(accuracy);
        
        // Guardar detalles completos de la ubicación
        setLocationDetails({
          latitude,
          longitude,
          accuracy,
          altitude,
          altitudeAccuracy,
          heading,
          speed,
          timestamp: new Date(position.timestamp).toLocaleString('es-AR')
        });
        
        setIsTracking(false);
        console.log('✅ Ubicación obtenida con alta precisión:', {
          lat: latitude,
          lng: longitude,
          precisión: accuracy + 'm'
        });
      },
      (error) => {
        let errorMessage = 'Error al obtener ubicación';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '❌ Permiso denegado. Permite el acceso a tu ubicación en la configuración del navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '❌ Ubicación no disponible. Verifica tu conexión GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = '❌ Tiempo de espera agotado. Intenta nuevamente.';
            break;
          default:
            errorMessage = '❌ Error desconocido al obtener ubicación.';
            break;
        }
        setLocationError(errorMessage);
        setIsTracking(false);
        console.error('Error de geolocalización:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const formatCoordinate = (coord, isLat) => {
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutesDecimal = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);
    
    const direction = isLat 
      ? (coord >= 0 ? 'N' : 'S')
      : (coord >= 0 ? 'E' : 'O');
    
    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  };

  // Calcular información de rutas al cargar
  useEffect(() => {
    const calculateAllRoutes = async () => {
      setCalculatingRoutes(true);
      const newRouteInfo = {};
      const newRouteGeometries = {};

      for (const truck of trucks) {
        try {
          const route = await calculateRoute(truck.position, truck.destinationPos);
          newRouteInfo[truck.id] = route;
          newRouteGeometries[truck.id] = route.geometry;
          console.log(`Ruta calculada para ${truck.id}:`, route);
        } catch (error) {
          console.error(`Error calculando ruta para camión ${truck.id}:`, error);
        }
      }

      setRouteInfo(newRouteInfo);
      setRouteGeometries(newRouteGeometries);
      setCalculatingRoutes(false);
      console.log('Todas las rutas calculadas:', newRouteGeometries);
    };

    calculateAllRoutes();
  }, []);

  return (
    <div>
      {/* BOTONES */}
      <div style={{ 
        marginBottom: '10px', 
        display: 'flex', 
        gap: '10px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          onClick={getMyLocation}
          disabled={isTracking}
          style={{
            padding: '10px 18px',
            backgroundColor: isTracking ? '#ccc' : '#2e7d32',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isTracking ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s'
          }}
        >
          <i className="fas fa-location-crosshairs"></i>
          {isTracking ? 'Obteniendo ubicación GPS...' : 'Obtener Mi Ubicación GPS'}
        </button>

        <button
          onClick={() => setShowRoutes(!showRoutes)}
          style={{
            padding: '10px 18px',
            backgroundColor: showRoutes ? '#1976d2' : '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className={`fas fa-${showRoutes ? 'route' : 'route'}`}></i>
          {showRoutes ? 'Ocultar Rutas' : 'Mostrar Rutas'}
        </button>

        {myLocation && (
          <button
            onClick={() => {
              setMyLocation(null);
              setLocationError(null);
              setLocationDetails(null);
              setLocationAccuracy(null);
            }}
            style={{
              padding: '10px 18px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="fas fa-times"></i> Limpiar Ubicación
          </button>
        )}
      </div>

      {/* Mensajes de Error */}
      {locationError && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '6px',
          marginBottom: '10px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className="fas fa-exclamation-triangle"></i>
          <span>{locationError}</span>
        </div>
      )}

      {/* Indicador de cálculo de rutas */}
      {calculatingRoutes && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e3f2fd',
          color: '#1565c0',
          borderRadius: '6px',
          marginBottom: '10px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className="fas fa-spinner fa-spin"></i>
          <span>Calculando rutas optimizadas...</span>
        </div>
      )}

      {/* Información Detallada de Ubicación */}
      {locationDetails && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e8f5e9',
          borderRadius: '8px',
          marginBottom: '10px',
          border: '2px solid #4caf50'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <i className="fas fa-map-marker-alt" style={{ color: '#2e7d32', fontSize: '20px', marginRight: '10px' }}></i>
            <strong style={{ color: '#2e7d32', fontSize: '16px' }}>Ubicación GPS Detallada</strong>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
            <div>
              <strong>📍 Latitud (Decimal):</strong>
              <div style={{ fontFamily: 'monospace', color: '#1976d2' }}>
                {locationDetails.latitude.toFixed(8)}°
              </div>
            </div>
            
            <div>
              <strong>📍 Longitud (Decimal):</strong>
              <div style={{ fontFamily: 'monospace', color: '#1976d2' }}>
                {locationDetails.longitude.toFixed(8)}°
              </div>
            </div>
            
            <div>
              <strong>🧭 Latitud (DMS):</strong>
              <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {formatCoordinate(locationDetails.latitude, true)}
              </div>
            </div>
            
            <div>
              <strong>🧭 Longitud (DMS):</strong>
              <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {formatCoordinate(locationDetails.longitude, false)}
              </div>
            </div>
            
            <div>
              <strong>🎯 Precisión:</strong>
              <div style={{ color: locationAccuracy < 10 ? '#4caf50' : locationAccuracy < 50 ? '#ff9800' : '#f44336' }}>
                ±{locationDetails.accuracy.toFixed(1)} metros
              </div>
            </div>
            
            {locationDetails.altitude && (
              <div>
                <strong>⛰️ Altitud:</strong>
                <div>{locationDetails.altitude.toFixed(1)} m sobre el nivel del mar</div>
              </div>
            )}
            
            {locationDetails.speed && locationDetails.speed > 0 && (
              <div>
                <strong>🚗 Velocidad:</strong>
                <div>{(locationDetails.speed * 3.6).toFixed(1)} km/h</div>
              </div>
            )}
            
            <div>
              <strong>🕐 Hora:</strong>
              <div>{locationDetails.timestamp}</div>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '10px', 
            padding: '8px', 
            backgroundColor: '#fff', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            <strong>📋 Copiar coordenadas:</strong>
            <div style={{ fontFamily: 'monospace', marginTop: '4px' }}>
              {locationDetails.latitude.toFixed(6)}, {locationDetails.longitude.toFixed(6)}
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <MapContainer 
        center={centerPosition} 
        zoom={6} 
        style={{ height: '500px', width: '100%', borderRadius: '8px', border: '2px solid #e0e0e0' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker position={myLocation} accuracy={locationAccuracy} />

        {trucks.map((truck) => (
          <React.Fragment key={truck.id}>
            <Marker position={truck.position} icon={truckIcon}>
              <Popup>
                <div style={{ minWidth: '250px' }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>🚚 {truck.id}</h4>
                  <p style={{ margin: '4px 0' }}><strong>Chofer:</strong> {truck.driver}</p>
                  <p style={{ margin: '4px 0' }}><strong>Destino:</strong> {truck.destination}</p>
                  <p style={{ margin: '4px 0' }}><strong>Temp:</strong> {truck.temperature}</p>
                  <p style={{ margin: '4px 0' }}><strong>Estado:</strong> {truck.status}</p>
                  
                  {routeInfo[truck.id] && (
                    <div style={{ 
                      marginTop: '10px', 
                      paddingTop: '10px', 
                      borderTop: '1px solid #e0e0e0' 
                    }}>
                      <h5 style={{ margin: '0 0 6px 0', color: '#1976d2' }}>📍 Información de Ruta</h5>
                      <p style={{ margin: '4px 0', fontSize: '13px' }}>
                        <strong>Distancia:</strong> {routeInfo[truck.id].distanceKm} km
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '13px' }}>
                        <strong>Tiempo estimado:</strong> {formatDuration(routeInfo[truck.id].duration)}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '13px' }}>
                        <strong>Velocidad promedio:</strong> {(parseFloat(routeInfo[truck.id].distanceKm) / parseFloat(routeInfo[truck.id].durationHours)).toFixed(0)} km/h
                      </p>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>

            <Marker position={truck.destinationPos} icon={destinationIcon}>
              <Popup>
                <div>
                  <h4 style={{ margin: '0 0 8px 0' }}>📍 {truck.destination}</h4>
                  <p style={{ fontSize: '12px', color: '#666' }}>Punto de entrega</p>
                  
                  {routeInfo[truck.id] && (
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      <p style={{ margin: '2px 0' }}>
                        <strong>Distancia desde camión:</strong> {routeInfo[truck.id].distanceKm} km
                      </p>
                      <p style={{ margin: '2px 0' }}>
                        <strong>ETA:</strong> {formatDuration(routeInfo[truck.id].duration)}
                      </p>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Mostrar ruta optimizada o línea recta */}
            {showRoutes && routeGeometries[truck.id] ? (
              <Polyline 
                positions={routeGeometries[truck.id]} 
                color={truck.status === 'En tránsito' ? '#ff9800' : '#4caf50'}
                weight={5}
                opacity={0.8}
              />
            ) : !showRoutes ? (
              <Polyline 
                positions={[truck.position, truck.destinationPos]} 
                color={truck.status === 'En tránsito' ? '#ff9800' : '#4caf50'}
                weight={3}
                opacity={0.7}
                dashArray="10, 10"
              />
            ) : null}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapaLogistica;