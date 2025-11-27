import React, { useState, useEffect } from 'react';
import * as procesoService from './services/procesoService';

import '../../style/modalproc.css'; 

const ModalRegistrarProceso = ({ bin, onClose, onSuccess }) => {
  const [procesos, setProcesos] = useState([]);
  const [camposDinamicos, setCamposDinamicos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para campos fijos
  const [formData, setFormData] = useState({
    proceso_id: '', operario: '', temperatura: '',
    peso_entrada: bin.peso_bruto || '', peso_salida: '', observaciones: ''
  });
  const [respuestasDinamicas, setRespuestasDinamicas] = useState({});
  const [cerrarBin, setCerrarBin] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // 1. Cargar Procesos
      const pRes = await procesoService.getProcesosPorProducto(bin.producto_id);
      // Validación extra: asegurarse de que sea un array
      setProcesos(Array.isArray(pRes.data) ? pRes.data : []);

      // 2. Cargar Campos Dinámicos
      const cRes = await procesoService.getCamposClasificacion(bin.producto_id);
      setCamposDinamicos(Array.isArray(cRes.data) ? cRes.data : []);
      
    } catch (err) { 
      console.error("Error cargando datos del modal:", err); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await procesoService.registrarProcesoBin(bin.bin_id, {
        ...formData,
        atributos_calidad: respuestasDinamicas,
        cerrar_bin: cerrarBin
      });
      onSuccess();
    } catch (err) {
      Swal.fire({
                  icon: "error",
                  title: "Error",
                  text: "Error: " + (err.response?.data?.message || err.message),
                  confirmButtonText: "Entendido"
                  });
    } finally { setLoading(false); }
  };

  // --- FUNCIÓN DE RENDERIZADO SEGURA ---
  const renderInputDinamico = (campo) => {
    const handleChange = (val) => setRespuestasDinamicas(prev => ({...prev, [campo.nombre_campo]: val}));
    
    // TIPO SELECT
    if (campo.tipo_campo === 'select') {
      let opciones = [];
      try {
        // Intentamos parsear, si falla o es null, usamos array vacío
        opciones = typeof campo.opciones_json === 'string' 
                   ? JSON.parse(campo.opciones_json) 
                   : (campo.opciones_json || []);
      } catch (e) {
        console.warn("Error parseando JSON para campo:", campo.nombre_campo);
        opciones = [];
      }

      return (
        <select className="form-control" onChange={e => handleChange(e.target.value)} required={campo.es_obligatorio}>
          <option value="">Seleccione...</option>
          {opciones.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
      );
    }

    // TIPO MULTISELECT (CHECKBOXES)
// TIPO MULTISELECT (CHECKBOXES)
    if (campo.tipo_campo === 'multiselect') {
       let opciones = [];
       try {
         opciones = typeof campo.opciones_json === 'string' ? JSON.parse(campo.opciones_json) : (campo.opciones_json || []);
       } catch (e) { opciones = []; }
       
       const seleccionados = respuestasDinamicas[campo.nombre_campo] || [];

       const handleCheck = (opt) => {
          const newSel = seleccionados.includes(opt) 
             ? seleccionados.filter(x => x !== opt) 
             : [...seleccionados, opt];
          handleChange(newSel);
       }

       return (
         /* CAMBIO AQUÍ: Usamos una clase para grid y labels más limpios */
         <div className="checkbox-grid">
            {opciones.map(opt => (
               <label key={opt} className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={seleccionados.includes(opt)} 
                    onChange={() => handleCheck(opt)}
                  /> 
                  <span>{opt}</span>
               </label>
            ))}
         </div>
       );
    }
    
    // TIPO NUMBER / TEXT
    return (
        <input 
            type={campo.tipo_campo === 'number' ? 'number' : 'text'} 
            step={campo.tipo_campo === 'number' ? "0.01" : undefined}
            className="form-control"
            onChange={e => handleChange(e.target.value)} 
            required={campo.es_obligatorio} 
            placeholder={campo.unidad_medida ? `En ${campo.unidad_medida}` : ''}
        />
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
            <h3>Registrar Proceso: <span style={{color:'#27ae60'}}>{bin.producto_nombre}</span></h3>
            <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* SECCIÓN 1: DATOS GENERALES */}
          <div className="form-section">
              <h4>Datos del Proceso</h4>
              <div className="form-group">
                <label>Proceso a realizar</label>
                <select className="form-control" onChange={e => setFormData({...formData, proceso_id: e.target.value})} required>
                    <option value="">-- Seleccione Proceso --</option>
                    {procesos.map(p => <option key={p.proceso_id} value={p.proceso_id}>{p.nombre}</option>)}
                </select>
              </div>

              <div className="row-2-col">
                  <div className="form-group">
                      <label>Peso Entrada (kg)</label>
                      <input className="form-control" type="number" value={formData.peso_entrada} readOnly disabled style={{background:'#f0f0f0'}}/>
                  </div>
                  <div className="form-group">
                      <label>Peso Salida (kg)</label>
                      <input className="form-control" type="number" onChange={e => setFormData({...formData, peso_salida: e.target.value})} />
                  </div>
              </div>
          </div>
          
          {/* SECCIÓN 2: CALIDAD DINÁMICA */}
          {camposDinamicos.length > 0 && (
              <div className="dynamic-section">
                <h4>Clasificación de Calidad</h4>
                <div className="grid-dinamico">
                    {camposDinamicos.map(campo => (
                    <div key={campo.id} className="form-group">
                        <label>
                            {campo.etiqueta} 
                            {campo.unidad_medida && <small style={{color:'#888', marginLeft:'5px'}}>({campo.unidad_medida})</small>}
                        </label>
                        {renderInputDinamico(campo)}
                    </div>
                    ))}
                </div>
              </div>
          )}

          {/* CHECKBOX DE CIERRE */}
          <div className="cerrar-bin-check">
            <label>
              <input type="checkbox" checked={cerrarBin} onChange={e => setCerrarBin(e.target.checked)} />
              <strong> Finalizar procesamiento (Enviar a Loteo)</strong>
            </label>
          </div>

          <div className="footer">
            <button type="button" onClick={onClose} className="btn-secundario">Cancelar</button>
            <button type="submit" className="btn-primario" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ModalRegistrarProceso;