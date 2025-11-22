import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createCamion, getAllTransportes } from "../services/settingsServices";
import "../../../style/addusermodal.css";


const AddCamionModal = ({ isOpen, onClose, onCamionAdded }) => {
  const [formData, setFormData] = useState({
    transportista_id: '',
    patente: '',
    patente_acoplado: '',
    tipo_camion: "",
    capacidad_pallets: '',
    temp_min: '',
    temp_max: '',
    ultima_desinfeccion: '',
    documentos: ''
  });

  const [transportes, setTransportes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    const fetchTransportes = async () => {
      try {
        const dataT = await getAllTransportes();
        setTransportes(dataT);

        const defaultId = dataT.length > 0 ? dataT[0].transportista_id : '';
        setFormData(prev => ({ ...prev, transportista_id: defaultId }));
      } catch (err) {
        console.error("Error al cargar transportistas:", err);
        toast.error("Error al cargar la lista de transportistas.");
      }
    };

    if (isOpen) {
      setFormData({
        transportista_id: transportes.length > 0 ? transportes[0].transportista_id : '',
        patente: '',
        patente_acoplado: '',
        tipo_camion: "",
        capacidad_pallets: '',
        temp_min: '',
        temp_max: '',
        ultima_desinfeccion: '',
        documentos: ''
      });
      setLocalError(null);
      fetchTransportes();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    const val = (name === 'transportista_id' || name === 'capacidad_pallets') ? (value ? parseInt(value) : value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (!formData.transportista_id || !formData.patente || !formData.tipo_camion || !formData.capacidad_pallets) {
        const msg = "Los campos Transportista, Patente, Tipo y Capacidad son obligatorios.";
        setLocalError(msg);
        toast.error(msg);
        setIsSubmitting(false);
        return;
      }

      const dataToSend = { ...formData };
      if (dataToSend.temp_min === '') dataToSend.temp_min = null;
      if (dataToSend.temp_max === '') dataToSend.temp_max = null;

      await createCamion(dataToSend);

      toast.success(`Camión ${formData.patente} registrado con éxito!`);
      onCamionAdded();
      onClose();
    } catch (err) {
      const apiError = err.response?.data?.error || "Error al registrar el camión. Por favor, intenta nuevamente.";
      toast.error(apiError);
      setLocalError(apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = e => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-truck"></i>
            Registrar Nuevo Camión
          </h3>
          <button className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {localError && <div className="modal-error">{localError}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="transportista_id">
                  Transportista <span className="required-star">*</span>
                </label>
                <select
                  id="transportista_id"
                  name="transportista_id"
                  value={formData.transportista_id}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={transportes.length === 0 || isSubmitting}
                >
                  {transportes.length > 0 ? (
                    transportes.map(t => (
                      <option key={t.transportista_id} value={t.transportista_id}>
                        {t.nombre}
                      </option>
                    ))
                  ) : (
                    <option value="">Cargando...</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="patente">
                  Patente Principal <span className="required-star">*</span>
                </label>
                <input type="text" id="patente" name="patente" value={formData.patente} onChange={handleChange} className="form-input" placeholder="Ej: AA123BC" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="patente_acoplado">Patente Acoplado</label>
                <input type="text" id="patente_acoplado" name="patente_acoplado" value={formData.patente_acoplado} onChange={handleChange} className="form-input" placeholder="Opcional" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tipo_camion">
                  Tipo de Camión <span className="required-star">*</span>
                </label>
                <input type="text" id="tipo_camion" name="tipo_camion" value={formData.tipo_camion} onChange={handleChange} className="form-input" placeholder="Opcional" />

              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="capacidad_pallets">
                  Capacidad Pallets <span className="required-star">*</span>
                </label>
                <input type="number" id="capacidad_pallets" name="capacidad_pallets" value={formData.capacidad_pallets} onChange={handleChange} className="form-input" placeholder="Ej: 22" min="1" required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ultima_desinfeccion">Última Desinfección</label>
                <input type="date" id="ultima_desinfeccion" name="ultima_desinfeccion" value={formData.ultima_desinfeccion} onChange={handleChange} className="form-input" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="temp_min">Temp Mínima (°C)</label>
                <input type="number" step="0.1" id="temp_min" name="temp_min" value={formData.temp_min} onChange={handleChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="temp_max">Temp Máxima (°C)</label>
                <input type="number" step="0.1" id="temp_max" name="temp_max" value={formData.temp_max} onChange={handleChange} className="form-input" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="documentos">Documentos / Notas (Opcional)</label>
              <textarea id="documentos" name="documentos" value={formData.documentos} onChange={handleChange} className="form-input" rows="3" placeholder="Detalles de documentación o notas." />
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="modal-btn modal-btn-cancel" disabled={isSubmitting}>
            <i className="fas fa-times"></i>
            Cancelar
          </button>
          <button type="submit" onClick={handleSubmit} className="modal-btn modal-btn-submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Registrar Camión
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCamionModal;
