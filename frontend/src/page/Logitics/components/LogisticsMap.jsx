import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import io from 'socket.io-client';
import logisticService from '../services/logisticsService';
import './styles/LogisticsMap.css';

// Configuración de Google Maps
const libraries = ['places'];
const mapContainerStyle = { width: '100%', height: '100%' }; 
const center = { lat: -31.4201, lng: -64.1888 };
const options = {
  disableDefaultUI: false,
  zoomControl: true,
  fullscreenControl: false,
  streetViewControl: false,
};

export default function LogisticsMap() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // --- ESTADOS ---
  const [camiones, setCamiones] = useState([]);
  const [selectedCamion, setSelectedCamion] = useState(null);
  const [directions, setDirections] = useState(null);
  const [socket, setSocket] = useState(null);

  // Estados de filtros
  const [filtroMovimiento, setFiltroMovimiento] = useState(false);
  const [filtroEstados, setFiltroEstados] = useState([]);
  const [filtroProductos, setFiltroProductos] = useState([]);
  const [filtroDestino, setFiltroDestino] = useState([]);

  // Opciones disponibles
  const estadosDisponibles = ['en_ruta', 'pendiente', 'en_carga'];
  
  const { productos: productosUnicos, destinos: destinosUnicos } = useMemo(() => {
    const productos = [...new Set(camiones.map(c => c.producto_nombre).filter(Boolean))];
    const destinos = [...new Set(camiones.map(c => c.destino).filter(Boolean))];
    return { productos: productos.sort(), destinos: destinos.sort() };
  }, [camiones]);

  // --- CARGA DE DATOS ---
useEffect(() => {
    const cargarFlotaActiva = async () => {
      try {
        const response = await logisticService.getFlotaActiva();
        // Aseguramos que sea un array, ya sea que venga directo o dentro de .data
        const dataRaw = Array.isArray(response) ? response : (response?.data || []);

        console.log("Datos recibidos del backend:", dataRaw); // Para tu control

        const camionesMapeados = dataRaw.map(camion => {
          // CONVERSIÓN ROBUSTA DE VELOCIDAD
          // 1. Si es null o undefined, usa 0
          // 2. Si viene como string "85.5", lo convierte a numero 85.5
          let vel = 0;
          if (camion.velocidad !== null && camion.velocidad !== undefined) {
             vel = Number(camion.velocidad);
          }
          // Si la conversión falla (da NaN), volvemos a 0
          if (isNaN(vel)) vel = 0;

          return {
             orden_despacho_id: camion.orden_despacho_id || camion.id,
             patente: camion.patente || 'Sin patente',
             
             // Coordenadas: Forzamos float
             lat: parseFloat(camion.lat) || -31.4201,
             lng: parseFloat(camion.lng) || -64.1888,
             
             // AQUI ESTABA EL PROBLEMA: Usamos la velocidad procesada
             velocidad: vel,
             
             estado: camion.estado || 'pendiente',
             origen: camion.origen || camion.origen_nombre || 'Planta Central', 
             destino: camion.destino || 'Desconocido',
             chofer: camion.chofer || 'Sin chofer',
             producto_nombre: camion.producto_nombre || 'Varios',
             
             // Sensores
             temperatura: camion.temp_actual ?? camion.temperatura, 
             humedad: camion.hum_actual ?? camion.humedad,
             presion: camion.presion_actual ?? camion.presion
          };
        });

        setCamiones(camionesMapeados);
        
      } catch (error) {
        console.error('Error cargando flota', error);
        setCamiones([]);
      }
    };
    
    cargarFlotaActiva();

    // Socket Logic (Se mantiene igual)
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';
    try {
      const newSocket = io(socketUrl);
      setSocket(newSocket);
      newSocket.on('tracking:global_feed', newData => {
        setCamiones(prev => {
          // Al recibir por socket, también aseguramos que la velocidad sea número
          const velSocket = newData.velocidad ? Number(newData.velocidad) : 0;
          const dataProcesada = { ...newData, velocidad: isNaN(velSocket) ? 0 : velSocket };

          const idx = prev.findIndex(c => c.orden_despacho_id === dataProcesada.orden_despacho_id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...dataProcesada };
            return updated;
          }
          return [...prev, dataProcesada];
        });
      });
      return () => newSocket.disconnect();
    } catch (e) {
      console.warn('Socket error', e);
    }
  }, []);

  // --- LÓGICA FILTROS ---
  const camionesFiltrados = useMemo(() => {
    return camiones.filter(camion => {
      if (filtroMovimiento && parseFloat(camion.velocidad) === 0) return false;
      if (filtroEstados.length && !filtroEstados.includes(camion.estado)) return false;
      if (filtroProductos.length && !filtroProductos.includes(camion.producto_nombre)) return false;
      if (filtroDestino.length && !filtroDestino.includes(camion.destino)) return false;
      return true;
    });
  }, [camiones, filtroMovimiento, filtroEstados, filtroProductos, filtroDestino]);

  const toggleEstado = estado => setFiltroEstados(prev => prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]);
  const toggleProducto = producto => setFiltroProductos(prev => prev.includes(producto) ? prev.filter(p => p !== producto) : [...prev, producto]);
  const toggleDestino = destino => setFiltroDestino(prev => prev.includes(destino) ? prev.filter(d => d !== destino) : [...prev, destino]);
  
  const limpiarFiltros = () => {
    setFiltroMovimiento(false);
    setFiltroEstados([]);
    setFiltroProductos([]);
    setFiltroDestino([]);
  };

  // --- MAPA ---
  const handleMarkerClick = useCallback(camion => {
    setSelectedCamion(camion);
    if (!camion.destino || camion.destino === 'Desconocido') return;
    
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: parseFloat(camion.lat), lng: parseFloat(camion.lng) },
        destination: camion.destino,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) setDirections(result);
      }
    );
  }, []);

  const getEstadoColorClass = (estado) => `logistics-status-badge logistics-status-${estado}`;
  const traducirEstado = (estado) => {
    const map = { en_ruta: 'En Ruta', pendiente: 'Pendiente', en_carga: 'En Carga', entregado: 'Entregado', cancelado: 'Cancelado' };
    return map[estado] || estado;
  };

  if (loadError) return <div>Error de mapa</div>;
  if (!isLoaded) return <div>Cargando...</div>;

  return (
    <div className="logistics-layout"> 
      
      {/* === IZQUIERDA: FILTROS === */}
      <div className="logistics-sidebar">
        <div className="logistics-filters-header">
          <div>
            <h3 className="logistics-filters-title">Monitoreo en Vivo</h3>
            <div style={{ fontSize: '0.8rem', color: '#5f6368', marginTop: '4px' }}>
              Viendo <strong>{camionesFiltrados.length}</strong> de <strong>{camiones.length}</strong> unidades
            </div>
          </div>
        </div>

        <div className="logistics-filters-content">
            {/* Movimiento */}
            <div className="logistics-filter-group">
              <label className="logistics-checkbox-label">
                <input
                  type="checkbox"
                  checked={filtroMovimiento}
                  onChange={e => setFiltroMovimiento(e.target.checked)}
                  className="logistics-checkbox-input"
                />
                <span className="logistics-checkbox-text">🚛 Solo en movimiento</span>
              </label>
            </div>

            {/* Estados */}
            <div className="logistics-filter-group">
              <h4 className="logistics-filter-label">Estado</h4>
              {estadosDisponibles.map(estado => (
                <label key={estado} className="logistics-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filtroEstados.includes(estado)}
                    onChange={() => toggleEstado(estado)}
                    className="logistics-checkbox-input"
                  />
                  <span className="logistics-checkbox-text">{traducirEstado(estado)}</span>
                </label>
              ))}
            </div>

            {/* Productos */}
            {productosUnicos.length > 0 && (
              <div className="logistics-filter-group">
                <h4 className="logistics-filter-label">Producto</h4>
                {productosUnicos.map(producto => (
                  <label key={producto} className="logistics-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filtroProductos.includes(producto)}
                      onChange={() => toggleProducto(producto)}
                      className="logistics-checkbox-input"
                    />
                    <span className="logistics-checkbox-text">{producto}</span>
                  </label>
                ))}
              </div>
            )}

             {/* Destinos */}
             {destinosUnicos.length > 0 && (
              <div className="logistics-filter-group">
                <h4 className="logistics-filter-label">Destino</h4>
                {destinosUnicos.map(destino => (
                  <label key={destino} className="logistics-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filtroDestino.includes(destino)}
                      onChange={() => toggleDestino(destino)}
                      className="logistics-checkbox-input"
                    />
                    <span className="logistics-checkbox-text">{destino}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Limpiar */}
            {(filtroMovimiento || filtroEstados.length > 0 || filtroProductos.length > 0 || filtroDestino.length > 0) && (
               <div style={{ padding: '0 24px' }}>
                  <button onClick={limpiarFiltros} className="logistics-clear-filters" style={{marginTop: '10px'}}>
                    Limpiar Filtros
                  </button>
               </div>
            )}
        </div>
      </div>

      {/* === DERECHA: MAPA === */}
      <div className="logistics-map-wrapper">
        <GoogleMap 
            mapContainerStyle={mapContainerStyle} 
            zoom={6} 
            center={center} 
            options={options}
        >
          {camionesFiltrados.map(camion => (
            <Marker
              key={camion.orden_despacho_id}
              position={{ lat: parseFloat(camion.lat), lng: parseFloat(camion.lng) }}
              onClick={() => handleMarkerClick(camion)}
              // Opcional: Icono diferente si está detenido
              opacity={camion.estado === 'pendiente' ? 0.7 : 1}
            />
          ))}
          
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: { strokeColor: '#1a73e8', strokeWeight: 5 },
                suppressMarkers: true,
              }}
            />
          )}

          {/* === INFO WINDOW COMPLETA === */}
          {selectedCamion && (
            <InfoWindow
              position={{ lat: parseFloat(selectedCamion.lat), lng: parseFloat(selectedCamion.lng) }}
              onCloseClick={() => {
                setSelectedCamion(null);
                setDirections(null);
              }}
            >
              <div className="logistics-info-window">
                <h2 className="logistics-info-title">
                    {selectedCamion.patente} 
                    <span style={{fontSize: '0.8em', color: '#666', fontWeight: 'normal'}}> ({selectedCamion.velocidad} km/h)</span>
                </h2>
                
                <div className="logistics-info-content">
                  
                  {/* Sección Principal */}
                  <div className="logistics-info-row">
                    <span className="logistics-info-label">Chofer:</span>
                    <span className="logistics-info-value">{selectedCamion.chofer}</span>
                  </div>
                  <div className="logistics-info-row">
                    <span className="logistics-info-label">Producto:</span>
                    <span className="logistics-info-value">{selectedCamion.producto_nombre}</span>
                  </div>
                  <div className="logistics-info-row">
                    <span className="logistics-info-label">Ruta:</span>
                    <span className="logistics-info-value">{selectedCamion.origen} ➝ {selectedCamion.destino}</span>
                  </div>
                  
                  {/* Estado Badge */}
                  <div className="logistics-info-row" style={{marginTop: '8px', marginBottom: '8px'}}>
                    <span className={getEstadoColorClass(selectedCamion.estado)}>
                      {traducirEstado(selectedCamion.estado)}
                    </span>
                  </div>

                  {/* === SECCIÓN DE SENSORES (NUEVO) === */}
                  <div style={{
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr 1fr', 
                      gap: '5px', 
                      background: '#f1f3f4', 
                      padding: '8px', 
                      borderRadius: '6px',
                      marginTop: '8px',
                      textAlign: 'center'
                  }}>
                      <div title="Temperatura">
                          <div style={{fontSize: '1.2em'}}>Temperatura</div>
                          <div style={{fontSize: '0.85em', fontWeight: 'bold'}}>
                              {selectedCamion.temperatura != null ? `${selectedCamion.temperatura}°C` : '--'}
                          </div>
                      </div>
                      <div title="Humedad">
                          <div style={{fontSize: '1.2em'}}>Humedad</div>
                          <div style={{fontSize: '0.85em', fontWeight: 'bold'}}>
                              {selectedCamion.humedad != null ? `${selectedCamion.humedad}%` : '--'}
                          </div>
                      </div>
                      <div title="Presión">
                          <div style={{fontSize: '1.2em'}}>Presion</div>
                          <div style={{fontSize: '0.85em', fontWeight: 'bold'}}>
                              {selectedCamion.presion != null ? `${selectedCamion.presion} hPa` : '--'}
                          </div>
                      </div>
                  </div>

                  {/* Estimación de Ruta */}
                  {directions && directions.routes[0]?.legs[0] && (
                    <div className="logistics-info-estimation">
                      <p className="logistics-info-estimation-title">Tiempo estimado</p>
                      <div className="logistics-info-estimation-details">
                        <p>🕒 {directions.routes[0].legs[0].duration?.text}</p>
                        <p>🛣️ {directions.routes[0].legs[0].distance?.text}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}