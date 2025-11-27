import React, { useState, useEffect } from 'react';
import * as procesoService from './services/procesoService';
import Swal from 'sweetalert2';
import '../../style/gestionlotes.css'; // Asegúrate de crear este archivo nuevo

const GestionLotes = ({ productos }) => {
  const [filtroProducto, setFiltroProducto] = useState('');
  const [bins, setBins] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (filtroProducto) cargarBins();
    else setBins([]);
  }, [filtroProducto]);

  const cargarBins = async () => {
    try {
      setLoading(true);
      const res = await procesoService.getBinsPendientesLote(filtroProducto);
      setBins(res.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const toggleSeleccion = (binId) => {
    if (seleccionados.includes(binId)) setSeleccionados(seleccionados.filter(id => id !== binId));
    else setSeleccionados([...seleccionados, binId]);
  };

  const handleGenerarLote = async () => {
    if (seleccionados.length === 0) return;
    if (!confirm(`¿Crear lote con ${seleccionados.length} bins?`)) return;
    
    try {
      await procesoService.crearLote({
        bins_ids: seleccionados,
        producto_id: filtroProducto,
        observaciones: 'Generado desde panel'
      });

        Swal.fire({
                   icon: "success",
                   title: "¡Lote Creado!",
                   confirmButtonText: "Aceptar"
                });

      setSeleccionados([]);
      cargarBins();
    } catch (err) { Swal.fire({
                               icon: "error",
                               title: "Error",
                               text: err.message,
                               confirmButtonText: "Entendido"
                                  });}
  };
  
  const renderCalidad = (data) => {
    if (!data) return '-';
    try {
      const obj = typeof data === 'string' ? JSON.parse(data) : data;
      return Object.entries(obj).map(([k, v]) => {
         const val = Array.isArray(v) ? v.join(', ') : v;
         return `${k}: ${val}`;
      }).join(' | ');
    } catch { return 'Error datos'; }
  };

  return (
    <div className="gl-container">
      
      {/* FILTRO SUPERIOR */}
      <div className="gl-filter-card">
        <div className="gl-filter-group">
          <label>Seleccione Producto a Lotear:</label>
          <select value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)}>
            <option value="">-- Seleccione --</option>
            {productos.map(p => (
              <option key={p.producto_id} value={p.producto_id}>{p.producto_nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLA DE RESULTADOS */}
      {filtroProducto && (
        <div className="gl-table-wrapper">
          {loading ? <div className="gl-loading">Buscando bins...</div> : (
            <>
              <table className="gl-table">
                <thead>
                  <tr>
                    <th width="50">✔</th>
                    <th>ID Bin</th>
                    <th>Variedad</th>
                    <th>Peso Neto</th>
                    <th>Calidad</th>
                  </tr>
                </thead>
                <tbody>
                  {bins.map(bin => (
                    <tr key={bin.bin_id} className={seleccionados.includes(bin.bin_id) ? 'gl-row-selected' : ''}>
                      <td>
                        <input 
                          type="checkbox" 
                          className="gl-checkbox"
                          checked={seleccionados.includes(bin.bin_id)}
                          onChange={() => toggleSeleccion(bin.bin_id)}
                        />
                      </td>
                      <td>{bin.bin_id}</td>
                      <td>{bin.variedad_nombre || '-'}</td>
                      <td>{bin.peso_bruto} kg</td>
                      <td className="gl-calidad-text">
                        {renderCalidad(bin.ultimo_proceso_datos)}
                      </td>
                    </tr>
                  ))}
                  {bins.length === 0 && (
                    <tr><td colSpan="5" className="gl-empty-msg">No hay bins pendientes.</td></tr>
                  )}
                </tbody>
              </table>

              {/* FOOTER FLOTANTE */}
              <div className="gl-floating-footer">
                <span>{seleccionados.length} bins seleccionados</span>
                <button 
                  className="gl-btn-create" 
                  disabled={seleccionados.length === 0}
                  onClick={handleGenerarLote}
                >
                  GENERAR LOTE MAESTRO
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GestionLotes;