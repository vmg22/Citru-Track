import React from 'react'
import { useState } from 'react';
import "../../style/monitoreo.css";

const KPIsPage = () => {
    const [plantaSeleccionada, setPlantaSeleccionada] = useState("T1");
    const [lineaSeleccionada, setLineaSeleccionada] = useState("A");
    const MetricCard = ({ label, value, sublabel, statusClass = "" }) => {
  return (
    <div className="monitoreo-metric-card">
      <div className="monitoreo-metric-label">{label}</div>
      <div className={`monitoreo-metric-value ${statusClass}`}>{value}</div>
      <div className="monitoreo-metric-sublabel">{sublabel}</div>
    </div>
  );
};
  
  return (
    <div>
      <div className="monitoreo-header">
            <h2>
              <i className="fas fa-chart-line"></i> KPIs y Reportes
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
                // value={productoSeleccionado}
                // onChange={handleProductoChange}
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
              // value={metrics.cajasPorMin}
              sublabel="+5% vs promedio"
              statusClass="monitoreo-metric-good"
            />

          </div>
    </div>
  )
}

export default KPIsPage