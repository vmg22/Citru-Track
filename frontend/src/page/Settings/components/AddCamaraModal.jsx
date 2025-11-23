// AddCamaraModal.jsx

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../../style/addusermodal.css"; 
import { createCamara } from "../../CamaraFrio/service/camaraService";

const AddCamaraModal = ({ isOpen, onClose, onCamaraAdded }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion: "",
    temperatura_aproximada: "", // Obligatorio en la creación
    capacidad_pallets: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Resetear el formulario al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: "",
        ubicacion: "",
        temperatura_aproximada: "",
        capacidad_pallets: "",
      });
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Manejar números para capacidad y temperatura
    const finalValue = (name === "capacidad_pallets" || name === "temperatura_aproximada") 
                       ? parseFloat(value) 
                       : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (
        !formData.nombre ||
        !formData.capacidad_pallets ||
        formData.temperatura_aproximada === "" 
      ) {
        const requiredError =
          "Los campos Nombre, Capacidad y Temperatura son obligatorios.";
        setLocalError(requiredError);
        toast.error(requiredError);
        setIsSubmitting(false);
        return;
      }
      
      const dataToSend = {
        nombre: formData.nombre,
        ubicacion: formData.ubicacion || null,
        // Solo enviamos la temperatura en la creación
        temperatura_aproximada: formData.temperatura_aproximada, 
        capacidad_pallets: parseInt(formData.capacidad_pallets),
      };

      await createCamara(dataToSend);

      toast.success(`Cámara "${formData.nombre}" creada con éxito!`);
      onCamaraAdded(); // Recargar la lista principal
      onClose();

    } catch (err) {
      const apiError =
        err.response?.data?.error ||
        "Error al crear la cámara. Por favor, intenta nuevamente.";
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
            <i className="fas fa-plus-circle"></i> Agregar Nueva Cámara
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
                value={formData.nombre}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: Cámara Fría N° 1"
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
                value={formData.ubicacion}
                onChange={handleChange}
                className="form-input"
                placeholder="Sector o referencia física"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="capacidad_pallets">
                Capacidad (Pallets) <span className="required-star">*</span>
              </label>
              <input
                type="number"
                id="capacidad_pallets"
                name="capacidad_pallets"
                value={formData.capacidad_pallets}
                onChange={handleChange}
                className="form-input"
                placeholder="Máximo de pallets"
                required
                min="1"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="temperatura_aproximada">
                Temperatura (°C) <span className="required-star">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                id="temperatura_aproximada"
                name="temperatura_aproximada"
                value={formData.temperatura_aproximada}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: 5.5"
                required
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
                <i className="fas fa-check"></i> Crear Cámara
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCamaraModal;