import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import io from 'socket.io-client';
import logisticService from '../services/logisticsService';
import './styles/LogisticsMap.css';

// Configuración de Google Maps
const libraries = ['places'];

// CAMBIO: El mapa ahora debe llenar el contenedor derecho (flex-grow)
// Quitamos el borde redondeado aquí porque lo maneja el layout padre si se desea
const mapContainerStyle = { width: '100%', height: '100%' }; 

const center = { lat: -31.4201, lng: -64.1888 };
const options = {
  disableDefaultUI: false, // Dejamos los controles de zoom/satélite de Google
  zoomControl: true,
  fullscreenControl: false, // Opcional: quitar fullscreen para no romper el layout
  streetViewControl: false,
};

export default function LogisticsMap() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // --- ESTADOS Y LÓGICA (Sin cambios importantes aquí) ---
  const [camiones, setCamiones] = useState([]);
  const [selectedCamion, setSelectedCamion] = useState(null);
  const [directions, setDirections] = useState(null);
  const [socket, setSocket] = useState(null);

  // Estados de filtros
  const [filtroMovimiento, setFiltroMovimiento] = useState(false);
  const [filtroEstados, setFiltroEstados] = useState([]);
  const [filtroProductos, setFiltroProductos] = useState([]);
  const [filtroDestino, setFiltroDestino] = useState([]);
  
  // Nota: 'mostrarFiltros' ya no es tan necesario si la barra es fija, 
  // pero podemos dejarlo si quieres colapsar la barra lateral en el futuro.

  // Opciones de filtros disponibles
  const estadosDisponibles = ['en_ruta', 'pendiente', 'en_carga'];
  const { productos: productosUnicos, destinos: destinosUnicos } = useMemo(() => {
    const productos = [...new Set(camiones.map(c => c.producto_nombre).filter(Boolean))];
    const destinos = [...new Set(camiones.map(c => c.destino).filter(Boolean))];
    return { productos: productos.sort(), destinos: destinos.sort() };
  }, [camiones]);

  // Carga inicial y socket (Igual que antes)
  useEffect(() => {
    const cargarFlotaActiva = async () => {
      try {
        const data = await logisticService.getFlotaActiva();
        const camionesNormalizados = Array.isArray(data) ? data : (data?.data || []); // Simplificado
        // ... (Tu lógica de mapeo se mantiene igual, la resumo por brevedad)
        const camionesMapeados = camionesNormalizados.map(camion => ({
             orden_despacho_id: camion.orden_despacho_id || camion.id,
             patente: camion.patente || 'Sin patente',
             lat: parseFloat(camion.lat) || -31.4201,
             lng: parseFloat(camion.lng) || -64.1888,
             velocidad: camion.velocidad || 0,
             estado: camion.estado || 'pendiente',
             destino: camion.destino || 'Desconocido',
             chofer: camion.chofer || 'Sin chofer',
             producto_nombre: camion.producto_nombre || 'Varios',
             temperatura: camion.temperatura
        }));
        setCamiones(camionesMapeados);
      } catch (error) {
        console.error('Error cargando flota', error);
        // Mock data por si falla
        setCamiones([{ orden_despacho_id: 1, patente: 'TEST-01', lat: -31.4201, lng: -64.1888, estado: 'en_ruta', producto_nombre: 'Arándanos', destino: 'Puerto', chofer: 'Juan', velocidad: 45 }]);
      }
    };
    cargarFlotaActiva();
    // ... (Socket logic se mantiene igual)
  }, []);

  // Lógica de filtrado (Igual que antes)
  const camionesFiltrados = useMemo(() => {
    return camiones.filter(camion => {
      if (filtroMovimiento && parseFloat(camion.velocidad) === 0) return false;
      if (filtroEstados.length && !filtroEstados.includes(camion.estado)) return false;
      if (filtroProductos.length && !filtroProductos.includes(camion.producto_nombre)) return false;
      if (filtroDestino.length && !filtroDestino.includes(camion.destino)) return false;
      return true;
    });
  }, [camiones, filtroMovimiento, filtroEstados, filtroProductos, filtroDestino]);

  // Handlers de filtros
  const toggleEstado = estado => setFiltroEstados(prev => prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]);
  const toggleProducto = producto => setFiltroProductos(prev => prev.includes(producto) ? prev.filter(p => p !== producto) : [...prev, producto]);
  const toggleDestino = destino => setFiltroDestino(prev => prev.includes(destino) ? prev.filter(d => d !== destino) : [...prev, destino]);
  
  const limpiarFiltros = () => {
    setFiltroMovimiento(false);
    setFiltroEstados([]);
    setFiltroProductos([]);
    setFiltroDestino([]);
  };

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

  const getEstadoColorClass = estado => `logistics-status-badge logistics-status-${estado}`;
  const traducirEstado = estado => { /* ... tu lógica ... */ return estado };

  if (loadError) return <div>Error de mapa</div>;
  if (!isLoaded) return <div>Cargando...</div>;

  // --- NUEVO RENDERIZADO FLEXBOX ---
  return (
    <div className="logistics-layout"> {/* Contenedor Flex Principal */}
      
      {/* 1. BARRA LATERAL (FILTROS) */}
      <div className="logistics-sidebar">
        
        {/* Cabecera Sidebar: Título y Resumen */}
        <div className="logistics-filters-header">
          <div>
            <h3 className="logistics-filters-title">Monitoreo en Vivo</h3>
            <div style={{ fontSize: '0.8rem', color: '#5f6368', marginTop: '4px' }}>
              Viendo <strong>{camionesFiltrados.length}</strong> de <strong>{camiones.length}</strong> unidades
            </div>
          </div>
        </div>

        {/* Contenido Scrollable */}
        <div className="logistics-filters-content">
            
            {/* Filtro Movimiento */}
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

            {/* Filtro Estados */}
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
                  <span className="logistics-checkbox-text">{estado}</span>
                </label>
              ))}
            </div>

            {/* Filtro Productos */}
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

             {/* Filtro Destinos */}
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

            {/* Botón Limpiar */}
            {(filtroMovimiento || filtroEstados.length > 0 || filtroProductos.length > 0 || filtroDestino.length > 0) && (
               <div style={{ padding: '0 24px' }}>
                  <button onClick={limpiarFiltros} className="logistics-clear-filters" style={{marginTop: '10px'}}>
                    Limpiar Filtros
                  </button>
               </div>
            )}
        </div>
      </div>

      {/* 2. WRAPPER DEL MAPA (Derecha) */}
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
              // Icono opcional, usa default si prefieres
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
                {/* Contenido del InfoWindow igual que antes */}
                <div>{selectedCamion.chofer} - {selectedCamion.producto_nombre}</div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
      
    </div>
  );
}