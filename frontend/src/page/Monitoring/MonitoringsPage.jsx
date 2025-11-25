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
import "../../style/monitoreo.css";
import { getAllCamaras } from "../CamaraFrio/service/camaraService";

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

// Configuración de productos
const productosConfig = {
  limon: {
    nombre: "Limón",
    planta: "T1",
    linea: "A",
    temperatura: "12–15°C",
    colorClass: "box-limon",
    tempMin: 12,
    tempMax: 15,
  },
  palta: {
    nombre: "Palta",
    planta: "T2",
    linea: "B",
    temperatura: "5–14°C",
    colorClass: "box-palta",
    tempMin: 5,
    tempMax: 14,
  },
  arandano: {
    nombre: "Arándano",
    planta: "T3",
    linea: "C",
    temperatura: "0.5–2°C",
    colorClass: "box-arandano",
    tempMin: 0.5,
    tempMax: 2,
  },
  frutilla: {
    nombre: "Frutilla",
    planta: "T4",
    linea: "D",
    temperatura: "0–1°C",
    colorClass: "box-frutilla",
    tempMin: 0,
    tempMax: 1,
  },
  cana: {
    nombre: "Derivados de Caña",
    planta: "T5",
    linea: "E",
    temperatura: "20–30°C",
    colorClass: "box-cana",
    tempMin: 20,
    tempMax: 30,
  },
};

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

const MetricCard = ({ label, value, sublabel, statusClass = "" }) => {
  return (
    <div className="monitoreo-metric-card">
      <div className="monitoreo-metric-label">{label}</div>
      <div className={`monitoreo-metric-value ${statusClass}`}>{value}</div>
      <div className="monitoreo-metric-sublabel">{sublabel}</div>
    </div>
  );
};

const Conveyor = ({ producto }) => {
  const config = productosConfig[producto];

  const boxes = [
    {
      id: `${config.planta}${config.linea}31218`,
      text: config.nombre,
      delay: "0s",
      colorClass: config.colorClass,
    },
    {
      id: `${config.planta}${config.linea}31217`,
      text: config.nombre,
      delay: "4s",
      colorClass: config.colorClass,
    },
    {
      id: `${config.planta}${config.linea}31216`,
      text: config.nombre,
      delay: "8s",
      colorClass: config.colorClass,
    },
    {
      id: `${config.planta}${config.linea}31215`,
      text: config.nombre,
      delay: "12s",
      colorClass: config.colorClass,
    },
    {
      id: `${config.planta}${config.linea}31214`,
      text: config.nombre,
      delay: "16s",
      colorClass: config.colorClass,
    },
  ];

  return (
    <div className="monitoreo-conveyor-section">
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
      <div className="monitoreo-conveyor-labels">
        <div>
          <i className="fas fa-arrow-left"></i>
          <span>Entrada de cajas</span>
        </div>
        <div>
          <span>Salida a paletizado</span>
          <i className="fas fa-arrow-right"></i>
        </div>
      </div>
    </div>
  );
};

const SensorCard = ({ name, value, range, alert = false, icon }) => {
  return (
    <div className={`monitoreo-sensor-card ${alert ? "alert" : ""}`}>
      <div className="monitoreo-sensor-name">{name}</div>
      <div className="monitoreo-sensor-value">
        {icon ? <i className={icon}></i> : value}
      </div>
      <div className="monitoreo-sensor-range">{range}</div>
    </div>
  );
};

const TemperatureHumidityChart = ({
  temperatureData,
  humidityData,
  labels,
}) => {
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

const ProductProcessingChart = ({ data, productos }) => {
  const chartData = {
    labels: productos.map((p) => productosConfig[p].nombre),
    datasets: [
      {
        label: "Cajas Procesadas",
        data: data,
        backgroundColor: productos.map((p) => {
          const colors = {
            limon: "rgba(139, 195, 74, 0.8)",
            palta: "rgba(76, 175, 80, 0.8)",
            arandano: "rgba(63, 81, 181, 0.8)",
            frutilla: "rgba(244, 67, 54, 0.8)",
            cana: "rgba(121, 85, 72, 0.8)",
          };
          return colors[p];
        }),
        borderColor: productos.map((p) => {
          const colors = {
            limon: "rgb(139, 195, 74)",
            palta: "rgb(76, 175, 80)",
            arandano: "rgb(63, 81, 181)",
            frutilla: "rgb(244, 67, 54)",
            cana: "rgb(121, 85, 72)",
          };
          return colors[p];
        }),
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

const MonitoreoTiempoReal = () => {
  const [productoSeleccionado, setProductoSeleccionado] = useState("limon");
  const [plantaSeleccionada, setPlantaSeleccionada] = useState("T1");
  const [lineaSeleccionada, setLineaSeleccionada] = useState("A");

  // Estado para cámaras
  const [camaras, setCamaras] = useState([]);
  const [camarasLoading, setCamarasLoading] = useState(true);

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

  // Manejar cambio de producto
  const handleProductoChange = (e) => {
    const producto = e.target.value;
    setProductoSeleccionado(producto);
    const config = productosConfig[producto];
    setPlantaSeleccionada(config.planta);
    setLineaSeleccionada(config.linea);

    // Actualizar temperatura según el producto
    const tempPromedio = (config.tempMin + config.tempMax) / 2;
    setMetrics((prev) => ({
      ...prev,
      temperaturaMedia: tempPromedio.toFixed(1) + "°C",
    }));

    // Generar datos de temperatura basados en el rango del producto
    const newTempData = [];
    for (let i = 0; i < 10; i++) {
      const temp =
        config.tempMin + Math.random() * (config.tempMax - config.tempMin);
      newTempData.push(parseFloat(temp.toFixed(1)));
    }
    setTemperatureData(newTempData);
  };

  // Cargar datos de cámaras desde la BD
  useEffect(() => {
    const fetchCamaras = async () => {
      try {
        const response = await getAllCamaras();
        console.log("Raw camera data from API:", response);
        console.log("Camera data array:", response.data);
        setCamaras(response.data || []);
      } catch (error) {
        console.error("Error al cargar datos de cámaras:", error);
        setCamaras([]);
      } finally {
        setCamarasLoading(false);
      }
    };
    fetchCamaras();
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
      const config = productosConfig[productoSeleccionado];
      const newTemp = (
        config.tempMin +
        Math.random() * (config.tempMax - config.tempMin)
      ).toFixed(1);
      const newHum = Math.floor(Math.random() * 5 + 65);

      setMetrics({
        cajasPorMin: Math.floor(Math.random() * 10) + 38,
        pesoPromedio: "15.2 kg",
        temperaturaMedia: newTemp + "°C",
        alertasActivas: Math.floor(Math.random() * 4),
      });

      setTemperatureData((prev) => {
        const newData = [...prev.slice(1), parseFloat(newTemp)];
        return newData;
      });

      setHumidityData((prev) => {
        const newData = [...prev.slice(1), newHum];
        return newData;
      });

      setTimeLabels((prev) => {
        const now = new Date();
        const newLabel = now.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return [...prev.slice(1), newLabel];
      });

      if (Math.random() > 0.7) {
        setProductData([
          Math.floor(Math.random() * 50 + 120),
          Math.floor(Math.random() * 50 + 100),
          Math.floor(Math.random() * 40 + 80),
          Math.floor(Math.random() * 40 + 90),
          Math.floor(Math.random() * 30 + 70),
        ]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [productoSeleccionado]);

  const config = productosConfig[productoSeleccionado];

  const cajasData = [
    [
      `${config.planta}${config.linea}3121430`,
      config.nombre,
      "00123",
      `${config.tempMin + 1}°C`,
      "67%",
      "0.3g",
      <StatusBadge key="c1" status="Normal" />,
      "23:40:12",
    ],
    [
      `${config.planta}${config.linea}3121431`,
      config.nombre,
      "00123",
      `${config.tempMax}°C`,
      "65%",
      "0.4g",
      <StatusBadge key="c2" status="Normal" />,
      "23:41:05",
    ],
    [
      `${config.planta}${config.linea}3121432`,
      config.nombre,
      "00456",
      `${config.tempMin + 0.5}°C`,
      "70%",
      "0.2g",
      <StatusBadge key="c3" status="Normal" />,
      "23:41:22",
    ],
    [
      `${config.planta}${config.linea}3121433`,
      config.nombre,
      "00789",
      `${config.tempMax - 1}°C`,
      "72%",
      "0.8g",
      <StatusBadge key="c4" status="Alerta" />,
      "23:42:15",
    ],
    [
      `${config.planta}${config.linea}3121434`,
      config.nombre,
      "00124",
      `${(config.tempMin + config.tempMax) / 2}°C`,
      "68%",
      "0.3g",
      <StatusBadge key="c5" status="Normal" />,
      "23:42:38",
    ],
  ];

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
              <i className="fas fa-eye"></i> Monitoreo en Tiempo Real
            </h2>
            <div className="monitoreo-user-info">
              <i className="fas fa-user-circle"></i>
              <span>Supervisor de Planta</span>
            </div>
          </div>

          <div className="monitoreo-filtros">
            <div className="monitoreo-filtro-grupo">
              <label htmlFor="planta">Planta:</label>
              <select id="planta" value={plantaSeleccionada} disabled>
                <option value="T1">Planta T1</option>
                <option value="T2">Planta T2</option>
                <option value="T3">Planta T3</option>
                <option value="T4">Planta T4</option>
                <option value="T5">Planta T5</option>
              </select>
            </div>
            <div className="monitoreo-filtro-grupo">
              <label htmlFor="linea">Línea:</label>
              <select id="linea" value={lineaSeleccionada} disabled>
                <option value="A">Línea A</option>
                <option value="B">Línea B</option>
                <option value="C">Línea C</option>
                <option value="D">Línea D</option>
                <option value="E">Línea E</option>
              </select>
            </div>
            <div className="monitoreo-filtro-grupo">
              <label htmlFor="producto">Producto:</label>
              <select
                id="producto"
                value={productoSeleccionado}
                onChange={handleProductoChange}
              >
                <option value="limon">Limón</option>
                <option value="palta">Palta</option>
                <option value="arandano">Arándano</option>
                <option value="frutilla">Frutilla</option>
                <option value="cana">Derivados de Caña</option>
              </select>
            </div>
            <div className="monitoreo-filtro-grupo">
              <label htmlFor="estado">Estado:</label>
              <select id="estado">
                <option>Todos</option>
                <option>Normal</option>
                <option>Alerta</option>
              </select>
            </div>
          </div>

          <div className="monitoreo-metrics-container">
            <MetricCard
              label="Cajas Procesadas/Min"
              value={metrics.cajasPorMin}
              sublabel="+5% vs promedio"
              statusClass="monitoreo-metric-good"
            />
            <MetricCard
              label="Peso Promedio"
              value={metrics.pesoPromedio}
              sublabel="±0.3 kg"
            />
            <MetricCard
              label="Temperatura Media"
              value={metrics.temperaturaMedia}
              sublabel={`Rango: ${config.temperatura}`}
              statusClass="monitoreo-metric-good"
            />
            <MetricCard
              label="Alertas Activas"
              value={metrics.alertasActivas}
              sublabel="Requieren atención"
              statusClass={
                metrics.alertasActivas > 0
                  ? "monitoreo-metric-bad"
                  : "monitoreo-metric-good"
              }
            />
          </div>

          <Conveyor producto={productoSeleccionado} />

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
                productos={["limon", "palta", "arandano", "frutilla", "cana"]}
              />
            </div>
          </div>

          {/* Vista compacta de cámaras - Estilo industrial */}
          <div className="monitoreo-section-title" style={{ marginTop: '2rem' }}>
            <i className="fas fa-warehouse"></i>
            Estado General de Cámaras Frigoríficas
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {camaras.map((camara) => {
              const ocupacionAlta = camara.porcentaje_ocupacion >= 90;
              const ocupacionMedia = camara.porcentaje_ocupacion >= 70 && camara.porcentaje_ocupacion < 90;
              
              return (
                <div
                  key={camara.camara_id}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '1rem',
                    position: 'relative',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Header de la cámara */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      <i className="fas fa-snowflake" style={{ marginRight: '0.5rem', color: '#4FA3D1' }}></i>
                      {camara.nombre}
                    </h3>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#4ade80',
                      boxShadow: '0 0 8px #4ade80',
                      display: 'inline-block'
                    }}></span>
                  </div>

                  {/* Grid de métricas compacto */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      background: 'var(--bg-secondary)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <i className="fas fa-thermometer-half" style={{ marginRight: '0.25rem' }}></i>
                        Temperatura
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {camara.temperatura_aproximada ? `${camara.temperatura_aproximada}°C` : "N/D"}
                      </div>
                    </div>

                    <div style={{
                      background: 'var(--bg-secondary)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <i className="fas fa-tint" style={{ marginRight: '0.25rem' }}></i>
                        Humedad
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {camara.humedad_optima ? `${camara.humedad_optima}%` : "N/D"}
                      </div>
                    </div>

                    <div style={{
                      background: 'var(--bg-secondary)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <i className="fas fa-tachometer-alt" style={{ marginRight: '0.25rem' }}></i>
                        Presión
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {camara.presion_optima ? `${camara.presion_optima} kPa` : "N/D"}
                      </div>
                    </div>

                    <div style={{
                      background: ocupacionAlta ? 'rgba(239, 68, 68, 0.1)' : ocupacionMedia ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-secondary)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: `1px solid ${ocupacionAlta ? '#ef4444' : ocupacionMedia ? '#fbbf24' : 'var(--border-color)'}`
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <i className="fas fa-boxes" style={{ marginRight: '0.25rem' }}></i>
                        Ocupación
                      </div>
                      <div style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '700', 
                        color: ocupacionAlta ? '#ef4444' : ocupacionMedia ? '#fbbf24' : 'var(--text-primary)' 
                      }}>
                        {camara.porcentaje_ocupacion ? `${Math.round(camara.porcentaje_ocupacion)}%` : "0%"}
                      </div>
                    </div>
                  </div>

                  {/* Barra de capacidad */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.25rem'
                    }}>
                      <span>Capacidad</span>
                      <span>{camara.pallets_en_uso || 0} / {camara.capacidad_pallets || 0} pallets</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(camara.porcentaje_ocupacion || 0, 100)}%`,
                        height: '100%',
                        background: ocupacionAlta ? '#ef4444' : ocupacionMedia ? '#fbbf24' : '#4ade80',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  {/* Footer con ubicación */}
                  {camara.ubicacion && (
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <i className="fas fa-map-marker-alt" style={{ marginRight: '0.25rem' }}></i>
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
            <Alert
              title="Ruptura de frío detectada"
              description={`Caja ${config.planta}${
                config.linea
              }3121431 - Temperatura actual: ${config.tempMax + 2}°C (Límite: ${
                config.tempMax
              }°C)`}
              timestamp="Hace 2 min"
            />
            <Alert
              title="Vibración excesiva en cinta"
              description={`Línea ${config.linea} - Sector 3 - Valor: 0.8g (Límite: 0.5g)`}
              timestamp="Hace 5 min"
            />
            <Alert
              title="Falla en lectura de etiqueta"
              description={`Caja ${config.planta}${config.linea}3121450 - Reintentos: 3/3`}
              timestamp="Hace 8 min"
            />
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
