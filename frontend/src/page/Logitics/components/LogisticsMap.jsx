import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import io from 'socket.io-client';
import logisticService from '../services/logisticsService';
import './styles/LogisticsMap.css';

// Configuración de Google Maps
const libraries = ['places'];
const mapContainerStyle = { width: '100%', height: '75vh', borderRadius: '12px' };
const center = { lat: -31.4201, lng: -64.1888 };
const options = {
  disableDefaultUI: false,
  zoomControl: true,
};

export default function LogisticsMap() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Estados principales
  const [camiones, setCamiones] = useState([]);
  const [selectedCamion, setSelectedCamion] = useState(null);
  const [directions, setDirections] = useState(null);
  const [socket, setSocket] = useState(null);

  // Estados de filtros
  const [filtroMovimiento, setFiltroMovimiento] = useState(false);
  const [filtroEstados, setFiltroEstados] = useState([]);
  const [filtroProductos, setFiltroProductos] = useState([]);
  const [filtroDestino, setFiltroDestino] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);

  // Opciones de filtros disponibles
  const estadosDisponibles = ['en_ruta', 'pendiente', 'en_carga'];
  const { productos: productosUnicos, destinos: destinosUnicos } = useMemo(() => {
    const productos = [...new Set(camiones.map(c => c.producto_nombre).filter(Boolean))];
    const destinos = [...new Set(camiones.map(c => c.destino).filter(Boolean))];
    return { productos: productos.sort(), destinos: destinos.sort() };
  }, [camiones]);

  // Carga inicial y socket
  useEffect(() => {
    const cargarFlotaActiva = async () => {
      try {
        const data = await logisticService.getFlotaActiva();
        const camionesNormalizados = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.camiones)
              ? data.camiones
              : [];
        const camionesMapeados = camionesNormalizados.map(camion => ({
          orden_despacho_id: camion.orden_despacho_id || camion.od_id || camion.id,
          patente: camion.patente || 'Sin patente',
          lat: parseFloat(camion.lat) || -34.6037 + (Math.random() - 0.5) * 2,
          lng: parseFloat(camion.lng) || -58.3816 + (Math.random() - 0.5) * 2,
          velocidad: camion.velocidad || 0,
          estado: camion.estado,
          estado_actual: camion.estado_actual || camion.evento,
          destino: camion.destino || 'Destino no especificado',
          chofer: camion.chofer || camion.chofer_nombre || 'Chofer no asignado',
          producto_nombre: camion.producto_nombre || 'Sin producto',
          temperatura: camion.temperatura || null,
        }));
        setCamiones(camionesMapeados);
      } catch (error) {
        console.error('Error cargando flota activa:', error);
        setCamiones([
          {
            orden_despacho_id: 1,
            patente: 'ABC123',
            lat: -34.6037,
            lng: -58.3816,
            velocidad: 80,
            estado: 'en_ruta',
            estado_actual: 'En movimiento',
            destino: 'Buenos Aires',
            chofer: 'Juan Pérez',
            producto_nombre: 'Naranjas',
            temperatura: null,
          },
        ]);
      }
    };
    cargarFlotaActiva();

    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';
    try {
      const newSocket = io(socketUrl);
      setSocket(newSocket);
      newSocket.on('tracking:global_feed', newData => {
        setCamiones(prev => {
          const idx = prev.findIndex(c => c.orden_despacho_id === newData.orden_despacho_id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...newData };
            return updated;
          }
          return [...prev, newData];
        });
      });
      return () => newSocket.disconnect();
    } catch (e) {
      console.warn('Socket no disponible, continuando sin tiempo real');
    }
  }, []);

  // Lógica de filtrado
  const camionesFiltrados = useMemo(() => {
    return camiones.filter(camion => {
      if (filtroMovimiento && parseFloat(camion.velocidad) === 0) return false;
      if (filtroEstados.length && !filtroEstados.includes(camion.estado)) return false;
      if (filtroProductos.length && !filtroProductos.includes(camion.producto_nombre)) return false;
      if (filtroDestino.length && !filtroDestino.includes(camion.destino)) return false;
      return true;
    });
  }, [camiones, filtroMovimiento, filtroEstados, filtroProductos, filtroDestino]);

  // Funciones de manejo de filtros
  const toggleEstado = estado => {
    setFiltroEstados(prev =>
      prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
    );
  };

  const toggleProducto = producto => {
    setFiltroProductos(prev =>
      prev.includes(producto) ? prev.filter(p => p !== producto) : [...prev, producto]
    );
  };

  const toggleDestino = destino => {
    setFiltroDestino(prev =>
      prev.includes(destino) ? prev.filter(d => d !== destino) : [...prev, destino]
    );
  };

  const limpiarFiltros = () => {
    setFiltroMovimiento(false);
    setFiltroEstados([]);
    setFiltroProductos([]);
    setFiltroDestino([]);
  };

  const cantidadFiltrosActivos = () => {
    let count = 0;
    if (filtroMovimiento) count++;
    count += filtroEstados.length;
    count += filtroProductos.length;
    count += filtroDestino.length;
    return count;
  };

  // Calcular ruta al hacer click en marcador
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
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Error calculando ruta: ${status}`);
          setDirections(null);
        }
      }
    );
  }, []);

  // Helper para traducir estados
  const traducirEstado = estado => {
    const traducciones = {
      en_ruta: 'En Ruta',
      pendiente: 'Pendiente',
      en_carga: 'En Carga',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };
    return traducciones[estado] || estado;
  };

  // Helper para clase de color
  const getEstadoColorClass = estado => `logistics-status-badge logistics-status-${estado}`;

  if (loadError) return <div className="logistics-error">Error cargando Google Maps. Verifica tu API Key.</div>;
  if (!isLoaded) return <div className="logistics-loading">Cargando Google Maps...</div>;

  return (
    <div className="logistics-map-container">
      {/* Resumen */}
      <div className="logistics-summary-panel">
        <h3 className="logistics-summary-title">
          <span className="logistics-summary-status" /> Monitoreo en Vivo
        </h3>
        <div className="logistics-summary-stats">
          <div>
            <strong>{camionesFiltrados.length}</strong> de <strong>{camiones.length}</strong> camiones
          </div>
          {cantidadFiltrosActivos() > 0 && (
            <div className="logistics-summary-filters">
              {cantidadFiltrosActivos()} filtro(s) activo(s)
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="logistics-filters-container">
        {!mostrarFiltros ? (
          <button onClick={() => setMostrarFiltros(true)} className="logistics-filters-toggle">
            <span className="logistics-filters-toggle-text">🔍 Filtros</span>
            {cantidadFiltrosActivos() > 0 && (
              <span className="logistics-filters-badge">{cantidadFiltrosActivos()}</span>
            )}
          </button>
        ) : (
          <div className="logistics-filters-panel">
            <div className="logistics-filters-header">
              <h3 className="logistics-filters-title">
                <span>🔍</span> Filtros
                {cantidadFiltrosActivos() > 0 && (
                  <span className="logistics-filters-badge">{cantidadFiltrosActivos()}</span>
                )}
              </h3>
              <button onClick={() => setMostrarFiltros(false)} className="logistics-filters-close">✕</button>
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
                <div className="logistics-filter-options">
                  {estadosDisponibles.map(estado => (
                    <label key={estado} className="logistics-checkbox-label">
                      <input
                        type="checkbox"
                        checked={filtroEstados.includes(estado)}
                        onChange={() => toggleEstado(estado)}
                        className="logistics-checkbox-input"
                      />
                      <span className={getEstadoColorClass(estado)}>{traducirEstado(estado)}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Productos */}
              {productosUnicos.length > 0 && (
                <div className="logistics-filter-group">
                  <h4 className="logistics-filter-label">Producto</h4>
                  <div className="logistics-filter-options">
                    {productosUnicos.map(producto => (
                      <label key={producto} className="logistics-checkbox-label">
                        <input
                          type="checkbox"
                          checked={filtroProductos.includes(producto)}
                          onChange={() => toggleProducto(producto)}
                          className="logistics-checkbox-input"
                        />
                        <span className="logistics-checkbox-text logistics-text-truncate">🍊 {producto}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {/* Destinos */}
              {destinosUnicos.length > 0 && (
                <div className="logistics-filter-group">
                  <h4 className="logistics-filter-label">Destino</h4>
                  <div className="logistics-filter-options">
                    {destinosUnicos.map(destino => (
                      <label key={destino} className="logistics-checkbox-label">
                        <input
                          type="checkbox"
                          checked={filtroDestino.includes(destino)}
                          onChange={() => toggleDestino(destino)}
                          className="logistics-checkbox-input"
                        />
                        <span className="logistics-checkbox-text logistics-text-truncate">📍 {destino}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {/* Limpiar */}
              {cantidadFiltrosActivos() > 0 && (
                <button onClick={limpiarFiltros} className="logistics-clear-filters">✕ Limpiar Filtros</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mapa */}
      <GoogleMap mapContainerStyle={mapContainerStyle} zoom={6} center={center} options={options}>
        {camionesFiltrados.map(camion => (
          <Marker
            key={camion.orden_despacho_id}
            position={{ lat: parseFloat(camion.lat), lng: parseFloat(camion.lng) }}
            onClick={() => handleMarkerClick(camion)}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/741/741407.png',
              scaledSize: new window.google.maps.Size(35, 35),
            }}
          />
        ))}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: '#3b82f6',
                strokeWeight: 5,
                strokeOpacity: 0.7,
              },
              suppressMarkers: true,
            }}
          />
        )}
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
                  <span className="logistics-info-label">Destino:</span>
                  <span className="logistics-info-value">{selectedCamion.destino}</span>
                </div>
                <div className="logistics-info-row">
                  <span className="logistics-info-label">Producto:</span>
                  <span className="logistics-info-value">{selectedCamion.producto_nombre}</span>
                </div>
                <div className="logistics-info-row">
                  <span className="logistics-info-label">Velocidad:</span>
                  <span className="logistics-info-value">{selectedCamion.velocidad} km/h</span>
                </div>
                <div className="logistics-info-row">
                  <span className="logistics-info-label">Estado:</span>
                  <span className="logistics-info-value">
                    <span className={getEstadoColorClass(selectedCamion.estado)}>{traducirEstado(selectedCamion.estado)}</span>
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
                    <p className="logistics-info-estimation-title">Estimación de viaje:</p>
                    <div className="logistics-info-estimation-details">
                      <p>🕒 {directions.routes[0].legs[0].duration?.text || 'N/A'}</p>
                      <p>🛣️ {directions.routes[0].legs[0].distance?.text || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}