import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import "../../style/monitoreo.css"; // Asegúrate de que este archivo exista

const KPIsPage = () => {
  // --- ESTADOS Y FILTROS ---
  const [plantaSeleccionada, setPlantaSeleccionada] = useState("T1");
  const [lineaSeleccionada, setLineaSeleccionada] = useState("A");
  const [producto, setProducto] = useState("");
  const [filters, setFilters] = useState({ fecha_from: '2023-10-01', fecha_to: '2023-10-30' });
  
  // Estado para simular la data que vendría del Backend
  const [data, setData] = useState(null);

  // --- SIMULACIÓN DE DATOS (MOCK DATA) ---
  useEffect(() => {
    // Aquí harías tu fetch al backend. Simulamos la respuesta:
    setData({
      volume: {
        perDay: [
          { fecha: '01/11', kg_ingresados: 12000 },
          { fecha: '02/11', kg_ingresados: 15500 },
          { fecha: '03/11', kg_ingresados: 11000 },
        ],
        byProductor: [
          { productor: 'Finca El Sol', kg_ingresados: 45000 },
          { productor: 'Agro Tucumán', kg_ingresados: 32000 },
        ],
        byFinca: [
            { nombre: 'Lote 4', kg_ingresados: 20000 }
        ]
      },
      rendimiento: {
        rows: [
          { descripcion: 'Lote A1', rendimiento_pct: 55, cajas_totales: 120 },
          { descripcion: 'Lote B2', rendimiento_pct: 62, cajas_totales: 200 },
        ],
        byCalibre: [
          { calibre: 'Calibre 1', desc_prom: 5 },
          { calibre: 'Calibre 2', desc_prom: 8 },
        ]
      },
      empaque: {
        pesoPromedio: 18.5,
        palletsPorDia: [{ pallets: 45 }],
        tipoCaja: [{ cantidad: 120 }, { cantidad: 80 }],
        cajasPorOperario: [
            { operario: 'Juan P.', cajas: 150 },
            { operario: 'Maria G.', cajas: 165 }
        ]
      },
      camaras: {
        tiempo_promedio_minutos: 450,
        ocupacion: [
          { nombre: 'Cám 1', pallets_en_camara: 20, capacidad_pallets: 50 },
          { nombre: 'Cám 2', pallets_en_camara: 45, capacidad_pallets: 50 },
        ],
        porEstado: [
          { estado: 'Enfriando', cantidad: 30 },
          { estado: 'Listo', cantidad: 15 },
        ]
      },
      despacho: {
        minutosArmadoACarga: 35,
        pctFueraRango: 2.5
      },
      movimientos: {
        movPorOperario: [
            { operario: 'Op 1', movimientos: 30 },
            { operario: 'Op 2', movimientos: 42 }
        ]
      },
      auditoria: {
        byUser: [
            { nombre: 'Admin', acciones: 120 },
            { nombre: 'Supervisor', acciones: 85 }
        ]
      }
    });
  }, []);

  // Lista de productos mock
  const productos = [
    { producto_id: 'limon', nombre: 'Limón' },
    { producto_id: 'palta', nombre: 'Palta' },
  ];

  // Componente interno para Tarjetas
  const MetricCard = ({ label, value, sublabel, statusClass = "" }) => (
    <div className="monitoreo-metric-card">
      <div className="monitoreo-metric-label">{label}</div>
      <div className={`monitoreo-metric-value ${statusClass}`}>{value}</div>
      <div className="monitoreo-metric-sublabel">{sublabel}</div>
    </div>
  );

  // Si no hay datos cargados, mostrar loading
  if (!data) return <div>Cargando dashboard...</div>;

  // Destructuring para facilitar uso en el JSX
  const { volume, rendimiento, empaque, camaras, despacho, movimientos, auditoria } = data;

  return (
    <div className="kpi-page-container" style={{ padding: '20px' }}>
      
      {/* --- HEADER --- */}
      <div className="monitoreo-header">
        <h2><i className="fas fa-chart-line"></i> KPIs y Reportes</h2>
        <div className="monitoreo-user-info">
          <i className="fas fa-user-circle"></i>
          <span>Supervisor de Planta</span>
        </div>
      </div>

      {/* --- FILTROS GLOBALES --- */}
      <div className="monitoreo-filtros">
        <div className="monitoreo-filtro-grupo">
          <label htmlFor="planta">Planta:</label>
          <select id="planta" value={plantaSeleccionada} disabled>
            <option value="T1">Planta T1</option>
            <option value="T2">Planta T2</option>
          </select>
        </div>
        
        <div className="monitoreo-filtro-grupo">
          <label htmlFor="linea">Línea:</label>
          <select id="linea" value={lineaSeleccionada} disabled>
            <option value="A">Línea A</option>
            <option value="B">Línea B</option>
          </select>
        </div>

        <div className="monitoreo-filtro-grupo">
            <label>Producto:</label>
            <select value={producto || ""} onChange={e => setProducto(e.target.value || null)}>
            <option value="">-- Elegir --</option>
            {productos.map(p => <option key={p.producto_id} value={p.producto_id}>{p.nombre}</option>)}
            </select>
        </div>

        <div className="monitoreo-filtro-grupo">
             <label>Desde:</label>
             <input type="date" value={filters.fecha_from} onChange={e => setFilters(f => ({...f, fecha_from: e.target.value}))} />
        </div>
        <div className="monitoreo-filtro-grupo">
             <label>Hasta:</label>
             <input type="date" value={filters.fecha_to} onChange={e => setFilters(f => ({...f, fecha_to: e.target.value}))} />
        </div>
      </div>

      {/* --- KPI SUPERIORES --- */}
      <div className="monitoreo-metrics-container">
        <MetricCard
          label="Cajas Procesadas/Min"
          value="42" // Valor hardcodeado o dinámico
          sublabel="+5% vs promedio"
          statusClass="monitoreo-metric-good"
        />
         <MetricCard
          label="Kg Ingresados Hoy"
          value={volume.perDay && volume.perDay.length ? Number(volume.perDay[0].kg_ingresados).toLocaleString() : 0}
          sublabel="Último registro"
        />
      </div>

      <hr style={{ margin: '30px 0', borderTop: '1px solid #eee' }} />

      {/* --- SECCIÓN VOLUMEN --- */}
      {volume && (
        <section className="kpi-section">
          <h3>Volumen de Ingreso</h3>
          <div className="kpi-cards">
            <div className="kpi-card blue">
              <h4>Kg ingresados (recientes)</h4>
              <div className="kpi-value">{volume.perDay && volume.perDay.length ? Number(volume.perDay[0].kg_ingresados).toLocaleString() : 0} kg</div>
            </div>
            <div className="kpi-card green">
              <h4>Top productor (kg)</h4>
              <div className="kpi-value">{volume.byProductor && volume.byProductor.length ? Number(volume.byProductor[0].kg_ingresados).toLocaleString() : 0} kg</div>
            </div>
          </div>

          <div className="kpi-graficos" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <div className="grafico-box" style={{ flex: 1 }}>
              <h4>Ingresos por día</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={volume.perDay ? volume.perDay.map(r => ({ fecha: r.fecha, kg: Number(r.kg_ingresados) })) : [] }>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="kg" fill="#007bff" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grafico-box" style={{ flex: 1 }}>
              <h4>Kg por productor</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={volume.byProductor ? volume.byProductor.map(r=>({nombre: r.productor, kg: Number(r.kg_ingresados)})) : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="kg" fill="#28a745" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* --- SECCIÓN RENDIMIENTO --- */}
      {rendimiento && (
        <section className="kpi-section">
          <h3 style={{marginTop:20}}>Rendimiento de lotes</h3>
          <div className="kpi-graficos" style={{ display: 'flex', gap: '20px' }}>
            <div className="grafico-box" style={{ flex: 1 }}>
              <h4>Últimos lotes (rendimiento %)</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rendimiento.rows ? rendimiento.rows.map(r => ({lote: r.descripcion, rendimiento: Number(r.rendimiento_pct || 0)})) : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lote" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rendimiento" fill="#fd7e14" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grafico-box" style={{ flex: 1 }}>
                <h4>Descarte por calibre (%)</h4>
                <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rendimiento.byCalibre ? rendimiento.byCalibre.map(r=>({calibre: r.calibre, desc_prom: Number(r.desc_prom)})) : []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="calibre" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="desc_prom" fill="#dc3545" />
                </BarChart>
                </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* --- SECCIÓN EMPAQUE --- */}
      {empaque && (
        <section className="kpi-section">
          <h3 style={{marginTop:20}}>Eficiencia de empaque</h3>
          <div className="kpi-cards">
            <div className="kpi-card blue">
              <h4>Peso promedio caja</h4>
              <div className="kpi-value">{empaque.pesoPromedio ? Number(empaque.pesoPromedio).toFixed(2) : 0} kg</div>
            </div>
            <div className="kpi-card green">
                <h4>Total Cajas (Muestra)</h4>
                <div className="kpi-value">{empaque.tipoCaja ? empaque.tipoCaja.reduce((a,b)=>a+b.cantidad,0) : 0}</div>
            </div>
          </div>
          
          <div className="kpi-graficos" style={{ marginTop: '20px' }}>
             <div className="grafico-box">
              <h4>Cajas por operario (ej.)</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={empaque.cajasPorOperario ? empaque.cajasPorOperario.map(r=>({operario: r.operario || 'anon', cajas: r.cajas})) : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="operario" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cajas" fill="#007bff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* --- SECCIÓN CÁMARAS --- */}
      {camaras && (
        <section className="kpi-section">
          <h3 style={{marginTop:20}}>Cámaras de Frío</h3>
          <div className="kpi-cards">
             <div className="kpi-card blue">
               <h4>Tiempo promedio en cámara</h4>
               <div className="kpi-value">{Math.round(camaras.tiempo_promedio_minutos)} min</div>
             </div>
          </div>

          <div className="kpi-graficos" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <div className="grafico-box" style={{ flex: 1 }}>
              <h4>Ocupación por cámara</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={camaras.ocupacion ? camaras.ocupacion.map(r=>({camara: r.nombre, ocupado: r.pallets_en_camara, capacidad: r.capacidad_pallets})) : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="camara" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ocupado" fill="#28a745" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grafico-box" style={{ flex: 1 }}>
              <h4>Pallets por estado</h4>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie 
                    data={camaras.porEstado ? camaras.porEstado.map(r=>({name: r.estado, value: r.cantidad})) : []} 
                    dataKey="value" 
                    nameKey="name" 
                    outerRadius={80} 
                    label
                  >
                    {(camaras.porEstado||[]).map((entry,index)=> <Cell key={index} fill={["#007bff","#28a745","#dc3545","#fd7e14"][index%4]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* --- OTRAS SECCIONES (Despacho, Movimientos, etc) --- */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        {despacho && (
            <div className="grafico-box" style={{ flex: 1, padding: '20px', border: '1px solid #ddd' }}>
                <h4>Despacho</h4>
                <p>Minutos armado → carga: <strong>{Math.round(despacho.minutosArmadoACarga)} min</strong></p>
                <p>% Órdenes fuera de rango: <strong>{Number(despacho.pctFueraRango).toFixed(2)} %</strong></p>
            </div>
        )}
        {movimientos && (
            <div className="grafico-box" style={{ flex: 1 }}>
                <h4>Movimientos (Pallets)</h4>
                <ResponsiveContainer width="100%" height={200}>
                <BarChart data={movimientos.movPorOperario ? movimientos.movPorOperario.map(r=>({operario: r.operario, movimientos: r.movimientos})) : []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="operario" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="movimientos" fill="#6f42c1" />
                </BarChart>
                </ResponsiveContainer>
            </div>
        )}
      </div>
      
      {auditoria && (
        <div style={{ marginTop: '20px' }}>
             <h3>Auditoría del Sistema</h3>
             <div className="grafico-box">
                <h4>Top usuarios por acciones</h4>
                <ResponsiveContainer width="100%" height={200}>
                <BarChart data={auditoria.byUser ? auditoria.byUser.map(r=>({user: r.nombre || r.usuario_id, acciones: r.acciones})) : []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="user" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="acciones" fill="#343a40" />
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}

    </div>
  );
}

export default KPIsPage;