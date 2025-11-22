const API = import.meta.env.VITE_API || "http://localhost:4000";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import "../../style/kpi.css";

export default function KpiDashboard() {
  const [productos, setProductos] = useState([]);
  const [producto, setProducto] = useState(null);
  const [filters, setFilters] = useState({ fecha_from: "", fecha_to: "" });

  const [volume, setVolume] = useState(null);
  const [rendimiento, setRendimiento] = useState(null);
  const [empaque, setEmpaque] = useState(null);
  const [camaras, setCamaras] = useState(null);
  const [movimientos, setMovimientos] = useState(null);
  const [auditoria, setAuditoria] = useState(null);



  // Cargar productos
  useEffect(() => {
    axios.get(`${API}/api/kpi/productos`)
      .then(r => setProductos(r.data))
      .catch(console.error);
  }, []);

  // Cargar KPIs cuando cambia producto o filtros
  useEffect(() => {
    if (!producto) {
      setVolume(null);
      setRendimiento(null);
      setEmpaque(null);
      setCamaras(null);
      setMovimientos(null);
      setAuditoria(null);
      return;
    }

    const params = { producto_id: producto, ...filters };

    axios.get(`${API}/api/kpi/volume`, { params })
      .then(r => setVolume(r.data))
      .catch(console.error);

    axios.get(`${API}/api/kpi/rendimiento`, { params })
      .then(r => setRendimiento(r.data))
      .catch(console.error);

    axios.get(`${API}/api/kpi/empaque`, { params })
      .then(r => setEmpaque(r.data))
      .catch(console.error);

    axios.get(`${API}/api/kpi/camaras`, { params })
      .then(r => setCamaras(r.data))
      .catch(console.error);

    axios.get(`${API}/api/kpi/movimientos`, { params })
      .then(r => setMovimientos(r.data))
      .catch(console.error);

    axios.get(`${API}/api/kpi/auditoria`, { params })
      .then(r => setAuditoria(r.data))
      .catch(console.error);

  }, [producto, filters]);

  return (
    <div className="kpi-container">
      <h2 className="kpi-title">KPIs - CitrusTrack</h2>

      <div className="kpi-filtros">
        <label>Producto:</label>
        <select value={producto || ""} onChange={e => setProducto(e.target.value || null)}>
          <option value="">-- Elegir --</option>
          {productos.map(p =>
            <option key={p.producto_id} value={p.producto_id}>
              {p.nombre}
            </option>
          )}
        </select>

        <label>Desde:</label>
        <input
          type="date"
          value={filters.fecha_from}
          onChange={e => setFilters(f => ({ ...f, fecha_from: e.target.value }))}
        />

        <label>Hasta:</label>
        <input
          type="date"
          value={filters.fecha_to}
          onChange={e => setFilters(f => ({ ...f, fecha_to: e.target.value }))}
        />
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
                  : 0} kg
              </div>
            </div>

            <div className="kpi-card green">
              <h3>Top productores (kg)</h3>
              <div className="kpi-value">
                {volume.byProductor && volume.byProductor.length
                  ? Number(volume.byProductor[0].kg_ingresados).toLocaleString()
                  : 0} kg
              </div>
            </div>

            <div className="kpi-card orange">
              <h3>Top fincas (kg)</h3>
              <div className="kpi-value">
                {volume.byFinca && volume.byFinca.length
                  ? Number(volume.byFinca[0].kg_ingresados).toLocaleString()
                  : 0} kg
              </div>
            </div>
          </div>

          <div className="kpi-graficos">
            <div className="grafico-box">
              <h4>Ingresos por día</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={volume.perDay
                    ? volume.perDay.map(r => ({
                      fecha: r.fecha,
                      kg: Number(r.kg_ingresados)
                    }))
                    : []
                  }>
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
                  data={volume.byProductor
                    ? volume.byProductor.map(r => ({
                      nombre: r.productor,
                      kg: Number(r.kg_ingresados)
                    }))
                    : []}>
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
          <div className="kpi-graficos">
            <div className="grafico-box">
              <h4>Últimos lotes (rendimiento %)</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={rendimiento.rows
                    ? rendimiento.rows.map(r => ({
                      lote: r.descripcion,
                      rendimiento: Number(r.rendimiento_pct || 0),
                      cajas: Number(r.cajas_totales)
                    }))
                    : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lote" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rendimiento" fill="#fd7e14" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grafico-box">
              <h4>Descarte por calibre (%)</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={rendimiento.byCalibre
                    ? rendimiento.byCalibre.map(r => ({
                      calibre: r.calibre,
                      desc_prom: Number(r.desc_prom)
                    }))
                    : []}>
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
                  : 0} kg
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
              <h3>Tipos de caja (total)</h3>
              <div className="kpi-value">
                {empaque.tipoCaja
                  ? empaque.tipoCaja.reduce((a, b) => a + b.cantidad, 0)
                  : 0}
              </div>
            </div>
          </div>

          <div className="kpi-graficos">
            <div className="grafico-box">
              <h4>Cajas por dia (ej.)</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={empaque.cajasPorOperario
                    ? empaque.cajasPorOperario.map(r => ({
                      operario: r.operario || "anon",
                      cajas: r.cajas
                    }))
                    : []}>
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

      {/* Cámaras */}
      {camaras && (
        <>
          <h3 style={{ marginTop: 20 }}>Cámaras</h3>

          <div className="kpi-cards">
            <div className="kpi-card blue">
              <h3>Tiempo promedio en cámara</h3>
              <div className="kpi-value">
                {Math.round(camaras.tiempo_promedio_minutos)} min
              </div>
            </div>
          </div>

          <div className="kpi-graficos">
            <div className="grafico-box">
              <h4>Ocupación por cámara</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={camaras.ocupacion
                    ? camaras.ocupacion.map(r => ({
                      camara: r.nombre,
                      ocupado: r.pallets_en_camara,
                      capacidad: r.capacidad_pallets
                    }))
                    : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="camara" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ocupado" fill="#28a745" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grafico-box">
              <h4>Pallets por estado</h4>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={
                      camaras.porEstado
                        ? camaras.porEstado.map(r => ({
                          name: r.estado,
                          value: r.cantidad
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
                        fill={
                          ["#007bff", "#28a745", "#dc3545", "#fd7e14"][
                          index % 4
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Movimientos */}
      {movimientos && (
        <>
          <h3 style={{ marginTop: 20 }}>Movimientos pallets</h3>
          <div className="grafico-box">
            <h4>Movimientos por operario (ej.)</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={
                  movimientos.movPorOperario
                    ? movimientos.movPorOperario.map(r => ({
                      operario: r.operario,
                      movimientos: r.movimientos
                    }))
                    : []
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operario" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="movimientos" fill="#6f42c1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Auditoría */}
      {auditoria && (
        <>
          <h3 style={{ marginTop: 20 }}>Auditoría</h3>
          <div className="grafico-box">
            <h4>Top usuarios por acciones</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={
                  auditoria.byUser
                    ? auditoria.byUser.map(r => ({
                      user: r.nombre || r.usuario_id,
                      acciones: r.acciones
                    }))
                    : []
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="user" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="acciones" fill="#343a40" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

    </div>
  );
}
