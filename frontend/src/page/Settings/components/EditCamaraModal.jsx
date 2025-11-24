// EditCamaraModal.jsx

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

import "../../../style/addusermodal.css"; 
import { editCamara } from "../../CamaraFrio/service/camaraService";

const EditCamaraModal = ({ isOpen, onClose, camaraData, onCamaraUpdated }) => {
  const [formData, setFormData] = useState(camaraData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (camaraData) {
      setFormData(camaraData);
      setLocalError(null);
    }
  }, [camaraData]);

  if (!isOpen || !camaraData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === "capacidad_pallets" ? parseInt(value) : value; 
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (!formData.nombre || !formData.capacidad_pallets) {
        const requiredError = "Los campos Nombre y Capacidad son obligatorios.";
        setLocalError(requiredError);
        toast.error(requiredError);
        setIsSubmitting(false);
        return;
      }
      
      const dataToSend = {
        nombre: formData.nombre,
        ubicacion: formData.ubicacion || null,
        capacidad_pallets: parseInt(formData.capacidad_pallets),
      };

      // Llamada al servicio que usa PUT/PATCH y la ruta /api/camaras/:id
      await editCamara(camaraData.camara_id, dataToSend);

      toast.success(`Cámara "${formData.nombre}" actualizada con éxito!`);

      onCamaraUpdated(); // Recargar la lista
      onClose();

    } catch (err) {
      const apiError =
        err.response?.data?.error ||
        "Error al actualizar la cámara. Por favor, intenta nuevamente.";
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
            <i className="fas fa-edit"></i> Editar Cámara: {camaraData.nombre}
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
                Nombre de la Cámara <span className="required-star">*</span>
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
              <label className="form-label" htmlFor="ubicacion">
                Ubicación
              </label>
              <input
                type="text"
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="temperatura_aproximada_display">
                Temperatura (°C)
              </label>
              <input
                type="text"
                id="temperatura_aproximada_display"
                value={formData.temperatura_aproximada || 'N/A'}
                className="form-input"
                disabled
              />
              <p className="form-hint">
                <i className="fas fa-lock"></i> La temperatura no se puede modificar.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="capacidad_pallets">
                Capacidad (Pallets) <span className="required-star">*</span>
              </label>
              <input
                type="number"
                id="capacidad_pallets"
                name="capacidad_pallets"
                value={formData.capacidad_pallets || ''}
                onChange={handleChange}
                className="form-input"
                required
                min="1"
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

export default EditCamaraModal;