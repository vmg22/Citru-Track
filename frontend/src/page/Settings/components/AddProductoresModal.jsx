// AddProductoresModal.jsx

import React, { useState } from "react";
import { toast } from "react-toastify";
import { createProductor } from "../services/settingsServices"; 
import "../../../style/addusermodal.css"; 

const AddProductoresModal = ({ isOpen, onClose, onProductorAdded }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    cuit: "",
    direccion: "",
    telefono: "",
    contactos: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  if (!isOpen) return null;

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
        const requiredError =
          "Los campos Nombre y CUIT son obligatorios.";
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
      };

      await createProductor(dataToSend);

      toast.success(`Productor ${formData.nombre} agregado con éxito!`);

      onProductorAdded(); // Recargar la lista principal
      onClose();

      // Limpiar formulario después del éxito
      setFormData({
        nombre: "",
        cuit: "",
        direccion: "",
        telefono: "",
        contactos: "",
      });
    } catch (err) {
      const apiError =
        err.response?.data?.error ||
        "Error al crear el productor. Por favor, intenta nuevamente.";
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
            <i className="fas fa-industry"></i>
            Agregar Nuevo Productor
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
                Nombre o Razón Social <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="form-input"
                placeholder="Nombre del productor/empresa"
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
                value={formData.cuit}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: 30-12345678-9"
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
                value={formData.direccion}
                onChange={handleChange}
                className="form-input"
                placeholder="Calle y número/referencia"
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
                value={formData.telefono}
                onChange={handleChange}
                className="form-input"
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contactos">
                Contactos/Notas
              </label>
              <textarea
                id="contactos"
                name="contactos"
                value={formData.contactos}
                onChange={handleChange}
                className="form-input"
                placeholder="Información adicional de contacto o notas."
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
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Crear Productor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductoresModal;