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
        const data = await logisticService.getFlotaActiva();
        const camionesNormalizados = Array.isArray(data) ? data : (data?.data || []);
        
        const camionesMapeados = camionesNormalizados.map(camion => ({
             orden_despacho_id: camion.orden_despacho_id || camion.id,
             patente: camion.patente || 'Sin patente',
             lat: parseFloat(camion.lat) || -31.4201,
             lng: parseFloat(camion.lng) || -64.1888,
             velocidad: camion.velocidad || 0,
             estado: camion.estado || 'pendiente',
             // AGREGADO: Mapeo del Origen
             origen: camion.origen || camion.origen_nombre || 'Sin origen', 
             destino: camion.destino || 'Desconocido',
             chofer: camion.chofer || 'Sin chofer',
             producto_nombre: camion.producto_nombre || 'Varios',
             temperatura: camion.temperatura
        }));
        setCamiones(camionesMapeados);
      } catch (error) {
        console.error('Error cargando flota', error);
        // Mock data
        setCamiones([{ 
          orden_despacho_id: 1, 
          patente: 'TEST-01', 
          lat: -31.4201, 
          lng: -64.1888, 
          estado: 'en_ruta', 
          producto_nombre: 'Arándanos', 
          origen: 'Tucumán', // Mock Origen
          destino: 'Buenos Aires', 
          chofer: 'Juan Pérez', 
          velocidad: 45 
        }]);
      }
    };
    cargarFlotaActiva();

    // Socket Logic
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
    try {
      const newSocket = io(socketUrl);
      setSocket(newSocket);
      newSocket.on('tracking:global_feed', newData => {
        if (Array.isArray(newData)) {
          // Si el backend envía la flota completa, reemplaza todo el estado
          setCamiones(newData.map(camion => ({
            orden_despacho_id: camion.orden_despacho_id || camion.id,
            patente: camion.patente || 'Sin patente',
            lat: parseFloat(camion.lat) || -31.4201,
            lng: parseFloat(camion.lng) || -64.1888,
            velocidad: camion.velocidad || 0,
            estado: camion.estado || 'pendiente',
            origen: camion.origen || camion.origen_nombre || 'Sin origen',
            destino: camion.destino || 'Desconocido',
            chofer: camion.chofer || 'Sin chofer',
            producto_nombre: camion.producto_nombre || 'Varios',
            temperatura: camion.temperatura
          })));
        } else {
          // Si solo envía un camión, actualiza el correspondiente
          setCamiones(prev => {
            const idx = prev.findIndex(c => c.orden_despacho_id === newData.orden_despacho_id);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...newData };
              return updated;
            }
            return [...prev, newData];
          });
        }
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
    if (!camion.destino || camion.destino === 'Destino no especificado') return;
    
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
          {camionesFiltrados.map((camion, idx) => (
            <Marker
              key={camion.orden_despacho_id + '-' + camion.patente + '-' + idx}
              position={{ lat: parseFloat(camion.lat), lng: parseFloat(camion.lng) }}
              onClick={() => handleMarkerClick(camion)}
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

          {/* === INFO WINDOW COMPLETA CON ORIGEN === */}
          {selectedCamion && (
            <InfoWindow
              position={{ lat: parseFloat(selectedCamion.lat), lng: parseFloat(selectedCamion.lng) }}
              onCloseClick={() => {
                setSelectedCamion(null);
                setDirections(null);
              }}
            >
              <div className="logistics-info-window">
                <h2 className="logistics-info-title">{selectedCamion.patente}</h2>
                
                <div className="logistics-info-content">
                  
                  <div className="logistics-info-row">
                    <span className="logistics-info-label">Chofer:</span>
                    <span className="logistics-info-value">{selectedCamion.chofer}</span>
                  </div>
                  
                  <div className="logistics-info-row">
                    <span className="logistics-info-label">Producto:</span>
                    <span className="logistics-info-value">{selectedCamion.producto_nombre}</span>
                  </div>

                  {/* AGREGADO: ORIGEN */}
                  <div className="logistics-info-row">
                    <span className="logistics-info-label">Origen:</span>
                    <span className="logistics-info-value">{selectedCamion.origen}</span>
                  </div>

                  <div className="logistics-info-row">
                    <span className="logistics-info-label">Destino:</span>
                    <span className="logistics-info-value">{selectedCamion.destino}</span>
                  </div>
                  
                  <div className="logistics-info-row">
                    <span className="logistics-info-label">Velocidad:</span>
                    <span className="logistics-info-value">{selectedCamion.velocidad} km/h</span>
                  </div>

                  <div className="logistics-info-row" style={{marginTop: '4px'}}>
                    <span className="logistics-info-label">Estado:</span>
                    <span className={getEstadoColorClass(selectedCamion.estado)}>
                      {traducirEstado(selectedCamion.estado)}
                    </span>
                  </div>

                  {selectedCamion.temperatura && (
                    <div className="logistics-info-row">
                      <span className="logistics-info-label">Temperatura:</span>
                      <span className="logistics-info-value">{selectedCamion.temperatura}°C</span>
                    </div>
                  )}

                  {directions && directions.routes[0]?.legs[0] && (
                    <div className="logistics-info-estimation">
                      <p className="logistics-info-estimation-title">Estimación de arribo</p>
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