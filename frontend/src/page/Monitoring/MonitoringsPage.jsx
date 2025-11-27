import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, PolarArea } from "react-chartjs-2";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts";
import axios from "axios";
import { io } from "socket.io-client";
import "../../style/monitoreo.css";
import "../../style/monitoreo-3d-effects.css"
import { getAllCamaras } from "../CamaraFrio/service/camaraService";
import QRCameraScanner from "./components/QRCameraScanner";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
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

const Conveyor = ({ producto, cajasActivas = [] }) => {
  const config = productosConfig[producto];

  // Combinar cajas estáticas con cajas dinámicas escaneadas
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

  // Filtrar solo las cajas de la línea actual y agregar delay dinámico
  const cajasDinamicas = cajasActivas
    .filter(caja => caja.linea === config.linea)
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

  // Estado para cajas escaneadas dinámicamente
  const [cajasActivas, setCajasActivas] = useState([]);

  // Estado para estadísticas de bins
  const [binStats, setBinStats] = useState({
    porProducto: [],
    porProductor: [],
    totalBins: 0
  });
  const [loadingBins, setLoadingBins] = useState(true);

  const [metrics, setMetrics] = useState({
    cajasPorMin: 42,
    pesoPromedio: "15.2 kg",
    temperaturaMedia: "13.5°C",
    alertasActivas: 3,
  });

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
  };

  // Configurar Socket.io para cajas en tiempo real
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const socket = io(API_URL);

    socket.on('connect', () => {
      console.log('Socket.io conectado para monitoreo de cajas');
    });

    socket.on('disconnect', () => {
      console.log('Socket.io desconectado');
    });

    // Escuchar evento de caja ingresada
    socket.on('caja:ingresada', (data) => {
      console.log('Nueva caja ingresada:', data);
      setCajasActivas(prev => {
        // Evitar duplicados
        const existe = prev.find(c => c.codigo_qr === data.codigo_qr);
        if (existe) return prev;
        
        // Agregar nueva caja
        const nuevasCajas = [data, ...prev];
        // Mantener solo las últimas 10 cajas
        return nuevasCajas.slice(0, 10);
      });
    });

    // Escuchar eventos de bins para actualizar estadísticas
    socket.on('bin:created', () => {
      console.log('Bin creado - actualizando estadísticas');
      fetchBinStats();
    });

    socket.on('bin:updated', () => {
      console.log('Bin actualizado - actualizando estadísticas');
      fetchBinStats();
    });

    socket.on('bin:deleted', () => {
      console.log('Bin eliminado - actualizando estadísticas');
      fetchBinStats();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
      }
    };
    fetchCamaras();
  }, []);

  // Función para cargar estadísticas de bins (extraída para reutilizar)
  const fetchBinStats = async () => {
    try {
      setLoadingBins(true);
      const API_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";
      const response = await axios.get(`${API_URL}/api/binlote/estadisticas`);
      
      if (response.data.success) {
        const dataProcesada = {
          porProducto: response.data.data.porProducto.map((p) => ({
            ...p,
            total_bins: parseInt(p.total_bins) || 0,
            porcentaje: parseFloat(p.porcentaje) || 0,
            peso_total: parseFloat(p.peso_total) || 0,
          })),
          porProductor: response.data.data.porProductor.map((p) => ({
            ...p,
            total_bins: parseInt(p.total_bins) || 0,
            porcentaje: parseFloat(p.porcentaje) || 0,
            peso_total: parseFloat(p.peso_total) || 0,
          })),
          totalBins: parseInt(response.data.data.totalBins) || 0,
        };
        setBinStats(dataProcesada);
      }
    } catch (error) {
      console.error("Error al cargar estadísticas de bins:", error);
    } finally {
      setLoadingBins(false);
    }
  };

  // Cargar estadísticas de bins al montar
  useEffect(() => {
    fetchBinStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const config = productosConfig[productoSeleccionado];
      const newTemp = (
        config.tempMin +
        Math.random() * (config.tempMax - config.tempMin)
      ).toFixed(1);

      setMetrics({
        cajasPorMin: Math.floor(Math.random() * 10) + 38,
        pesoPromedio: "15.2 kg",
        temperaturaMedia: newTemp + "°C",
        alertasActivas: Math.floor(Math.random() * 4),
      });
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

          <Conveyor producto={productoSeleccionado} cajasActivas={cajasActivas} />

          <div className="monitoreo-panels-container">
            <div className="monitoreo-panel">
              <div className="monitoreo-section-title">
                <i className="fas fa-chart-area"></i>
                Bins por Producto (Gráfica Polar)
              </div>
              {loadingBins ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                  Cargando estadísticas de bins...
                </div>
              ) : binStats.porProducto.length > 0 ? (
                <div style={{ height: "350px", padding: "10px" }}>
                  <PolarArea
                    data={{
                      labels: binStats.porProducto.map((p) => p.producto_nombre),
                      datasets: [{
                        label: "Cantidad de Bins",
                        data: binStats.porProducto.map((p) => p.total_bins),
                        backgroundColor: [
                          "rgba(255, 99, 132, 0.8)",
                          "rgba(54, 162, 235, 0.8)",
                          "rgba(255, 206, 86, 0.8)",
                          "rgba(75, 192, 192, 0.8)",
                          "rgba(153, 102, 255, 0.8)",
                          "rgba(255, 159, 64, 0.8)",
                          "rgba(199, 199, 199, 0.8)",
                          "rgba(83, 102, 255, 0.8)",
                        ],
                        borderWidth: 2,
                        borderColor: "#fff",
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "right",
                          labels: {
                            color: "#1f2937",
                            font: { size: 12, weight: "500" },
                            padding: 15,
                            generateLabels: (chart) => {
                              const data = chart.data;
                              return data.labels.map((label, i) => ({
                                text: `${label} (${binStats.porProducto[i].porcentaje}%)`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                hidden: false,
                                index: i,
                              }));
                            },
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const idx = context.dataIndex;
                              const producto = binStats.porProducto[idx];
                              return [
                                `Bins: ${producto.total_bins}`,
                                `Porcentaje: ${producto.porcentaje}%`,
                                `Peso Total: ${producto.peso_total.toFixed(2)} kg`,
                              ];
                            },
                          },
                        },
                      },
                      scales: {
                        r: {
                          ticks: {
                            backdropColor: "transparent",
                            color: "#6b7280",
                            font: { size: 11 },
                          },
                          grid: { color: "rgba(0, 0, 0, 0.1)" },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                  No hay datos de bins por producto
                </div>
              )}
            </div>

            <div className="monitoreo-panel">
              <div className="monitoreo-section-title">
                <i className="fas fa-chart-bar"></i>
                Bins por Productor (Gráfica de Barras 3D)
              </div>
              {loadingBins ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                  Cargando estadísticas de bins...
                </div>
              ) : binStats.porProductor.length > 0 ? (
                <div style={{ height: "350px", padding: "10px" }}>
                  <Bar
                    data={{
                      labels: binStats.porProductor.map((p) => p.productor_nombre),
                      datasets: [{
                        label: "Cantidad de Bins",
                        data: binStats.porProductor.map((p) => p.total_bins),
                        backgroundColor: [
                          "rgba(34, 202, 236, 0.8)",
                          "rgba(72, 149, 239, 0.8)",
                          "rgba(106, 90, 205, 0.8)",
                          "rgba(255, 107, 107, 0.8)",
                          "rgba(255, 195, 0, 0.8)",
                          "rgba(46, 213, 115, 0.8)",
                          "rgba(255, 121, 63, 0.8)",
                          "rgba(224, 86, 253, 0.8)",
                        ],
                        borderColor: [
                          "rgb(34, 202, 236)",
                          "rgb(72, 149, 239)",
                          "rgb(106, 90, 205)",
                          "rgb(255, 107, 107)",
                          "rgb(255, 195, 0)",
                          "rgb(46, 213, 115)",
                          "rgb(255, 121, 63)",
                          "rgb(224, 86, 253)",
                        ],
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const idx = context.dataIndex;
                              const productor = binStats.porProductor[idx];
                              return [
                                `Bins: ${productor.total_bins}`,
                                `Porcentaje: ${productor.porcentaje}%`,
                                `Peso Total: ${productor.peso_total.toFixed(2)} kg`,
                              ];
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            color: "#6b7280",
                            font: { size: 12 },
                          },
                          grid: { color: "rgba(0, 0, 0, 0.05)" },
                        },
                        x: {
                          ticks: {
                            color: "#374151",
                            font: { size: 11, weight: "500" },
                            maxRotation: 45,
                            minRotation: 45,
                          },
                          grid: { display: false },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                  No hay datos de bins por productor
                </div>
              )}
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

        {/* Componente de escaneo QR */}
        <QRCameraScanner
          lineaActual={lineaSeleccionada}
          productoActual={productoSeleccionado}
          onCajaDetectada={(caja) => {
            console.log('Caja detectada desde scanner:', caja);
          }}
        />
      </div>
    </>
  );
};

export default MonitoreoTiempoReal;
