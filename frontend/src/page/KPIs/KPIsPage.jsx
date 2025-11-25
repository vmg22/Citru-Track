const API =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import "../../style/kpi.css";
import { getAllProductosActivos } from "../Settings/services/settingsServices";

export default function KpiDashboard() {
  const [productos, setProductos] = useState([]);
  const [producto, setProducto] = useState(null);
  const [filters, setFilters] = useState({ fecha_from: "", fecha_to: "" });

  const [volume, setVolume] = useState(null);
  const [rendimiento, setRendimiento] = useState(null);
  const [empaque, setEmpaque] = useState(null);
  const [camaras, setCamaras] = useState(null); // Mantener como null inicialmente
  const [movimientos, setMovimientos] = useState(null); // Mantener como null inicialmente

  useEffect(() => {
    const getAllProduct = async () => {
      const response = await getAllProductosActivos();
      setProductos(response);
    };
    getAllProduct();
  }, []); 

  useEffect(() => {
    if (producto) {
      setCamaras(null);
      setMovimientos(null);
      const params = { producto_id: producto, ...filters };

      axios
        .get(`${API}/api/kpi/volume`, { params })
        .then((r) => setVolume(r.data))
        .catch(console.error);

      axios
        .get(`${API}/api/kpi/rendimiento`, { params })
        .then((r) => setRendimiento(r.data))
        .catch(console.error);

      axios
        .get(`${API}/api/kpi/empaque`, { params })
        .then((r) => setEmpaque(r.data))
        .catch(console.error);
    } else {
      setVolume(null);
      setRendimiento(null);
      setEmpaque(null);

      const params = { ...filters }; 

      axios
        .get(`${API}/api/kpi/camaras`, { params })
        .then((r) => setCamaras(r.data))
        .catch(console.error);

      axios
        .get(`${API}/api/kpi/movimientos`, { params })
        .then((r) => setMovimientos(r.data))
        .catch(console.error);
    }
  }, [producto, filters]);

    const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR");
  };


  return (
    <div className="kpi-container">
      <div className="monitoreo-header">
        <h2>
          <i className="fas fa-chart-line"></i> KPIs - CitrusTrack
        </h2>
        <div className="monitoreo-user-info">
          <i className="fas fa-user-circle"></i>
          <span>Supervisor de Planta</span>
        </div>
      </div>
      <div>
        <div className="kpi-filtros">
         <label>Producto:</label>
          <select
            value={producto || ""}
            onChange={(e) => setProducto(e.target.value || null)}
          >
          <option value="">Elegir producto</option>
            {productos.map((p) => (
              <option key={p.producto_id} value={p.producto_id}>
              {p.nombre}
              </option>
            ))}
          </select>
          <label>Desde:</label>
          <input
            type="date"
            value={filters.fecha_from}
            onChange={(e) =>
              setFilters((f) => ({ ...f, fecha_from: e.target.value }))
            }
          />
          <label>Hasta:</label>
          <input
            type="date"
            value={filters.fecha_to}
            onChange={(e) =>
              setFilters((f) => ({ ...f, fecha_to: e.target.value }))
            }
          />
        </div>
        {/* Cámaras */}
        {producto === null && camaras && (
          <>
            <h3 style={{ marginTop: 20 }}>Cámaras</h3>

            <div className="kpi-cards">
              <div className="kpi-card blue">
                <h3>Tiempo promedio de productos en cámara</h3>
                <div className="kpi-value">
                  {Math.round(camaras.tiempo_promedio_minutos)} min
                </div>
              </div>
            </div>
            {console.log(camaras)}
            <div className="kpi-graficos">
              <div className="grafico-box">
                <h4>Pallets por estado</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={
                        camaras.porEstado
                          ? camaras.porEstado.map((r) => ({
                              name: r.estado,
                              value: r.cantidad,
                            }))
                          : []
                      }
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label
                    >
                      {(camaras.porEstado || []).map((entry, index) => (
                        <Cell
                          key={index}
                          fill={(() => {
                            switch (entry.estado) {
                              case "armado":
                                return "#007bff";
                              case "despachado":
                                return "#28a745";
                              case "en_camara":
                                return "#0d5661ff";
                              case "reservado":
                                return "#ffc107";
                              case "en_transporte":
                                return "#fd7e14";
                              case "anulado":
                                return "#dc3545";
                              default:
                                return "#6c757d";
                            }
                          })()}
                        />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grafico-box">
                <h4>Pallets por producto en cámara</h4>
                {camaras.palletsPorProducto &&
                camaras.palletsPorProducto.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={camaras.palletsPorProducto.map((r) => ({
                          name: r.producto_nombre,
                          value: Number(r.pallets_en_camara),
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={80}
                        innerRadius={50}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={true}
                      >
                        {camaras.palletsPorProducto.map((entry, index) => {
                          const productName =
                            entry.producto_nombre.toLowerCase();
                          let fillColor;

                          if (productName.includes("palta")) {
                            fillColor = "#28a745"; // Verde para Palta
                          } else if (productName.includes("arándano")) {
                            fillColor = "#6f42c1"; // Morado para Arándanos
                          } else if (productName.includes("limón")) {
                            fillColor = "#ffc107"; // Amarillo para Limón
                          } else if (productName.includes("frutilla")) {
                            fillColor = "#e83e8c"; // Rosado Fuerte para Frutillas
                          } else if (productName.includes("naranja")) {
                            fillColor = "#fd7e14"; // Naranja para Naranjas
                          } else if (productName.includes("toronjas")) {
                            fillColor = "#dc3545"; // Rojo/Coral para Toronjas
                          } else {
                            // Colores de reserva, usando el índice original si no hay coincidencia
                            const defaultColors = [
                              "#17a2b8",
                              "#007bff",
                              "#6610f2",
                              "#6f42c1",
                              "#e83e8c",
                            ];
                            fillColor =
                              defaultColors[index % defaultColors.length];
                          }

                          return (
                            <Cell key={`cell-${index}`} fill={fillColor} />
                          );
                        })}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#666",
                    }}
                  >
                    No hay pallets en cámara en este momento
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {/* Movimientos */}
        {producto === null && movimientos && (
          <>
            <h3 style={{ marginTop: 20 }}>Movimientos pallets</h3>
            <div className="grafico-box">
              <h4>Movimientos por operario</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={
                    movimientos.movPorOperario
                      ? movimientos.movPorOperario.map((r) => ({
                          operario: r.operario,
                          movimientos: r.movimientos,
                        }))
                      : []
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="operario" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="movimientos" fill="#23a92eff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Volume */}
      {volume && (
        <>
          <div className="kpi-cards">
            <div className="kpi-card blue">
              <h3>Kg ingresados (últimos registros)</h3>
              <div className="kpi-value">
                {volume.perDay && volume.perDay.length
                  ? Number(volume.perDay[0].kg_ingresados).toLocaleString()
                  : 0}{" "}
                kg
              </div>
            </div>

            <div className="kpi-card green">
              <h3>Top productores (kg)</h3>
              <div className="kpi-value">
                {volume.byProductor && volume.byProductor.length
                  ? Number(volume.byProductor[0].kg_ingresados).toLocaleString()
                  : 0}{" "}
                kg
              </div>
            </div>

            <div className="kpi-card orange">
              <h3>Top fincas (kg)</h3>
              <div className="kpi-value">
                {volume.byFinca && volume.byFinca.length
                  ? Number(volume.byFinca[0].kg_ingresados).toLocaleString()
                  : 0}{" "}
                kg
              </div>
            </div>
          </div>

          <div className="kpi-graficos">
            <div className="grafico-box">
              <h4>Ingresos por día</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={
                    volume.perDay
                      ? volume.perDay.map((r) => ({
                          fecha: formatDate(r.fecha),
                          kg: Number(r.kg_ingresados),
                        }))
                      : []
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="kg" fill="#007bff" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grafico-box">
              <h4>Kg por productor</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={
                    volume.byProductor
                      ? volume.byProductor.map((r) => ({
                          nombre: r.productor,
                          kg: Number(r.kg_ingresados),
                        }))
                      : []
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="kg" fill="#28a745" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Rendimiento */}
      {rendimiento && (
        <>
          <h3 style={{ marginTop: 20 }}>Rendimiento de lotes</h3>
          {console.log(rendimiento)}
          <div className="kpi-graficos">
            <div className="grafico-box">
              <h4>Descarte por calibre (%)</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={
                    rendimiento.byCalibre
                      ? rendimiento.byCalibre.map((r) => ({
                          calibre: r.calibre,
                          desc_prom: Number(r.desc_prom),
                        }))
                      : []
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="calibre" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="desc_prom" fill="#dc3545" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Empaque */}
      {empaque && (
        <>
          <h3 style={{ marginTop: 20 }}>Eficiencia de empaque</h3>
          <div className="kpi-cards">
            <div className="kpi-card blue">
              <h3>Peso promedio caja</h3>
              <div className="kpi-value">
                {empaque.pesoPromedio
                  ? Number(empaque.pesoPromedio).toFixed(2)
                  : 0}{" "}
                kg
              </div>
            </div>

            <div className="kpi-card orange">
              <h3>Pallets por día (muestra)</h3>
              <div className="kpi-value">
                {empaque.palletsPorDia && empaque.palletsPorDia.length
                  ? empaque.palletsPorDia[0].pallets
                  : 0}
              </div>
            </div>

            <div className="kpi-card green">
              <h3>Cantidad de cajas</h3>
              <div className="kpi-value">
                {empaque.tipoCaja
                  ? empaque.tipoCaja.reduce((a, b) => a + b.cantidad, 0)
                  : 0}
              </div>
            </div>
          </div>

          <div className="kpi-graficos">
            <div className="grafico-box">
              <h4>Empaque de cajas por día</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={
                    empaque.cajasPorOperario
                      ? empaque.cajasPorOperario.map((r) => ({
                          operario: r.operario || "Empaque de cajas",
                          cajas: r.cajas,
                        }))
                      : []
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="operario" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cajas" fill="#007bff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
