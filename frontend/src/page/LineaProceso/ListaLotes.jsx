import React, { useState, useEffect } from 'react';
import * as procesoService from './services/procesoService';
import '../../style/listalotes.css'

const ListaLotes = () => {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedLote, setExpandedLote] = useState(null);
  const [detalleBins, setDetalleBins] = useState([]);

  useEffect(() => {
    cargarLotes();
  }, []);

  const cargarLotes = async () => {
    setLoading(true);
    try {
      const res = await procesoService.getLotesCreados();
      setLotes(res.data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const toggleDetalle = async (loteId) => {
    if (expandedLote === loteId) {
        setExpandedLote(null);
        return;
    }
    setExpandedLote(loteId);
    setDetalleBins([]); 
    try {
        const res = await procesoService.getDetalleLote(loteId);
        setDetalleBins(res.data || []);
    } catch (error) { console.error(error); }
  };

  // Función para formatear el JSON de calidad
  const renderCalidad = (jsonCalidad) => {
    if (!jsonCalidad) return <span style={{color:'#999'}}>Sin datos</span>;
    
    try {
        const datos = typeof jsonCalidad === 'string' ? JSON.parse(jsonCalidad) : jsonCalidad;
        // Convertimos el objeto en una lista legible
        return (
            <ul style={{margin: '5px 0', paddingLeft: '15px', fontSize: '0.85rem', color: '#555'}}>
                {Object.entries(datos).map(([key, value]) => {
                    // Ignoramos campos internos si existen
                    if (key === 'cerrar_bin') return null;
                    // Formateamos valores array (multiselect)
                    const valorDisplay = Array.isArray(value) ? value.join(', ') : value;
                    // Formateamos la clave (ej: "tipo_azucar" -> "Tipo Azucar")
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    
                    return <li key={key}><strong>{label}:</strong> {valorDisplay}</li>
                })}
            </ul>
        );
    } catch (e) {
        return <span>Error datos</span>;
    }
  };

  return (
    <div className="tab-content">
      <div className="filtros-card">
         <button className="btn-limpiar" onClick={cargarLotes}>🔄 Refrescar Historial</button>
      </div>

      <div className="tabla-contenedor">
        {loading ? <p>Cargando historial...</p> : (
          <table className="tabla-lotes">
            <thead>
              <tr>
                <th>Cód. Lote</th>
                <th>Producto</th>
                <th>Fecha</th>
                <th>Cant. Bins</th>
                <th>Peso Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lotes.map(lote => (
                <React.Fragment key={lote.lote_id}>
                    {/* FILA CABECERA */}
                    <tr style={{backgroundColor: expandedLote === lote.lote_id ? '#f0f8ff' : 'white'}}>
                        <td style={{fontWeight:'bold', color:'#2c3e50'}}>{lote.codigo_lote}</td>
                        <td>{lote.producto_nombre}</td>
                        <td>{new Date(lote.fecha_ingreso).toLocaleDateString()} {new Date(lote.fecha_ingreso).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td>{lote.cantidad_bins}</td>
                        <td>{lote.peso_total} kg</td>
                        <td><span className="estado-badge">{lote.estado}</span></td>
                        <td>
                            <button 
                                className="btn-secundario" 
                                style={{fontSize: '0.8rem', padding: '4px 8px'}}
                                onClick={() => toggleDetalle(lote.lote_id)}
                            >
                                {expandedLote === lote.lote_id ? '▲ Ocultar' : '▼ Ver Bins'}
                            </button>
                        </td>
                    </tr>

                    {/* FILA DE DETALLE (SE DESPLIEGA) */}
                      {expandedLote === lote.lote_id && (
                          <tr>
                              <td colSpan="7" style={{ padding: 0 }}> {/* IMPORTANTE: Padding 0 para que el contenedor gris llene todo */}
                                  <div className="detalle-lote-container"> {/* Clase nueva */}
                                      <h4 className="detalle-titulo">
                                          📦 Contenido del Lote {lote.codigo_lote}
                                      </h4>

                                      <div className="grid-detalle-bins">
                                          {detalleBins.length > 0 ? detalleBins.map(bin => (
                                              <div key={bin.bin_id} className="card-bin-detalle">
                                                  <div className="bin-id-header">
                                                      <span>#{bin.bin_id}</span>
                                                  </div>
                                                  <div className="bin-body">
                                                      <div className="bin-dato-row">
                                                          <span className="label-dato">Variedad</span>
                                                          <span className="valor-dato">{bin.variedad_nombre || '-'}</span>
                                                      </div>
                                                      <div className="bin-dato-row">
                                                          <span className="label-dato">Peso Neto</span>
                                                          <span className="valor-dato">{bin.peso_bin} kg</span>
                                                      </div>

                                                      {/* Caja de Calidad */}
                                                      <div className="calidad-box">
                                                          {renderCalidad(bin.datos_calidad)}
                                                      </div>
                                                  </div>
                                              </div>
                                          )) : <p style={{ color: '#999', fontStyle: 'italic' }}>Cargando información...</p>}
                                      </div>
                                  </div>
                              </td>
                          </tr>
                      )}
                </React.Fragment>
              ))}
              {lotes.length === 0 && <tr><td colSpan="7" style={{textAlign:'center', padding:'20px'}}>No hay lotes registrados.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ListaLotes;