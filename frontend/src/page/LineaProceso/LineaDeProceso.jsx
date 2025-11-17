import React from 'react'
import "../../style/linea.css"
const LineaDeProceso = () => {
  return (
    // Contenedor principal para esta página
    <div className="linea-proceso-container" id="linea">
      
      {/* Tarjeta de Vista por Lote */}
      <div className="linea-proceso-card">
        <h3 className="linea-proceso-title">Vista por Lote</h3>
        
        <div className="linea-proceso-content-block">
          <label className="linea-proceso-label" htmlFor="selectLote">Seleccionar Lote</label>
          <select id="selectLote" className="linea-proceso-select">
            <option value="LOT-20251116-018">LOT-20251116-018</option>
            <option value="LOT-20251116-017">LOT-20251116-017</option>
          </select>

          {/* Caja de Información del Lote */}
          <div className="linea-proceso-info-box">
            <div className="linea-proceso-info-header">
              <div className="linea-proceso-info-icon"></div>
              <div>
                <div className="linea-proceso-info-id">LOT-20251116-018</div>
                <div className="linea-proceso-info-status">Estado: Clasificado</div>
              </div>
            </div>

            {/* Sección de Etapas */}
            <div className="linea-proceso-etapas">
              <div className="linea-proceso-etapas-title">Etapas</div>
              <ol className="linea-proceso-etapas-list">
                <li>Ingreso → Lavado → Clasificación → Empacado → Pallet</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Sublotes */}
      <div className="linea-proceso-card">
        <h4 className="linea-proceso-subtitle">Sublotes</h4>
        <table className="linea-proceso-table">
          <thead className="linea-proceso-table-head">
            <tr>
              <th>Sublote</th>
              <th>Calibre</th>
              <th>Cajas</th>
            </tr>
          </thead>
          <tbody id="sublotesTable">
            <tr>
              <td>SL-018-88</td>
              <td>88</td>
              <td>41</td>
            </tr>
            <tr>
              <td>SL-018-80</td>
              <td>80</td>
              <td>32</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};


export default LineaDeProceso