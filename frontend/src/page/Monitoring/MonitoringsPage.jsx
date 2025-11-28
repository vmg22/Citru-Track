import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { io } from "socket.io-client";
import "../../style/monitoreo.css";
import QRCameraScanner from "./components/QRCameraScanner";
import { getAllProductosActivos } from "../Settings/services/settingsServices";
import { getAllCamaras } from "../CamaraFrio/service/camaraService";
import axios from "axios"

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- Componentes Auxiliares (omitiendo la definición de StatusBadge, Alert, Table, Charts, Conveyor para brevedad, ya que son idénticos a tu código) ---

// ... (Definiciones de StatusBadge, Alert, Table, Conveyor, TemperatureHumidityChart, ProductProcessingChart) ...

// Nota: El componente Conveyor ahora incluye el filtro de producto en su interior.

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`monitoreo-status monitoreo-status-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
};

const Alert = ({ title, description, timestamp }) => {
  return (
    <div className="monitoreo-alerta">
      <i className="fas fa-exclamation-triangle"></i>
      <div className="monitoreo-alerta-info">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {timestamp && (
        <div className="monitoreo-alerta-timestamp">{timestamp}</div>
      )}
    </div>
  );
};

const Table = ({ headers, rows }) => {
  return (
    <div className="monitoreo-table-container">
      <table className="monitoreo-table">
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

const Conveyor = ({
  producto,
  onProductoChange,
  productosArray = [],
  productosConfigDB = {},
  cajasActivas = [],
  config,
}) => {
  if (!config)
    return (
      <div className="monitoreo-conveyor-section">
        Cargando configuración de cinta...
      </div>
    );

  const cajasEstaticas = [
    {
      id: `${config.planta}${config.linea}31218`,
      text: config.nombre,
      delay: "0s",
      colorClass: config.colorClass,
      estatica: true,
    },
    {
      id: `${config.planta}${config.linea}31217`,
      text: config.nombre,
      delay: "4s",
      colorClass: config.colorClass,
      estatica: true,
    },
    {
      id: `${config.planta}${config.linea}31216`,
      text: config.nombre,
      delay: "8s",
      colorClass: config.colorClass,
      estatica: true,
    },
  ];

  const cajasDinamicas = cajasActivas
    .filter((caja) => caja.linea === config.linea)
    .map((caja, index) => ({
      id: caja.codigo_qr || caja.id,
      text: caja.producto_nombre || config.nombre,
      delay: `${(index + cajasEstaticas.length) * 4}s`,
      colorClass: config.colorClass,
      dinamica: true,
    }));

  const boxes = [...cajasEstaticas, ...cajasDinamicas];

  return (
    <div className="monitoreo-conveyor-section">
      {/* Select de producto integrado (mantenerlo para que se vea antes de la cinta) */}
      <div className="monitoreo-filtros">
        <div className="monitoreo-filtro-grupo">
          <label htmlFor="producto">Producto:</label>
          <select
            id="producto"
            value={producto}
            onChange={onProductoChange}
            disabled={productosArray.length === 0}
          >
            {productosArray.length > 0 ? (
              productosArray.map((key) => (
                <option key={key} value={key}>
                  {productosConfigDB[key]?.nombre || key}
                </option>
              ))
            ) : (
              <option value="" disabled>
                Cargando productos...
              </option>
            )}
          </select>
        </div>
      </div>

      <div className="monitoreo-section-title">
        <i className="fas fa-conveyor-belt"></i>
        Vista de Cinta Transportadora - Línea {config.linea}
      </div>
      <div className="monitoreo-conveyor-container">
        <div className="monitoreo-conveyor-belt"></div>
        {boxes.map((box) => (
          <div
            key={box.id}
            className={`monitoreo-box ${box.colorClass}`}
            style={{ animationDelay: box.delay }}
          >
            <div>{box.id}</div>
            <div className="monitoreo-box-product">{box.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TemperatureHumidityChart = ({
  temperatureData,
  humidityData,
  labels,
}) => {
  // ... (Lógica de gráficos) ...
  const data = {
    labels: labels,
    datasets: [
      {
        label: "Temperatura (°C)",
        data: temperatureData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        tension: 0.4,
        fill: true,
        yAxisID: "y",
      },
      {
        label: "Humedad (%)",
        data: humidityData,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        tension: 0.4,
        fill: true,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Temperatura (°C)",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Humedad (%)",
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="monitoreo-chart-container">
      <Line data={data} options={options} />
    </div>
  );
};

const ProductProcessingChart = ({ data, productos, productosConfig }) => {
  // Colores codificados
  const getColor = (key) => {
    const colors = {
      limon: "rgba(139, 195, 74, 0.8)",
      palta: "rgba(76, 175, 80, 0.8)",
      arandano: "rgba(63, 81, 181, 0.8)",
      frutilla: "rgba(244, 67, 54, 0.8)",
      cana: "rgba(121, 85, 72, 0.8)",
      default: "rgba(150, 150, 150, 0.8)",
    };
    return colors[key] || colors.default;
  };

  const getBorderColor = (key) => {
    const colors = {
      limon: "rgb(139, 195, 74)",
      palta: "rgb(76, 175, 80)",
      arandano: "rgb(63, 81, 181)",
      frutilla: "rgb(244, 67, 54)",
      cana: "rgb(121, 85, 72)",
      default: "rgb(150, 150, 150)",
    };
    return colors[key] || colors.default;
  };

  const chartData = {
    labels: productos.map((p) => productosConfig[p]?.nombre || p),
    datasets: [
      {
        label: "Cajas Procesadas",
        data: data,
        backgroundColor: productos.map((p) => getColor(p)),
        borderColor: productos.map((p) => getBorderColor(p)),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Cantidad de Cajas",
        },
      },
    },
  };

  return (
    <div className="monitoreo-chart-container">
      <Bar data={chartData} options={options} />
    </div>
  );
};

// --- Componente Principal ---

const MonitoreoTiempoReal = () => {
  // --- NUEVOS ESTADOS PARA ESCANEO ---
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [lastScannedData, setLastScannedData] = useState(null);
  const [scannedHistory, setScannedHistory] = useState([]);

  // --- ESTADOS DINÁMICOS DE BACKEND ---
  const [productosConfigDB, setProductosConfigDB] = useState({});
  const [productosArray, setProductosArray] = useState([]);
  const [camaras, setCamaras] = useState([]);
  const [camarasLoading, setCamarasLoading] = useState(true);

  // --- ESTADOS DE CONTROL ---
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [plantaSeleccionada, setPlantaSeleccionada] = useState("");
  const [lineaSeleccionada, setLineaSeleccionada] = useState("");
  const [cajasActivas, setCajasActivas] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  // --- ESTADOS DE MÉTRICAS Y GRÁFICOS (Simulados) ---
  const [metrics, setMetrics] = useState({
    cajasPorMin: 42,
    pesoPromedio: "15.2 kg",
    temperaturaMedia: "13.5°C",
    alertasActivas: 3,
  });

  const [temperatureData, setTemperatureData] = useState([
    12.5, 12.7, 12.9, 13.1, 12.8, 12.6, 13.0, 13.2, 13.5, 13.3,
  ]);
  const [humidityData, setHumidityData] = useState([
    65, 66, 67, 68, 67, 66, 68, 69, 68, 67,
  ]);
  const [productData, setProductData] = useState([145, 128, 98, 112, 89]);
  const [timeLabels, setTimeLabels] = useState([]);

  // Función para mapear la respuesta de la API
  const mapProductosFromAPI = (data) => {
    const configMap = {};
    const keys = [];

    data.forEach((p) => {
      const key = p.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s/g, "");

      configMap[key] = {
        nombre: p.nombre,
        planta: p.planta_id || "T1",
        linea: p.linea_produccion || "A",
        temperatura: `${p.temp_min}°C – ${p.temp_max}°C`,
        colorClass: `box-${key}`,
        tempMin: p.temp_min || 0,
        tempMax: p.temp_max || 0,
        id: p.producto_id,
      };
      keys.push(key);
    });

    setProductosConfigDB(configMap);
    setProductosArray(keys);

    if (keys.length > 0) {
      const firstKey = keys[0];
      const firstConfig = configMap[firstKey];
      setProductoSeleccionado(firstKey);
      setPlantaSeleccionada(firstConfig.planta);
      setLineaSeleccionada(firstConfig.linea);

      const tempPromedio = (firstConfig.tempMin + firstConfig.tempMax) / 2;
      setMetrics((prev) => ({
        ...prev,
        temperaturaMedia: tempPromedio.toFixed(1) + "°C",
      }));

      const newTempData = [];
      for (let i = 0; i < 10; i++) {
        const temp =
          firstConfig.tempMin +
          Math.random() * (firstConfig.tempMax - firstConfig.tempMin);
        newTempData.push(parseFloat(temp.toFixed(1)));
      }
      setTemperatureData(newTempData);
    }
  };

  // Manejar cambio de producto
  const handleProductoChange = (e) => {
    const producto = e.target.value;
    setProductoSeleccionado(producto);
    const config = productosConfigDB[producto];

    if (!config) return;

    setPlantaSeleccionada(config.planta);
    setLineaSeleccionada(config.linea);

    const tempPromedio = (config.tempMin + config.tempMax) / 2;
    setMetrics((prev) => ({
      ...prev,
      temperaturaMedia: tempPromedio.toFixed(1) + "°C",
    }));

    const newTempData = [];
    for (let i = 0; i < 10; i++) {
      const temp =
        config.tempMin + Math.random() * (config.tempMax - config.tempMin);
      newTempData.push(parseFloat(temp.toFixed(1)));
    }
    setTemperatureData(newTempData);
  };



  // --- EFECTOS (Carga Inicial, Socket.io, Simulación) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const productResponse = await getAllProductosActivos();
        mapProductosFromAPI(productResponse || []);
      } catch (error) {
        console.error("Error al cargar datos de productos:", error);
      }

      try {
        const cameraResponse = await getAllCamaras();
        setCamaras(cameraResponse.data || []);
      } catch (error) {
        console.error("Error al cargar datos de cámaras:", error);
        setCamaras([]);
      } finally {
        setCamarasLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const socket = io(API_URL);
    // ... (Lógica de socket.io) ...
    // ... (Tu código de socket) ...
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    const labels = [];
    for (let i = 9; i >= 0; i--) {
      const time = new Date(now - i * 60000);
      labels.push(
        time.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
      );
    }
    setTimeLabels(labels);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!productoSeleccionado || !productosConfigDB[productoSeleccionado])
        return;
      // ... (Tu código de simulación) ...
    }, 10000);

    return () => clearInterval(interval);
  }, [productoSeleccionado, productosConfigDB]);

  const config = productosConfigDB[productoSeleccionado] || {
    nombre: "Cargando...",
    tempMin: 0,
    tempMax: 0,
    planta: "N/A",
    linea: "N/A",
  };

  // Datos para la tabla (usa 'config')
  const cajasData = [
    // ... (Tu array cajasData simulado) ...
  ];

  // --- RENDERIZADO PRINCIPAL ---

  const handleCajaDetectada = async (decodedText) => {
        console.log("QR decodificado:", decodedText);
        
        let cajaData = { codigo_qr: decodedText, linea: lineaSeleccionada, producto_id: productoSeleccionado };
        let displayCode = decodedText;

        // Intentar parsear el código QR como JSON
        try {
            const parsedData = JSON.parse(decodedText);
            if (parsedData.caja_id) {
                cajaData = parsedData; // Usar el objeto completo
                displayCode = parsedData.caja_id;
            }
        } catch (e) {
            // Si no es JSON, sigue con el código simple
        }

        // 1. Almacenar el último dato escaneado (como JSON string para visualizar)
        const dataString = JSON.stringify(cajaData, null, 2);
        setLastScannedData(dataString);

        // 2. Agregar al historial
        setScannedHistory(prev => {
            const now = new Date();
            const newEntry = {
                id: displayCode,
                data: dataString,
                time: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
            return [newEntry, ...prev.slice(0, 4)]; // Mantener los últimos 5
        });

        // 3. ENVIAR AL BACKEND (Lógica que estaba en QRCameraScanner)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await axios.post(`${API_URL}/api/cajas/ingresar`, cajaData);

            if (response.data.success) {
                // Puedes agregar feedback visual aquí si lo deseas
                console.log("Caja registrada con éxito:", response.data.caja);
            }
        } catch (error) {
            console.error('Error al registrar la caja:', error);
            // Mostrar error al usuario
            alert(`Error al registrar: ${error.response?.data?.message || error.message}`);
        }
    };
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      <div className="monitoreo-container">
        <div className="monitoreo-main-content">
          <div className="stock-header">
            <h1 className="stock-title">
              <i className="fas fa-eye"></i> Monitoreo en Tiempo Real
            </h1>
            <div className="monitoreo-user-info">
              <i className="fas fa-user-circle"></i>
              <span>Supervisor de Planta</span>
            </div>
          </div>

          {/* --- NUEVO DIV DE CONTROL SUPERIOR (Contenedor del Botón de Escaneo y Filtros) --- */}
          <div
            className="monitoreo-top-controls"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              paddingRight: isScannerActive ? "20px" : "0",
            }}
          >
            {/* El Conveyor ahora tiene sus filtros internos, lo dejo aquí para que la estructura sea limpia */}
            <div style={{ flex: 1, minWidth: "200px" }}>
              {/* Nota: El Conveyor aún tiene el filtro de producto, si no lo quieres duplicado, quítalo del Conveyor y muévelo aquí. */}
            </div>

            {/* Botón de Escaneo QR (siempre visible) */}
            <button
              className={`monitoreo-btn-scan ${
                isScannerActive ? "active" : ""
              }`}
              onClick={() => setIsScannerActive((prev) => !prev)}
              style={{
                background: isScannerActive ? "#ef4444" : "#10b981",
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <i className="fas fa-qrcode"></i>
              {isScannerActive ? "Ocultar Escáner" : "Iniciar Escaneo QR"}
            </button>
          </div>

          {/* --- SECCIÓN DE ESCANEO QR Y DATOS (Debajo del Botón, Arriba de Gráficos) --- */}
          {isScannerActive && (
    <div className="monitoreo-scanner-area" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        marginBottom: '2rem',
        border: '1px solid #ddd',
        padding: '15px',
        borderRadius: '8px',
        background: '#f9f9f9'
    }}>
        {/* 1. Visor de la Cámara (INLINE) */}
        <div className="monitoreo-camera-viewer">
            {/* Aquí se integra el componente simple, sin su propio contenedor flotante */}
            <QRCameraScanner
                // El prop isVisible es importante para que el QRScanner sepa si debe iniciar/detener la cámara
                isVisible={isScannerActive} 
                lineaActual={lineaSeleccionada}
                productoActual={productoSeleccionado}
                onCajaDetectada={handleCajaDetectada} 
            />
        </div>

        {/* 2. Datos y Historial Escaneado (Ahora en MonitoreoTiempoReal) */}
        <div className="monitoreo-scanned-data">
            <div className="monitoreo-section-title" style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <i className="fas fa-clipboard-list"></i>
                Resultado del Escaneo
            </div>
            
            <h4 style={{ color: '#065f46', marginBottom: '10px' }}>Último QR Escaneado:</h4>
            <pre style={{ 
                background: '#e6fffa', 
                padding: '10px', 
                borderRadius: '5px', 
                whiteSpace: 'pre-wrap', 
                fontSize: '0.85rem',
                borderLeft: '4px solid #10b981'
            }}>
                {lastScannedData || 'Esperando lectura...'}
            </pre>

            <h4 style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>Historial (Últimos {scannedHistory.length}):</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {scannedHistory.map((item, index) => (
                    <li key={index} style={{ 
                        padding: '5px 0', 
                        borderBottom: '1px dotted #eee', 
                        fontSize: '0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <strong>{item.id}</strong>
                        <span style={{ color: '#666' }}>{item.time}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
)}
          {/* --- FIN SECCIÓN DE ESCANEO --- */}

          <Conveyor
            producto={productoSeleccionado}
            onProductoChange={handleProductoChange}
            productosArray={productosArray}
            productosConfigDB={productosConfigDB}
            cajasActivas={cajasActivas}
            config={config}
          />
          <div className="monitoreo-panels-container">
            <div className="monitoreo-panel">
              <div className="monitoreo-section-title">
                <i className="fas fa-chart-line"></i>
                Temperatura y Humedad - Últimos 10 Minutos
              </div>
              <TemperatureHumidityChart
                temperatureData={temperatureData}
                humidityData={humidityData}
                labels={timeLabels}
              />
            </div>

            <div className="monitoreo-panel">
              <div className="monitoreo-section-title">
                <i className="fas fa-chart-bar"></i>
                Productos Procesados Hoy
              </div>
              <ProductProcessingChart
                data={productData}
                productos={productosArray}
                productosConfig={productosConfigDB}
              />
            </div>
          </div>

          {/* Vista compacta de cámaras - Estilo industrial */}
          <div
            className="monitoreo-section-title"
            style={{ marginTop: "2rem" }}
          >
            <i className="fas fa-warehouse"></i>
            Estado General de Cámaras Frigoríficas (
            {camarasLoading ? "Cargando..." : camaras.length} detectadas)
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            {camaras.map((camara) => {
              const ocupacionAlta = camara.porcentaje_ocupacion >= 90;
              const ocupacionMedia =
                camara.porcentaje_ocupacion >= 70 &&
                camara.porcentaje_ocupacion < 90;

              // Aseguramos que los estilos en línea se manejen correctamente con valores por defecto
              const tempAproximada =
                camara.temperatura_aproximada !== undefined &&
                camara.temperatura_aproximada !== null
                  ? `${camara.temperatura_aproximada}°C`
                  : "N/D";
              const humedadOptima =
                camara.humedad_optima !== undefined &&
                camara.humedad_optima !== null
                  ? `${camara.humedad_optima}%`
                  : "N/D";
              const presionOptima =
                camara.presion_optima !== undefined &&
                camara.presion_optima !== null
                  ? `${camara.presion_optima} kPa`
                  : "N/D";
              const ocupacion =
                camara.porcentaje_ocupacion !== undefined &&
                camara.porcentaje_ocupacion !== null
                  ? Math.round(camara.porcentaje_ocupacion)
                  : 0;
              const palletsEnUso = camara.pallets_en_uso || 0;
              const capacidadPallets = camara.capacidad_pallets || 0;

              return (
                <div
                  key={camara.camara_id}
                  style={{
                    background: "var(--card-bg, #ffffff)",
                    border: "1px solid var(--border-color, #e0e0e0)",
                    borderRadius: "8px",
                    padding: "1rem",
                    position: "relative",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* Header de la cámara */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.75rem",
                      paddingBottom: "0.5rem",
                      borderBottom: "1px solid var(--border-color, #e0e0e0)",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        color: "var(--text-primary, #333333)",
                      }}
                    >
                      <i
                        className="fas fa-snowflake"
                        style={{ marginRight: "0.5rem", color: "#4FA3D1" }}
                      ></i>
                      {camara.nombre}
                    </h3>
                    {/* Indicador de estado simple */}
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: "#4ade80",
                        boxShadow: "0 0 8px #4ade80",
                        display: "inline-block",
                      }}
                    ></span>
                  </div>

                  {/* Grid de métricas compacto */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {/* Temperatura */}
                    <div
                      style={{
                        background: "var(--bg-secondary, #f9f9f9)",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color, #e0e0e0)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-secondary, #666)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <i
                          className="fas fa-thermometer-half"
                          style={{ marginRight: "0.25rem" }}
                        ></i>
                        Temperatura
                      </div>
                      <div
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: "700",
                          color: "var(--text-primary, #333)",
                        }}
                      >
                        {tempAproximada}
                      </div>
                    </div>

                    {/* Humedad */}
                    <div
                      style={{
                        background: "var(--bg-secondary, #f9f9f9)",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color, #e0e0e0)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-secondary, #666)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <i
                          className="fas fa-tint"
                          style={{ marginRight: "0.25rem" }}
                        ></i>
                        Humedad
                      </div>
                      <div
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: "700",
                          color: "var(--text-primary, #333)",
                        }}
                      >
                        {humedadOptima}
                      </div>
                    </div>

                    {/* Presión */}
                    <div
                      style={{
                        background: "var(--bg-secondary, #f9f9f9)",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color, #e0e0e0)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-secondary, #666)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <i
                          className="fas fa-tachometer-alt"
                          style={{ marginRight: "0.25rem" }}
                        ></i>
                        Presión
                      </div>
                      <div
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: "700",
                          color: "var(--text-primary, #333)",
                        }}
                      >
                        {presionOptima}
                      </div>
                    </div>

                    {/* Ocupación */}
                    <div
                      style={{
                        background: ocupacionAlta
                          ? "rgba(239, 68, 68, 0.1)"
                          : ocupacionMedia
                          ? "rgba(251, 191, 36, 0.1)"
                          : "var(--bg-secondary, #f9f9f9)",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: `1px solid ${
                          ocupacionAlta
                            ? "#ef4444"
                            : ocupacionMedia
                            ? "#fbbf24"
                            : "var(--border-color, #e0e0e0)"
                        }`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-secondary, #666)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <i
                          className="fas fa-boxes"
                          style={{ marginRight: "0.25rem" }}
                        ></i>
                        Ocupación
                      </div>
                      <div
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: "700",
                          color: ocupacionAlta
                            ? "#ef4444"
                            : ocupacionMedia
                            ? "#fbbf24"
                            : "var(--text-primary, #333)",
                        }}
                      >
                        {ocupacion}%
                      </div>
                    </div>
                  </div>

                  {/* Barra de capacidad */}
                  <div style={{ marginBottom: "0.5rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.7rem",
                        color: "var(--text-secondary, #666)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span>Capacidad</span>
                      <span>
                        {palletsEnUso} / {capacidadPallets} pallets
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        background: "var(--bg-secondary, #f1f1f1)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(ocupacion, 100)}%`,
                          height: "100%",
                          background: ocupacionAlta
                            ? "#ef4444"
                            : ocupacionMedia
                            ? "#fbbf24"
                            : "#4ade80",
                          transition: "width 0.3s ease",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Footer con ubicación */}
                  {camara.ubicacion && (
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-secondary, #666)",
                        paddingTop: "0.5rem",
                        borderTop: "1px solid var(--border-color, #e0e0e0)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <i
                        className="fas fa-map-marker-alt"
                        style={{ marginRight: "0.25rem" }}
                      ></i>
                      {camara.ubicacion}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="monitoreo-alertas-container">
            <div className="monitoreo-section-title">
              <i className="fas fa-bell"></i>
              Alertas en Tiempo Real
            </div>
            {/* Las alertas siguen usando la configuración actual 'config' */}
            <Alert
              title="Ruptura de frío detectada"
              description={`Caja ${config.planta}${
                config.linea
              }3121431 - Temperatura actual: ${config.tempMax + 2}°C (Límite: ${
                config.tempMax
              }°C)`}
              timestamp="Hace 2 min"
            />
            {/* ... otras alertas ... */}
          </div>

          <div className="monitoreo-tabla-cajas">
            <div className="monitoreo-section-title">
              <i className="fas fa-box"></i>
              Cajas en Proceso - Tiempo Real
            </div>
            <Table
              headers={[
                "ID Caja",
                "Producto",
                "Lote",
                "Temperatura",
                "Humedad",
                "Vibración",
                "Estado",
                "Última Actualización",
              ]}
              rows={cajasData}
            />
          </div>
        </div>


      </div>
    </>
  );
};

export default MonitoreoTiempoReal;
