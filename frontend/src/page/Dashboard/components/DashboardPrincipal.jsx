import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import stockService from "../../../services/stockService";
import "../../../style/DashboardPrincipal.css";
import { Link } from "react-router-dom";
import axios from "axios";

// Configurar base URL
axios.defaults.baseURL = "http://localhost:4000";

// Componente Button Reutilizable
const Button = ({ children, onClick, className = "", icon }) => {
  return (
    <button onClick={onClick} className={`dashboard-button ${className}`}>
      {icon && <i className={icon}></i>}
      {children}
    </button>
  );
};

// Componente Card Reutilizable
const Card = ({ title, icon, iconClass, children, to, fullWidth }) => {
  const CardContent = (
    <div className={`dashboard-card-item ${fullWidth ? 'dashboard-card-full-width' : ''}`}>
      <div className="dashboard-card-header">
        <div className="dashboard-card-title">{title}</div>
        <div className={`dashboard-card-icon ${iconClass}`}>
          <i className={icon}></i>
        </div>
      </div>
      <div className="dashboard-card-content">
        {children}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className={`dashboard-card-link ${fullWidth ? 'dashboard-card-link-full' : ''}`} style={{textDecoration:"none", width: fullWidth ? '100%' : 'auto'}}>
        {CardContent}
      </Link>
    );
  }

  return CardContent;
};

// Componente Status Badge
const StatusBadge = ({ status }) => {
  const getStatusText = (estado) => {
    const statusMap = {
      'en_carga': 'En Carga',
      'en_ruta': 'En Ruta',
      'completada': 'Completada',
      'cancelada': 'Cancelada',
      'Normal': 'Normal',
      'Alerta': 'Alerta',
      'Transito': 'Tránsito'
    };
    return statusMap[estado] || estado;
  };

  const getStatusClass = (estado) => {
    const classMap = {
      'en_carga': 'transito',
      'en_ruta': 'transito',
      'completada': 'normal',
      'cancelada': 'alerta',
      'Normal': 'normal',
      'Alerta': 'alerta',
      'Transito': 'transito'
    };
    return classMap[estado] || 'normal';
  };

  return (
    <span
      className={`dashboard-status dashboard-status-${getStatusClass(status)}`}
    >
      {getStatusText(status)}
    </span>
  );
};

// Componente Table
const Table = ({ headers, rows }) => {
  return (
    <div className="dashboard-table-container">
      <table className="dashboard-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Componente KPI
const KPIItem = ({ value, label, status }) => {
  return (
    <div className="dashboard-kpi-item">
      <div className={`dashboard-kpi-value dashboard-kpi-${status}`}>
        {value}
      </div>
      <div className="dashboard-kpi-label">{label}</div>
    </div>
  );
};

// Componente Alert
const Alert = ({ title, description }) => {
  return (
    <div className="dashboard-alerta">
      <i className="fas fa-exclamation-triangle"></i>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
};

// Componente de gráfico circular para stock
const GraficoCircular = ({ porcentaje, color, label, cantidad }) => {
  const radio = 45;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (porcentaje / 100) * circunferencia;

  return (
    <div className="stock-grafico-circular">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          className="stock-circulo-fondo"
          cx="60"
          cy="60"
          r={radio}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="10"
        />
        <circle
          className="stock-circulo-progreso"
          cx="60"
          cy="60"
          r={radio}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{
            transition: 'stroke-dashoffset 0.5s ease'
          }}
        />
        <text x="60" y="55" className="stock-porcentaje-texto" textAnchor="middle">
          {porcentaje}%
        </text>
        <text x="60" y="72" className="stock-cantidad-texto" textAnchor="middle">
          {cantidad}
        </text>
      </svg>
      <p className="stock-label-grafico">{label}</p>
    </div>
  );
};

// ==================== Componente Principal ====================

const DashboardPrincipal = () => {
  const [stockData, setStockData] = useState({
    totales: {
      total_pallets: 0,
      total_cajas: 0,
      peso_total: 0
    },
    porEstado: []
  });

  const [operacionesActivas, setOperacionesActivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados disponibles
  const estadosPallet = ['armado', 'en_camara', 'reservado', 'en_transporte', 'despachado', 'anulado'];

  // Colores para cada estado
  const coloresEstado = {
    armado: '#3498db',
    en_camara: '#2ecc71',
    reservado: '#f39c12',
    en_transporte: '#9b59b6',
    despachado: '#95a5a6',
    anulado: '#e74c3c'
  };

  // Etiquetas amigables para estados
  const etiquetasEstado = {
    armado: 'Armado',
    en_camara: 'En Cámara',
    reservado: 'Reservado',
    en_transporte: 'En Transporte',
    despachado: 'Despachado',
    anulado: 'Anulado'
  };

  // Función para normalizar respuesta del backend
  const normalizeResponse = (respData) => {
    if (!respData && respData !== 0) return [];
    if (Array.isArray(respData)) return respData;
    if (respData && Array.isArray(respData.data)) return respData.data;
    if (respData && Array.isArray(respData.items)) return respData.items;
    if (respData && Array.isArray(respData.results)) return respData.results;
    if (respData && Array.isArray(respData.ordenes)) return respData.ordenes;
    if (typeof respData === "object") {
      const keys = Object.keys(respData || {});
      for (let k of keys) {
        if (Array.isArray(respData[k])) return respData[k];
      }
    }
    return [];
  };

  const safeArray = (a) => (Array.isArray(a) ? a : []);

  // Mapear campos de orden
  const mapOrderFields = (o) => {
    const orden_id = o.orden_id ?? o.od_id ?? o.id ?? null;
    const od_code = o.od_code ?? o.code ?? o.orden_code ?? null;
    const cliente_nombre = o.cliente_nombre ?? o.cliente ?? o.cliente_name ?? null;
    const transportista_nombre = o.transportista_nombre ?? o.transportista ?? o.transportista_name ?? null;
    const patente = o.patente ?? o.patent ?? o.camion_patente ?? o.patent_plate ?? null;

    return {
      ...o,
      orden_id,
      od_code,
      cliente_nombre,
      transportista_nombre,
      patente
    };
  };

  // Función para cargar datos (movida fuera del useEffect para reutilizarla)
  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar stock y operaciones en paralelo
      const [stockResponse, ordenesResponse] = await Promise.all([
        stockService.getResumenStock({}),
        axios.get("/api/ordenes-despacho")
      ]);
      
      setStockData(stockResponse);

      // Procesar operaciones
      const ordenesRaw = normalizeResponse(ordenesResponse.data);
      const ordenesArr = safeArray(ordenesRaw).map(mapOrderFields);
      
      // Filtrar solo operaciones activas (en_carga o en_ruta)
      const activas = ordenesArr.filter(
        (o) => o && (o.estado === "en_carga" || o.estado === "en_ruta")
      );
      
      setOperacionesActivas(activas);
    } catch (err) {
      console.error('Error al cargar datos de stock:', err);
      setError('Error al cargar los datos de stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';
    
    try {
      const newSocket = io(socketUrl);
      
      // Escuchar eventos de cambios en pallets y órdenes
      newSocket.on('pallet:created', () => {
        console.log('Pallet creado - actualizando dashboard');
        fetchStockData();
      });
      
      newSocket.on('pallet:updated', () => {
        console.log('Pallet actualizado - actualizando dashboard');
        fetchStockData();
      });
      
      newSocket.on('pallet:deleted', () => {
        console.log('Pallet eliminado - actualizando dashboard');
        fetchStockData();
      });
      
      newSocket.on('orden:updated', () => {
        console.log('Orden actualizada - actualizando dashboard');
        fetchStockData();
      });
      
      return () => newSocket.disconnect();
    } catch (error) {
      console.error('Error conectando WebSocket:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calcular porcentaje
  const calcularPorcentaje = (valor, total) => {
    if (!total || total === 0) return 0;
    return ((valor / total) * 100).toFixed(1);
  };

  // Obtener cantidad de cajas por estado
  const getCajasPorEstado = (estado) => {
    const estadoData = stockData.porEstado.find(e => e.estado === estado);
    return estadoData ? estadoData.cantidad_cajas : 0;
  };

  // Obtener cantidad de pallets por estado
  const getPalletsPorEstado = (estado) => {
    const estadoData = stockData.porEstado.find(e => e.estado === estado);
    return estadoData ? estadoData.cantidad_pallets : 0;
  };

  const condicionesData = [
    [
      "T1A3121430LIM00123K",
      "Limón",
      "10.2°C",
      "67%",
      <StatusBadge key="c1" status="Normal" />,
    ],
    [
      "T1A3121431LIM00123J",
      "Limón",
      "12.5°C",
      "65%",
      <StatusBadge key="c2" status="Alerta" />,
    ],
    [
      "T2B3121450ORA00456A",
      "Naranja",
      "8.7°C",
      "70%",
      <StatusBadge key="c3" status="Normal" />,
    ],
  ];

  // Preparar datos de viajes activos desde operaciones
  const viajesData = operacionesActivas.slice(0, 5).map((operacion, index) => [
    operacion.od_code || operacion.orden_id || `#${index + 1}`,
    operacion.transportista_nombre || "N/A",
    operacion.cliente_nombre || "N/A",
    <StatusBadge key={`op-${operacion.orden_id || index}`} status={operacion.estado} />,
    operacion.patente || "-"
  ]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      <div className="monitoreo-container">
        <div className="monitoreo-main-content">
          <div className="monitoreo-header">
            <h2>
              <i className="fas fa-tachometer-alt"></i> Dashboard Principal
            </h2>
            <div className="monitoreo-user-info">
              <i className="fas fa-user-circle"></i>
              <span>Supervisor de Planta</span>
            </div>
          </div>

          {/* Card de Estado de Planta - Ocupa toda la fila */}
          <div style={{ width: '100%', marginBottom: '20px' }}>
            <Card
              title="Estado de Planta"
              icon="fas fa-warehouse"
              iconClass="lotes"
              to="/stock"
              fullWidth={true}
            >
              <p style={{ marginBottom: '20px' }}>
                Visualice el estado actual de todo el stock en planta con trazabilidad completa.
              </p>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="stock-spinner"></div>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    Cargando datos de stock...
                  </p>
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#e74c3c' }}>
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: '24px' }}></i>
                  <p style={{ fontSize: '12px', marginTop: '10px' }}>
                    {error}
                  </p>
                </div>
              ) : (
                <>
                  {/* Totales generales */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '15px',
                    marginBottom: '30px',
                    padding: '25px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', opacity: 0.95, marginBottom: '8px', fontWeight: '500' }}>
                        📦 Total Cajas
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1.2' }}>
                        {stockData.totales.total_cajas.toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', opacity: 0.95, marginBottom: '8px', fontWeight: '500' }}>
                        🚛 Total Pallets
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1.2' }}>
                        {stockData.totales.total_pallets.toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', opacity: 0.95, marginBottom: '8px', fontWeight: '500' }}>
                        ⚖️ Peso Total (kg)
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1.2' }}>
                        {parseFloat(stockData.totales.peso_total).toLocaleString('es-AR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', opacity: 0.95, marginBottom: '8px', fontWeight: '500' }}>
                        📊 Promedio Cajas/Pallet
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1.2' }}>
                        {stockData.totales.total_pallets > 0 
                          ? (stockData.totales.total_cajas / stockData.totales.total_pallets).toFixed(1) 
                          : '0'}
                      </div>
                    </div>
                  </div>

                  {/* Gráficos por estado */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(6, 1fr)', 
                    gap: '15px',
                    marginTop: '20px'
                  }}>
                    {estadosPallet.map(estado => {
                      const cajas = getCajasPorEstado(estado);
                      const pallets = getPalletsPorEstado(estado);
                      const porcentaje = calcularPorcentaje(cajas, stockData.totales.total_cajas);
                      
                      return (
                        <div key={estado} style={{ 
                          textAlign: 'center',
                          padding: '15px',
                          background: '#f8f9fa',
                          borderRadius: '10px',
                          border: `2px solid ${coloresEstado[estado]}20`
                        }}>
                          <GraficoCircular
                            porcentaje={porcentaje}
                            color={coloresEstado[estado]}
                            label={etiquetasEstado[estado]}
                            cantidad={cajas.toLocaleString('es-AR')}
                          />
                          <div style={{ 
                            marginTop: '10px', 
                            fontSize: '11px', 
                            color: '#666',
                            borderTop: `2px solid ${coloresEstado[estado]}`,
                            paddingTop: '8px'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
                              {pallets} Pallets
                            </div>
                            <div>
                              {pallets > 0 ? (cajas / pallets).toFixed(1) : '0'} cajas/pallet
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Card de KPIs - Debajo, ocupa toda la fila */}
          <div style={{ width: '100%', marginBottom: '20px' }}>
            <Card
              title="Dashboard de KPIs"
              icon="fas fa-chart-line"
              iconClass="kpis"
              fullWidth={true}
            >
              <p style={{ marginBottom: '20px' }}>
                Métricas clave de calidad y eficiencia con gráficos y comparativas.
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '20px',
                width: '100%'
              }}>
                <KPIItem value="99.7%" label="Lecturas Correctas" status="good" />
                <KPIItem value="1.8%" label="Merma Promedio" status="warning" />
                <KPIItem value="87.3" label="Costo por Caja ($)" status="good" />
                <KPIItem value="12" label="Alertas Críticas" status="bad" />
              </div>
            </Card>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-left">
              <div className="dashboard-info-card">
                <h3>Condiciones Actuales</h3>
                <Table
                  headers={[
                    "ID Caja",
                    "Producto",
                    "Temperatura",
                    "Humedad",
                    "Estado",
                  ]}
                  rows={condicionesData}
                />
              </div>

              <div className="dashboard-info-card">
                <h3>Viajes Activos ({operacionesActivas.length})</h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ fontSize: '12px', color: '#666' }}>Cargando viajes...</p>
                  </div>
                ) : viajesData.length > 0 ? (
                  <Table
                    headers={[
                      "Orden",
                      "Transportista",
                      "Cliente",
                      "Estado",
                      "Patente"
                    ]}
                    rows={viajesData}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ fontSize: '12px', color: '#999' }}>
                      No hay operaciones activas en este momento
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-right">
              <div className="dashboard-info-card">
                <h3>Alertas Activas</h3>
                <div className="dashboard-alertas-container">
                  <Alert
                    title="Ruptura de frío detectada"
                    description="Caja T1A3121431LIM00123J - Temperatura: 12.5°C"
                  />
                  <Alert
                    title="Vibración excesiva"
                    description="Camión AB 123 CD - Viaje #12"
                  />
                </div>
              </div>

              <div className="dashboard-info-card">
                <h3>Resumen General</h3>
                <div className="dashboard-kpi-container">
                  <KPIItem
                    value="96.5%"
                    label="Puntualidad"
                    status="good"
                  />
                  <KPIItem
                    value="2.4%"
                    label="Rupturas de Frío"
                    status="warning"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPrincipal;



//segundo dashborad principal
// import React, { useState, useEffect } from "react";
// import stockService from "../../../services/stockService";
// import "../../../style/DashboardPrincipal.css";
// import { Link } from "react-router-dom";
// import axios from "axios";

// // Configurar base URL
// axios.defaults.baseURL = "http://localhost:4000";

// // Componente Button Reutilizable
// const Button = ({ children, onClick, className = "", icon }) => {
//   return (
//     <button onClick={onClick} className={`dashboard-button ${className}`}>
//       {icon && <i className={icon}></i>}
//       {children}
//     </button>
//   );
// };

// // Componente Card Reutilizable
// const Card = ({ title, icon, iconClass, children, to, fullWidth }) => {
//   const CardContent = (
//     <div className={`dashboard-card-item ${fullWidth ? 'dashboard-card-full-width' : ''}`}>
//       <div className="dashboard-card-header">
//         <div className="dashboard-card-title">{title}</div>
//         <div className={`dashboard-card-icon ${iconClass}`}>
//           <i className={icon}></i>
//         </div>
//       </div>
//       <div className="dashboard-card-content">
//         {children}
//       </div>
//     </div>
//   );

//   if (to) {
//     return (
//       <Link to={to} className={`dashboard-card-link ${fullWidth ? 'dashboard-card-link-full' : ''}`} style={{textDecoration:"none", width: fullWidth ? '100%' : 'auto'}}>
//         {CardContent}
//       </Link>
//     );
//   }

//   return CardContent;
// };

// // Componente Status Badge
// const StatusBadge = ({ status }) => {
//   const getStatusText = (estado) => {
//     const statusMap = {
//       'en_carga': 'En Carga',
//       'en_ruta': 'En Ruta',
//       'completada': 'Completada',
//       'cancelada': 'Cancelada'
//     };
//     return statusMap[estado] || estado;
//   };

//   const getStatusClass = (estado) => {
//     const classMap = {
//       'en_carga': 'transito',
//       'en_ruta': 'transito',
//       'completada': 'normal',
//       'cancelada': 'alerta'
//     };
//     return classMap[estado] || 'normal';
//   };

//   return (
//     <span
//       className={`dashboard-status dashboard-status-${getStatusClass(status)}`}
//     >
//       {getStatusText(status)}
//     </span>
//   );
// };

// // Componente Table
// const Table = ({ headers, rows }) => {
//   return (
//     <div className="dashboard-table-container">
//       <table className="dashboard-table">
//         <thead>
//           <tr>
//             {headers.map((header, index) => (
//               <th key={index}>{header}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((row, rowIndex) => (
//             <tr key={rowIndex}>
//               {row.map((cell, cellIndex) => (
//                 <td key={cellIndex}>{cell}</td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// // Componente KPI mejorado con diseño 3D
// const KPIItem = ({ value, label, status }) => {
//   const [isHovered, setIsHovered] = useState(false);

//   const statusConfig = {
//     good: {
//       gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//       icon: '✓',
//       glow: '0 8px 32px rgba(102, 126, 234, 0.4)',
//       glowHover: '0 12px 40px rgba(102, 126, 234, 0.6)'
//     },
//     warning: {
//       gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
//       icon: '⚠',
//       glow: '0 8px 32px rgba(245, 87, 108, 0.4)',
//       glowHover: '0 12px 40px rgba(245, 87, 108, 0.6)'
//     },
//     bad: {
//       gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
//       icon: '⚡',
//       glow: '0 8px 32px rgba(250, 112, 154, 0.4)',
//       glowHover: '0 12px 40px rgba(250, 112, 154, 0.6)'
//     }
//   };

//   const config = statusConfig[status] || statusConfig.good;

//   return (
//     <div 
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//       style={{
//         background: config.gradient,
//         borderRadius: '20px',
//         padding: '30px 20px',
//         textAlign: 'center',
//         position: 'relative',
//         overflow: 'hidden',
//         boxShadow: isHovered ? config.glowHover : config.glow,
//         transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
//         transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
//         cursor: 'pointer',
//         color: 'white'
//       }}
//     >
//       {/* Efecto de brillo animado */}
//       <div style={{
//         position: 'absolute',
//         top: '-50%',
//         left: '-50%',
//         width: '200%',
//         height: '200%',
//         background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
//         animation: 'pulse 3s ease-in-out infinite',
//         pointerEvents: 'none'
//       }} />

//       {/* Decoración geométrica */}
//       <div style={{
//         position: 'absolute',
//         top: '10px',
//         right: '10px',
//         width: '60px',
//         height: '60px',
//         borderRadius: '50%',
//         background: 'rgba(255, 255, 255, 0.1)',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         fontSize: '28px',
//         backdropFilter: 'blur(10px)'
//       }}>
//         {config.icon}
//       </div>

//       {/* Valor */}
//       <div style={{
//         fontSize: '42px',
//         fontWeight: 'bold',
//         marginBottom: '12px',
//         position: 'relative',
//         zIndex: 1,
//         textShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         letterSpacing: '-1px'
//       }}>
//         {value}
//       </div>

//       {/* Label */}
//       <div style={{
//         fontSize: '14px',
//         fontWeight: '600',
//         opacity: 0.95,
//         position: 'relative',
//         zIndex: 1,
//         textTransform: 'uppercase',
//         letterSpacing: '1px',
//         textShadow: '0 2px 4px rgba(0,0,0,0.2)'
//       }}>
//         {label}
//       </div>

//       {/* Barra decorativa inferior */}
//       <div style={{
//         position: 'absolute',
//         bottom: '0',
//         left: '0',
//         width: '100%',
//         height: '4px',
//         background: 'rgba(255, 255, 255, 0.3)',
//         transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
//         transformOrigin: 'left',
//         transition: 'transform 0.4s ease'
//       }} />

//       <style>
//         {`
//           @keyframes pulse {
//             0%, 100% {
//               transform: translate(0, 0) scale(1);
//               opacity: 0.3;
//             }
//             50% {
//               transform: translate(-10%, -10%) scale(1.1);
//               opacity: 0.1;
//             }
//           }
//         `}
//       </style>
//     </div>
//   );
// };

// // Componente Alert
// const Alert = ({ title, description }) => {
//   return (
//     <div className="dashboard-alerta">
//       <i className="fas fa-exclamation-triangle"></i>
//       <div>
//         <strong>{title}</strong>
//         <p>{description}</p>
//       </div>
//     </div>
//   );
// };

// // Componente de gráfico circular para stock
// const GraficoCircular = ({ porcentaje, color, label, cantidad }) => {
//   const radio = 45;
//   const circunferencia = 2 * Math.PI * radio;
//   const offset = circunferencia - (porcentaje / 100) * circunferencia;

//   return (
//     <div className="stock-grafico-circular">
//       <svg width="120" height="120" viewBox="0 0 120 120">
//         <circle
//           className="stock-circulo-fondo"
//           cx="60"
//           cy="60"
//           r={radio}
//           fill="none"
//           stroke="#e0e0e0"
//           strokeWidth="10"
//         />
//         <circle
//           className="stock-circulo-progreso"
//           cx="60"
//           cy="60"
//           r={radio}
//           fill="none"
//           stroke={color}
//           strokeWidth="10"
//           strokeDasharray={circunferencia}
//           strokeDashoffset={offset}
//           strokeLinecap="round"
//           transform="rotate(-90 60 60)"
//           style={{
//             transition: 'stroke-dashoffset 0.5s ease'
//           }}
//         />
//         <text x="60" y="55" className="stock-porcentaje-texto" textAnchor="middle">
//           {porcentaje}%
//         </text>
//         <text x="60" y="72" className="stock-cantidad-texto" textAnchor="middle">
//           {cantidad}
//         </text>
//       </svg>
//       <p className="stock-label-grafico">{label}</p>
//     </div>
//   );
// };

// // ==================== Componente Principal ====================

// const DashboardPrincipal = () => {
//   const [stockData, setStockData] = useState({
//     totales: {
//       total_pallets: 0,
//       total_cajas: 0,
//       peso_total: 0
//     },
//     porEstado: []
//   });

//   const [operacionesActivas, setOperacionesActivas] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Estados disponibles
//   const estadosPallet = ['armado', 'en_camara', 'reservado', 'en_transporte', 'despachado', 'anulado'];

//   // Colores para cada estado
//   const coloresEstado = {
//     armado: '#3498db',
//     en_camara: '#2ecc71',
//     reservado: '#f39c12',
//     en_transporte: '#9b59b6',
//     despachado: '#95a5a6',
//     anulado: '#e74c3c'
//   };

//   // Etiquetas amigables para estados
//   const etiquetasEstado = {
//     armado: 'Armado',
//     en_camara: 'En Cámara',
//     reservado: 'Reservado',
//     en_transporte: 'En Transporte',
//     despachado: 'Despachado',
//     anulado: 'Anulado'
//   };

//   // Función para normalizar respuesta del backend
//   const normalizeResponse = (respData) => {
//     if (!respData && respData !== 0) return [];
//     if (Array.isArray(respData)) return respData;
//     if (respData && Array.isArray(respData.data)) return respData.data;
//     if (respData && Array.isArray(respData.items)) return respData.items;
//     if (respData && Array.isArray(respData.results)) return respData.results;
//     if (respData && Array.isArray(respData.ordenes)) return respData.ordenes;
//     if (typeof respData === "object") {
//       const keys = Object.keys(respData || {});
//       for (let k of keys) {
//         if (Array.isArray(respData[k])) return respData[k];
//       }
//     }
//     return [];
//   };

//   const safeArray = (a) => (Array.isArray(a) ? a : []);

//   // Mapear campos de orden
//   const mapOrderFields = (o) => {
//     const orden_id = o.orden_id ?? o.od_id ?? o.id ?? null;
//     const od_code = o.od_code ?? o.code ?? o.orden_code ?? null;
//     const cliente_nombre = o.cliente_nombre ?? o.cliente ?? o.cliente_name ?? null;
//     const transportista_nombre = o.transportista_nombre ?? o.transportista ?? o.transportista_name ?? null;
//     const patente = o.patente ?? o.patent ?? o.camion_patente ?? o.patent_plate ?? null;

//     return {
//       ...o,
//       orden_id,
//       od_code,
//       cliente_nombre,
//       transportista_nombre,
//       patente
//     };
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         // Cargar stock y operaciones en paralelo
//         const [stockResponse, ordenesResponse] = await Promise.all([
//           stockService.getResumenStock({}),
//           axios.get("/api/ordenes-despacho")
//         ]);
        
//         setStockData(stockResponse);

//         // Procesar operaciones
//         const ordenesRaw = normalizeResponse(ordenesResponse.data);
//         const ordenesArr = safeArray(ordenesRaw).map(mapOrderFields);
        
//         // Filtrar solo operaciones activas (en_carga o en_ruta)
//         const activas = ordenesArr.filter(
//           (o) => o && (o.estado === "en_carga" || o.estado === "en_ruta")
//         );
        
//         setOperacionesActivas(activas);
//       } catch (err) {
//         console.error('Error al cargar datos:', err);
//         setError('Error al cargar los datos');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
    
//     // Actualizar cada 30 segundos
//     const interval = setInterval(fetchData, 30000);
    
//     return () => clearInterval(interval);
//   }, []);

//   // Calcular porcentaje
//   const calcularPorcentaje = (valor, total) => {
//     if (!total || total === 0) return 0;
//     return ((valor / total) * 100).toFixed(1);
//   };

//   // Obtener cantidad de cajas por estado
//   const getCajasPorEstado = (estado) => {
//     const estadoData = stockData.porEstado.find(e => e.estado === estado);
//     return estadoData ? estadoData.cantidad_cajas : 0;
//   };

//   // Obtener cantidad de pallets por estado
//   const getPalletsPorEstado = (estado) => {
//     const estadoData = stockData.porEstado.find(e => e.estado === estado);
//     return estadoData ? estadoData.cantidad_pallets : 0;
//   };

//   const condicionesData = [
//     [
//       "T1A3121430LIM00123K",
//       "Limón",
//       "10.2°C",
//       "67%",
//       <StatusBadge key="c1" status="Normal" />,
//     ],
//     [
//       "T1A3121431LIM00123J",
//       "Limón",
//       "12.5°C",
//       "65%",
//       <StatusBadge key="c2" status="Alerta" />,
//     ],
//     [
//       "T2B3121450ORA00456A",
//       "Naranja",
//       "8.7°C",
//       "70%",
//       <StatusBadge key="c3" status="Normal" />,
//     ],
//   ];

//   // Preparar datos de viajes activos desde operaciones
//   const viajesData = operacionesActivas.slice(0, 5).map((operacion, index) => [
//     operacion.od_code || operacion.orden_id || `#${index + 1}`,
//     operacion.transportista_nombre || "N/A",
//     operacion.cliente_nombre || "N/A",
//     <StatusBadge key={`op-${operacion.orden_id || index}`} status={operacion.estado} />,
//     operacion.patente || "-"
//   ]);

//   return (
//     <>
//       <link
//         rel="stylesheet"
//         href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
//       />

//       <div className="monitoreo-container">
//         <div className="monitoreo-main-content">
//           <div className="monitoreo-header">
//             <h2>
//               <i className="fas fa-tachometer-alt"></i> Dashboard Principal
//             </h2>
//             <div className="monitoreo-user-info">
//               <i className="fas fa-user-circle"></i>
//               <span>Supervisor de Planta</span>
//             </div>
//           </div>

//           {/* Card de Estado de Planta - Ocupa toda la fila */}
//           <div style={{ width: '100%', marginBottom: '20px' }}>
//             <Card
//               title="Estado de Planta"
//               icon="fas fa-warehouse"
//               iconClass="lotes"
//               to="/stock"
//               fullWidth={true}
//             >
//               <p style={{ marginBottom: '20px' }}>
//                 Visualice el estado actual de todo el stock en planta con trazabilidad completa.
//               </p>
              
//               {loading ? (
//                 <div style={{ textAlign: 'center', padding: '20px' }}>
//                   <div className="stock-spinner"></div>
//                   <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
//                     Cargando datos de stock...
//                   </p>
//                 </div>
//               ) : error ? (
//                 <div style={{ textAlign: 'center', padding: '20px', color: '#e74c3c' }}>
//                   <i className="fas fa-exclamation-triangle" style={{ fontSize: '24px' }}></i>
//                   <p style={{ fontSize: '12px', marginTop: '10px' }}>
//                     {error}
//                   </p>
//                 </div>
//               ) : (
//                 <>
//                   {/* Totales generales */}
//                   <div style={{ 
//                     display: 'grid', 
//                     gridTemplateColumns: 'repeat(4, 1fr)', 
//                     gap: '15px',
//                     marginBottom: '30px',
//                     padding: '25px',
//                     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//                     borderRadius: '12px',
//                     color: 'white',
//                     boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
//                   }}>
//                     <div style={{ textAlign: 'center' }}>
//                       <div style={{ fontSize: '13px', opacity: 0.95, marginBottom: '8px', fontWeight: '500' }}>
//                         📦 Total Cajas
//                       </div>
//                       <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1.2' }}>
//                         {stockData.totales.total_cajas.toLocaleString('es-AR')}
//                       </div>
//                     </div>
//                     <div style={{ textAlign: 'center' }}>
//                       <div style={{ fontSize: '13px', opacity: 0.95, marginBottom: '8px', fontWeight: '500' }}>
//                         🚛 Total Pallets
//                       </div>
//                       <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1.2' }}>
//                         {stockData.totales.total_pallets.toLocaleString('es-AR')}
//                       </div>
//                     </div>
//                     <div style={{ textAlign: 'center' }}>
//                       <div style={{ fontSize: '13px', opacity: 0.95, marginBottom: '8px', fontWeight: '500' }}>
//                         ⚖️ Peso Total (kg)
//                       </div>
//                       <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1.2' }}>
//                         {parseFloat(stockData.totales.peso_total).toLocaleString('es-AR', {
//                           minimumFractionDigits: 0,
//                           maximumFractionDigits: 0
//                         })}
//                       </div>
//                     </div>
//                     <div style={{ textAlign: 'center' }}>
//                       <div style={{ fontSize: '13px', opacity: 0.95, marginBottom: '8px', fontWeight: '500' }}>
//                         📊 Promedio Cajas/Pallet
//                       </div>
//                       <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1.2' }}>
//                         {stockData.totales.total_pallets > 0 
//                           ? (stockData.totales.total_cajas / stockData.totales.total_pallets).toFixed(1) 
//                           : '0'}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Gráficos por estado */}
//                   <div style={{ 
//                     display: 'grid', 
//                     gridTemplateColumns: 'repeat(6, 1fr)', 
//                     gap: '15px',
//                     marginTop: '20px'
//                   }}>
//                     {estadosPallet.map(estado => {
//                       const cajas = getCajasPorEstado(estado);
//                       const pallets = getPalletsPorEstado(estado);
//                       const porcentaje = calcularPorcentaje(cajas, stockData.totales.total_cajas);
                      
//                       return (
//                         <div key={estado} style={{ 
//                           textAlign: 'center',
//                           padding: '15px',
//                           background: '#f8f9fa',
//                           borderRadius: '10px',
//                           border: `2px solid ${coloresEstado[estado]}20`
//                         }}>
//                           <GraficoCircular
//                             porcentaje={porcentaje}
//                             color={coloresEstado[estado]}
//                             label={etiquetasEstado[estado]}
//                             cantidad={cajas.toLocaleString('es-AR')}
//                           />
//                           <div style={{ 
//                             marginTop: '10px', 
//                             fontSize: '11px', 
//                             color: '#666',
//                             borderTop: `2px solid ${coloresEstado[estado]}`,
//                             paddingTop: '8px'
//                           }}>
//                             <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
//                               {pallets} Pallets
//                             </div>
//                             <div>
//                               {pallets > 0 ? (cajas / pallets).toFixed(1) : '0'} cajas/pallet
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </>
//               )}
//             </Card>
//           </div>

//           {/* Card de KPIs - Debajo, ocupa toda la fila */}
//           <div style={{ width: '100%', marginBottom: '20px' }}>
//             <Card
//               title="Dashboard de KPIs"
//               icon="fas fa-chart-line"
//               iconClass="kpis"
//               fullWidth={true}
//             >
//               <p style={{ marginBottom: '25px' }}>
//                 Métricas clave de calidad y eficiencia con gráficos y comparativas.
//               </p>
//               <div style={{ 
//                 display: 'grid', 
//                 gridTemplateColumns: 'repeat(4, 1fr)', 
//                 gap: '20px',
//                 width: '100%'
//               }}>
//                 <KPIItem value="99.7%" label="Lecturas Correctas" status="good" />
//                 <KPIItem value="1.8%" label="Merma Promedio" status="warning" />
//                 <KPIItem value="$87.3" label="Costo por Caja" status="good" />
//                 <KPIItem value="12" label="Alertas Críticas" status="bad" />
//               </div>
//             </Card>
//           </div>

//           <div className="dashboard-grid">
//             <div className="dashboard-left">
//               <div className="dashboard-info-card">
//                 <h3>Condiciones Actuales</h3>
//                 <Table
//                   headers={[
//                     "ID Caja",
//                     "Producto",
//                     "Temperatura",
//                     "Humedad",
//                     "Estado",
//                   ]}
//                   rows={condicionesData}
//                 />
//               </div>

//               <div className="dashboard-info-card">
//                 <h3>Viajes Activos ({operacionesActivas.length})</h3>
//                 {loading ? (
//                   <div style={{ textAlign: 'center', padding: '20px' }}>
//                     <p style={{ fontSize: '12px', color: '#666' }}>Cargando viajes...</p>
//                   </div>
//                 ) : viajesData.length > 0 ? (
//                   <Table
//                     headers={[
//                       "Orden",
//                       "Transportista",
//                       "Cliente",
//                       "Estado",
//                       "Patente"
//                     ]}
//                     rows={viajesData}
//                   />
//                 ) : (
//                   <div style={{ textAlign: 'center', padding: '20px' }}>
//                     <p style={{ fontSize: '12px', color: '#999' }}>
//                       No hay operaciones activas en este momento
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="dashboard-right">
//               <div className="dashboard-info-card">
//                 <h3>Alertas Activas</h3>
//                 <div className="dashboard-alertas-container">
//                   <Alert
//                     title="Ruptura de frío detectada"
//                     description="Caja T1A3121431LIM00123J - Temperatura: 12.5°C"
//                   />
//                   <Alert
//                     title="Vibración excesiva"
//                     description="Camión AB 123 CD - Viaje #12"
//                   />
//                 </div>
//               </div>

//               <div className="dashboard-info-card">
//                 <h3>Resumen General</h3>
//                 <div className="dashboard-kpi-container">
//                   <KPIItem
//                     value="96.5%"
//                     label="Puntualidad"
//                     status="good"
//                   />
//                   <KPIItem
//                     value="2.4%"
//                     label="Rupturas de Frío"
//                     status="warning"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default DashboardPrincipal;