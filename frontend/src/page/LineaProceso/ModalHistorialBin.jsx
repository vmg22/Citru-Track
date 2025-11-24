import React, { useState, useEffect } from 'react';
// CORRECCIÓN: Agregamos "* as" para importar todas las funciones exportadas en el objeto procesoService
import * as procesoService from '../LineaProceso/services/procesoService'; 
import '../../style/modalproc.css';

const ModalHistorialBin = ({ bin, onClose }) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await procesoService.getHistorialBin(bin.bin_id);
      setHistorial(response.data || []);
    } catch (err) {
      setError('Error al cargar historial');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Historial de Procesos</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Información del bin */}
          <div className="info-bin-modal">
            <div className="info-item">
              <span className="label">Bin:</span>
              <span className="value">{bin.bin_id}</span>
            </div>
            <div className="info-item">
              <span className="label">Producto:</span>
              <span className="value">
                {bin.producto_nombre} {bin.variedad_nombre && `- ${bin.variedad_nombre}`}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Remito:</span>
              <span className="value">{bin.remito}</span>
            </div>
            <div className="info-item">
              <span className="label">Peso:</span>
              <span className="value">{bin.peso_bruto} kg</span>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Timeline de procesos */}
          {loading ? (
            <div className="loading">Cargando historial...</div>
          ) : historial.length === 0 ? (
            <div className="empty-state">
              <p>No hay procesos registrados para este bin</p>
            </div>
          ) : (
            <div className="timeline">
              {historial.map((proceso, index) => (
                <div key={proceso.id} className="timeline-item">
                  <div className="timeline-marker">
                    <div className="timeline-dot"></div>
                    {index < historial.length - 1 && <div className="timeline-line"></div>}
                  </div>
                  
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h4>{proceso.proceso_nombre}</h4>
                      <span className={`estado-badge ${proceso.estado}`}>
                        {proceso.estado}
                      </span>
                    </div>

                    <div className="timeline-details">
                      <div className="detail-row">
                        <span className="icon">📅</span>
                        <span className="text">
                          <strong>Fecha:</strong> {formatearFecha(proceso.fecha_inicio)}
                        </span>
                      </div>

                      {proceso.operario && (
                        <div className="detail-row">
                          <span className="icon">👤</span>
                          <span className="text">
                            <strong>Operario:</strong> {proceso.operario}
                          </span>
                        </div>
                      )}

                      {proceso.temperatura && (
                        <div className="detail-row">
                          <span className="icon">🌡️</span>
                          <span className="text">
                            <strong>Temperatura:</strong> {proceso.temperatura}°C
                          </span>
                        </div>
                      )}

                      {proceso.peso_entrada && (
                        <div className="detail-row">
                          <span className="icon">⚖️</span>
                          <span className="text">
                            <strong>Peso entrada:</strong> {proceso.peso_entrada} kg
                            {proceso.peso_salida && ` → ${proceso.peso_salida} kg`}
                          </span>
                        </div>
                      )}

                      {proceso.calibre && (
                        <div className="detail-row">
                          <span className="icon">📏</span>
                          <span className="text">
                            <strong>Calibre:</strong> {proceso.calibre}
                          </span>
                        </div>
                      )}

                      {proceso.observaciones && (
                        <div className="detail-row observaciones">
                          <span className="icon">📝</span>
                          <span className="text">
                            <strong>Observaciones:</strong> {proceso.observaciones}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-primario" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalHistorialBin;