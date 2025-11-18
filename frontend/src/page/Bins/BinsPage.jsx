import React from 'react'
import "../../style/bins.css"

const BinsPage = () => {
  return (
    <div className="bins-page-container" id="recepcion">
        <div className="dashboard-header">
          <h2>Recepción de Bin</h2>
          <div className="dashboard-user-info">
            <i className="fas fa-user-circle"></i>
            <span>Administrador</span>
          </div>
        </div>
            <div className="recepcion-card">            
            <form id="binForm" className="recepcion-form">
                
                <div className="recepcion-form-group">
                    <label className="recepcion-form-label" htmlFor="productor">Productor</label>
                    <input id="productor" className="recepcion-form-input" placeholder="Finca Los Naranjos" />
                </div>
                
                <div className="recepcion-form-group">
                    <label className="recepcion-form-label" htmlFor="remito">Remito</label>
                    <input id="remito" className="recepcion-form-input" placeholder="RMT-55422" />
                </div>
                
                <div className="recepcion-form-group">
                    <label className="recepcion-form-label" htmlFor="fechaCosecha">Fecha cosecha</label>
                    <input id="fechaCosecha" type="date" className="recepcion-form-input" />
                </div>
                
                <div className="recepcion-form-group">
                    <label className="recepcion-form-label" htmlFor="peso">Peso estimado (kg)</label>
                    <input id="peso" type="number" className="recepcion-form-input" placeholder="420" />
                </div>
                
                <div className="recepcion-form-group full-width">
                    <label className="recepcion-form-label" htmlFor="obs">Observaciones</label>
                    <textarea id="obs" className="recepcion-form-input" rows="2"></textarea>
                </div>

                <div className="recepcion-form-actions">
                    <button type="button" id="registrarBin" className="recepcion-form-button">Registrar Bin y Generar Lote</button>
                </div>
            </form>
        </div>

        <div className="recepcion-card-recent">
            <h4 className="recepcion-card-title">Bins recientes</h4>
            <ul id="binsList" className="recepcion-bins-list">
                <li>BIN-20251116-034</li>
                <li>BIN-20251116-033</li>
            
            </ul>
        </div>
    </div>
  )
}

export default BinsPage