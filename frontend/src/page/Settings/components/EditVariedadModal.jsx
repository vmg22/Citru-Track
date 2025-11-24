import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../../style/addusermodal.css"; 
import { updateVariedad } from "../services/settingsServices";

const EditVariedadModal = ({ isOpen, onClose, variedadData, onVariedadUpdated }) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (variedadData) {
      setFormData({
        nombre: variedadData.nombre || '',
        descripcion: variedadData.descripcion || '',
      });
      setLocalError(null);
    }
  }, [variedadData]);

  if (!isOpen || !variedadData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (!formData.nombre) {
        setLocalError("El nombre de la variedad es obligatorio.");
        toast.error("El nombre de la variedad es obligatorio.");
        setIsSubmitting(false);
        return;
      }

      const dataToSend = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
      };
      await updateVariedad(variedadData.variedad_id, dataToSend); 

      toast.success(`Variedad "${formData.nombre}" actualizada con éxito!`);
      
      onVariedadUpdated(); // Recargar la lista principal
      onClose();

    } catch (err) {
      const apiError =
        err.response?.data?.error ||
        "Error al actualizar la variedad. Por favor, intenta nuevamente.";
      toast.error(apiError);
      setLocalError(apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            <i className="fas fa-edit"></i> Editar Variedad: {variedadData.nombre}
          </h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {localError && <div className="modal-error">{localError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="nombre">
                Nombre de la Variedad <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre || ''}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="descripcion">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion || ''}
                onChange={handleChange}
                className="form-input"
                rows="3"
              />
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="modal-btn modal-btn-cancel"
            disabled={isSubmitting}
          >
            <i className="fas fa-times"></i> Cancelar
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            className="modal-btn modal-btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditVariedadModal;