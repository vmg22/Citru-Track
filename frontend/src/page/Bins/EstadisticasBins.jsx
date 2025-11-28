import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, PolarArea } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EstadisticasBins = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    porProducto: [],
    porProductor: [],
    totalBins: 0,
  });

  const API_URL = "http://localhost:4000/api/binlote/estadisticas";

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_URL);
      const result = await response.json();

      if (result.success) {
        // ✅ Convertir peso_total a número
        const dataProcesada = {
          porProducto: result.data.porProducto.map((p) => ({
            ...p,
            total_bins: parseInt(p.total_bins) || 0,
            porcentaje: parseFloat(p.porcentaje) || 0,
            peso_total: parseFloat(p.peso_total) || 0,
          })),
          porProductor: result.data.porProductor.map((p) => ({
            ...p,
            total_bins: parseInt(p.total_bins) || 0,
            porcentaje: parseFloat(p.porcentaje) || 0,
            peso_total: parseFloat(p.peso_total) || 0,
          })),
          totalBins: parseInt(result.data.totalBins) || 0,
        };

        setStats(dataProcesada);
      } else {
        setError("Error al cargar estadísticas");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  // Colores para las gráficas
  const coloresProductos = [
    "rgba(255, 99, 132, 0.8)",
    "rgba(54, 162, 235, 0.8)",
    "rgba(255, 206, 86, 0.8)",
    "rgba(75, 192, 192, 0.8)",
    "rgba(153, 102, 255, 0.8)",
    "rgba(255, 159, 64, 0.8)",
    "rgba(199, 199, 199, 0.8)",
    "rgba(83, 102, 255, 0.8)",
    "rgba(255, 99, 255, 0.8)",
    "rgba(99, 255, 132, 0.8)",
  ];

  const coloresProductores = [
    "rgba(34, 202, 236, 0.8)",
    "rgba(72, 149, 239, 0.8)",
    "rgba(106, 90, 205, 0.8)",
    "rgba(255, 107, 107, 0.8)",
    "rgba(255, 195, 0, 0.8)",
    "rgba(46, 213, 115, 0.8)",
    "rgba(255, 121, 63, 0.8)",
    "rgba(224, 86, 253, 0.8)",
  ];

  // Configuración Gráfica Polar (Radial) - POR PRODUCTO
  const dataPolarProductos = {
    labels: stats.porProducto.map((p) => p.producto_nombre),
    datasets: [
      {
        label: "Cantidad de Bins",
        data: stats.porProducto.map((p) => p.total_bins),
        backgroundColor: coloresProductos.slice(0, stats.porProducto.length),
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const optionsPolar = {
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
              text: `${label} (${stats.porProducto[i].porcentaje}%)`,
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
            const producto = stats.porProducto[idx];
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
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: "easeInOutQuart",
    },
  };

  // Configuración Gráfica de Barras 3D - POR PRODUCTOR
  const dataBarrasProductores = {
    labels: stats.porProductor.map((p) => p.productor_nombre),
    datasets: [
      {
        label: "Cantidad de Bins",
        data: stats.porProductor.map((p) => p.total_bins),
        backgroundColor: coloresProductores.slice(0, stats.porProductor.length),
        borderColor: coloresProductores.map((c) => c.replace("0.8", "1")),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const optionsBarras = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const idx = context.dataIndex;
            const productor = stats.porProductor[idx];
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
    animation: {
      duration: 2000,
      easing: "easeInOutElastic",
      delay: (context) => context.dataIndex * 100,
    },
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center", color: "white" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "4px solid rgba(255,255,255,0.3)",
              borderTop: "4px solid white",
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <p style={{ fontSize: "18px", fontWeight: "500" }}>
            Cargando estadísticas...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          background: "#fee2e2",
          borderRadius: "12px",
          border: "2px solid #f87171",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "15px" }}>⚠️</div>
        <h3
          style={{ color: "#991b1b", marginBottom: "10px", fontSize: "20px" }}
        >
          Error de Conexión
        </h3>
        <p style={{ color: "#7f1d1d", marginBottom: "20px" }}>{error}</p>
        <button
          onClick={fetchEstadisticas}
          style={{
            padding: "12px 24px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s",
          }}
          onMouseOver={(e) => (e.target.style.background = "#b91c1c")}
          onMouseOut={(e) => (e.target.style.background = "#dc2626")}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ padding: "20px", background: "#f9fafb", borderRadius: "12px" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "10px",
          }}
        >
          📊 Estadísticas de Bins
        </h1>
        <p style={{ fontSize: "18px", color: "#4b5563" }}>
          Total de Bins Registrados:{" "}
          <span style={{ fontWeight: "bold", color: "#4f46e5" }}>
            {stats.totalBins}
          </span>
        </p>
        <button
          onClick={fetchEstadisticas}
          style={{
            marginTop: "15px",
            padding: "10px 20px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#4338ca";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#4f46e5";
            e.target.style.transform = "translateY(0)";
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Gráficas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
          gap: "30px",
          marginBottom: "30px",
        }}
      >
        {/* Gráfica Radial - Productos */}
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            transition: "all 0.3s",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "20px",
            }}
          >
            🥑 Distribución por Producto
          </h2>
          <div style={{ height: "400px", position: "relative" }}>
            <PolarArea data={dataPolarProductos} options={optionsPolar} />
          </div>
        </div>

        {/* Gráfica de Barras 3D - Productores */}
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            transition: "all 0.3s",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "20px",
            }}
          >
            👨‍🌾 Distribución por Productor
          </h2>
          <div style={{ height: "400px", position: "relative" }}>
            <Bar data={dataBarrasProductores} options={optionsBarras} />
          </div>
        </div>
      </div>

      {/* Tablas de Detalle */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "30px",
        }}
      >
        {/* Tabla Productos */}
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "15px",
            }}
          >
            📋 Detalle por Producto
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                fontSize: "14px",
                borderCollapse: "collapse",
              }}
            >
              <thead style={{ background: "#eef2ff" }}>
                <tr>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      color: "#374151",
                    }}
                  >
                    Producto
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "#374151",
                    }}
                  >
                    Bins
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "#374151",
                    }}
                  >
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.porProducto.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: "500",
                        color: "#1f2937",
                      }}
                    >
                      {p.producto_nombre}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        color: "#4b5563",
                      }}
                    >
                      {p.total_bins}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          background: "#dbeafe",
                          color: "#1e40af",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {p.porcentaje}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Productores */}
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "15px",
            }}
          >
            📋 Detalle por Productor
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                fontSize: "14px",
                borderCollapse: "collapse",
              }}
            >
              <thead style={{ background: "#ecfccb" }}>
                <tr>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      color: "#374151",
                    }}
                  >
                    Productor
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "#374151",
                    }}
                  >
                    Bins
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "#374151",
                    }}
                  >
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.porProductor.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: "500",
                        color: "#1f2937",
                      }}
                    >
                      {p.productor_nombre}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        color: "#4b5563",
                      }}
                    >
                      {p.total_bins}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          background: "#dcfce7",
                          color: "#166534",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {p.porcentaje}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasBins;
