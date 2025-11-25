import React, { useState, useEffect } from 'react';
import * as procesoService from './services/procesoService';
// Asegúrate de que las rutas a tus Modales sean correctas
import ModalRegistrarProceso from './ModalRegistrarProceso'; 
import ModalHistorialBin from './ModalHistorialBin';
import '../../style/bandejaproceso.css';

const BandejaEnProceso = ({ productos }) => {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ producto_id: '', variedad_id: '', estado: '' });
  
  // Estados para Modales
  const [binSeleccionado, setBinSeleccionado] = useState(null);
  const [showModalReg, setShowModalReg] = useState(false);
  const [showModalHist, setShowModalHist] = useState(false);

  // Cargar bins al inicio y cuando cambian los filtros
  useEffect(() => {
    cargarBins();
  }, [filtros]);

  const cargarBins = async () => {
    setLoading(true);
    try {
      // Limpiamos filtros vacíos para no mandar strings vacíos al backend
      const params = Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v !== ''));
      const res = await procesoService.getBinsConFiltros(params);
      setBins(res.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSuccess = () => {
    setShowModalReg(false);
    cargarBins(); // Recargamos para que si se cerró el bin, desaparezca de esta lista
  };

  const calcularPorcentaje = (completados, totales) => {
    if (!totales) return 0;
    return Math.round((completados / totales) * 100);
  };

  return (
    <div className="tab-content">
      {/* --- FILTROS --- */}
      <div className="filtros-card">
        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Producto</label>
            <select value={filtros.producto_id} onChange={e => setFiltros({...filtros, producto_id: e.target.value})}>
              <option value="">Todos</option>
              {productos.map(p => <option key={p.producto_id} value={p.producto_id}>{p.producto_nombre}</option>)}
            </select>
          </div>
          {/* <div className="filtro-group">
             <label>&nbsp;</label>
             <button className="btn-limpiar" onClick={cargarBins}>🔄 Actualizar Lista</button>
          </div> */}
        </div>
      </div>

      {/* --- LISTA DE BINS --- */}
      <div className="bins-lista-card">
        {loading ? <p>Cargando bins en proceso...</p> : (
          <div className="bins-grid">
            {bins.map(bin => (
              <div key={bin.bin_id} className="bin-card">
                <div className="bin-header">
                   <h4>{bin.bin_id}</h4>
                   <span className={`estado-badge ${bin.estado_actual?.replace(/\s/g, '').toLowerCase()}`}>
                      {bin.estado_actual}
                   </span>
                </div>
                <div className="bin-info">
                   <p><strong>{bin.producto_nombre}</strong></p>
                   <p>{bin.variedad_nombre}</p>
                   <p>Peso: {bin.peso_bruto} kg</p>
                   
                   {/* Barra de Progreso */}
                   <div className="progreso-container">
                      <small>Avance: {calcularPorcentaje(bin.procesos_completados, bin.procesos_totales_obligatorios)}%</small>
                      <div className="barra-progreso">
                          <div className="barra-progreso-fill" style={{width: `${calcularPorcentaje(bin.procesos_completados, bin.procesos_totales_obligatorios)}%`}}></div>
                      </div>
                   </div>
                </div>
                <div className="bin-acciones">
                   <button className="btn-secundario" onClick={() => {setBinSeleccionado(bin); setShowModalHist(true)}}>Historial</button>
                   <button className="btn-primario" onClick={() => {setBinSeleccionado(bin); setShowModalReg(true)}}>Procesar</button>
                </div>
              </div>
            ))}
            {bins.length === 0 && <p className="empty-msg">No hay bins activos en este momento.</p>}
          </div>
        )}
      </div>

      {/* --- MODALES --- */}
      {showModalReg && binSeleccionado && (
        <ModalRegistrarProceso bin={binSeleccionado} onClose={() => setShowModalReg(false)} onSuccess={handleSuccess} />
      )}
      {showModalHist && binSeleccionado && (
        <ModalHistorialBin bin={binSeleccionado} onClose={() => setShowModalHist(false)} />
      )}
    </div>
  );
};

export default BandejaEnProceso;