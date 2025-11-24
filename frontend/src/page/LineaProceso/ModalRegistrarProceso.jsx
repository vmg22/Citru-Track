import React, { useState, useEffect } from 'react';
// CORRECCIÓN 1: Importamos todo como un alias para evitar el error de "export default"
// Asegúrate de que esta ruta apunte a tu archivo procesoService.js
import * as procesoService from './services/procesoService'; 
import '../../style/modalproc.css';

const ModalRegistrarProceso = ({ bin, onClose, onSuccess }) => {
  const [procesos, setProcesos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    proceso_id: '',
    operario: '',
    temperatura: '',
    peso_entrada: '',
    peso_salida: '',
    calibre: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarProcesos();
  }, []);

  const cargarProcesos = async () => {
    try {
      const response = await procesoService.getProcesosPorProducto(bin.producto_id);
      setProcesos(response.data || []);
    } catch (err) {
      setError('Error al cargar procesos');
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.proceso_id) {
      setError('Debe seleccionar un proceso');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // CORRECCIÓN 2: Usamos el nombre correcto 'registrarProcesoBin' (como está en el servicio)
      // en lugar de 'registrarProceso' (que no existe).
      await procesoService.registrarProcesoBin(bin.bin_id, {
        proceso_id: parseInt(formData.proceso_id),
        operario: formData.operario || 'Sistema',
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
        peso_entrada: formData.peso_entrada ? parseFloat(formData.peso_entrada) : null,
        peso_salida: formData.peso_salida ? parseFloat(formData.peso_salida) : null,
        calibre: formData.calibre || null,
        observaciones: formData.observaciones || null
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar proceso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registrar Proceso</h3>
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
              <span className="label">Estado actual:</span>
              <span className="value estado-badge">{bin.estado_actual}</span>
            </div>
            <div className="info-item">
              <span className="label">Progreso:</span>
              <span className="value">
                {bin.procesos_completados}/{bin.procesos_totales_obligatorios}
              </span>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="form-proceso">
            
            {/* Proceso */}
            <div className="form-group">
              <label>Proceso *</label>
              <select
                name="proceso_id"
                value={formData.proceso_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione proceso</option>
                {procesos.map(proceso => (
                  <option key={proceso.proceso_id} value={proceso.proceso_id}>
                    {proceso.orden}. {proceso.nombre}
                    {proceso.es_opcional && ' (Opcional)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Operario */}
            <div className="form-group">
              <label>Operario</label>
              <input
                type="text"
                name="operario"
                value={formData.operario}
                onChange={handleInputChange}
                placeholder="Nombre del operario"
              />
            </div>

            {/* Temperatura */}
            <div className="form-group">
              <label>Temperatura (°C)</label>
              <input
                type="number"
                step="0.1"
                name="temperatura"
                value={formData.temperatura}
                onChange={handleInputChange}
                placeholder="Ej: 15.5"
              />
            </div>

            {/* Peso entrada */}
            <div className="form-group">
              <label>Peso Entrada (kg)</label>
              <input
                type="number"
                step="0.1"
                name="peso_entrada"
                value={formData.peso_entrada}
                onChange={handleInputChange}
                placeholder="Ej: 696.0"
              />
            </div>

            {/* Peso salida */}
            <div className="form-group">
              <label>Peso Salida (kg)</label>
              <input
                type="number"
                step="0.1"
                name="peso_salida"
                value={formData.peso_salida}
                onChange={handleInputChange}
                placeholder="Ej: 680.5"
              />
            </div>

            {/* Calibre */}
            <div className="form-group">
              <label>Calibre</label>
              <input
                type="text"
                name="calibre"
                value={formData.calibre}
                onChange={handleInputChange}
                placeholder="Ej: 88, 80, 70"
              />
            </div>

            {/* Observaciones */}
            <div className="form-group full-width">
              <label>Observaciones</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows="3"
                placeholder="Observaciones del proceso..."
              />
            </div>

            {/* Botones */}
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secundario"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primario"
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Registrar Proceso'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarProceso;