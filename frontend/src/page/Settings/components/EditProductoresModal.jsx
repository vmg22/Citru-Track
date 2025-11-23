// EditProductoresModal.jsx

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../../style/addusermodal.css"; 
import { editProductor } from "../services/settingsServices";

const EditProductoresModal = ({ isOpen, onClose, productorData, onProductorUpdated }) => {
  const [formData, setFormData] = useState(productorData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Sincroniza el estado local con los datos pasados por props
  useEffect(() => {
    if (productorData) {
      setFormData(productorData);
    }
  }, [productorData]);

  if (!isOpen || !productorData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (!formData.nombre || !formData.cuit) {
        const requiredError = "Los campos Nombre y CUIT son obligatorios.";
        setLocalError(requiredError);
        toast.error(requiredError);
        setIsSubmitting(false);
        return;
      }
      
      const dataToSend = {
        nombre: formData.nombre,
        cuit: formData.cuit,
        direccion: formData.direccion || null,
        telefono: formData.telefono || null,
        contactos: formData.contactos || null,
        // No enviamos productor_id en el body si se usa en la URL
      };

      await editProductor(productorData.productor_id, dataToSend);

      toast.success(`Productor ${formData.nombre} actualizado con éxito!`);

      onProductorUpdated(); 
      onClose();

    } catch (err) {
      const apiError =
        err.response?.data?.error ||
        "Error al actualizar el productor. Por favor, intenta nuevamente.";
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
            <i className="fas fa-edit"></i>
            Editar Productor: {productorData.nombre}
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
            {/* Campos del formulario... (Mismos que AddProductoresModal, pero pre-llenados) */}
            <div className="form-group">
              <label className="form-label" htmlFor="nombre">
                Nombre o Razón Social <span className="required-star">*</span>
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
              <label className="form-label" htmlFor="cuit">
                CUIT <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="cuit"
                name="cuit"
                value={formData.cuit || ''}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="direccion">
                Dirección
              </label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="telefono">
                Teléfono
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contactos">
                Contactos/Notas
              </label>
              <textarea
                id="contactos"
                name="contactos"
                value={formData.contactos || ''}
                onChange={handleChange}
                className="form-input"
                rows="2"
              ></textarea>
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
            <i className="fas fa-times"></i>
            Cancelar
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            className="modal-btn modal-btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Actualizando...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProductoresModal;