// EditProductModal.jsx

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../../style/addusermodal.css"; 
import { updateProductById } from "../services/settingsServices";

const CATEGORIES = [
  "Fruta cítrica",
  "Fruta tropical",
  "Fruta fina",
  "Derivado de la caña de azúcar",
  "Otros",
];

const UNIDADES = ["kg", "L", "un"];

const EditProductoModal = ({ isOpen, onClose, productData, onProductUpdated }) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (productData) {
      setFormData(productData);
      setLocalError(null);
    }
  }, [productData]);

  if (!isOpen || !productData) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue;

    if (type === "checkbox") {
      finalValue = checked ? 1 : 0;
    } else {
      finalValue = value;
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (!formData.nombre || !formData.categoria || !formData.unidad_base) {
        const requiredError =
          "Los campos Nombre, Categoría y Unidad Base son obligatorios.";
        setLocalError(requiredError);
        toast.error(requiredError);
        setIsSubmitting(false);
        return;
      }

      const dataToSend = {
        ...formData,
        perecedero: parseInt(formData.perecedero),
        requiere_frio: parseInt(formData.requiere_frio),
        permite_sublotes: parseInt(formData.permite_sublotes),
      };
      
      await updateProductById(productData.producto_id, dataToSend);

      toast.success(`Producto "${formData.nombre}" actualizado con éxito!`);

      onProductUpdated(); 
      onClose();

    } catch (err) {
      const apiError =
        err.response?.data?.error ||
        "Error al actualizar el producto. Por favor, intenta nuevamente.";
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
            <i className="fas fa-edit"></i> Editar Producto: {productData.nombre}
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
                Nombre <span className="required-star">*</span>
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
              <label className="form-label" htmlFor="categoria">
                Categoría <span className="required-star">*</span>
              </label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria || ''}
                onChange={handleChange}
                className="form-input"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="unidad_base">
                Unidad Base <span className="required-star">*</span>
              </label>
              <select
                id="unidad_base"
                name="unidad_base"
                value={formData.unidad_base || ''}
                onChange={handleChange}
                className="form-input"
                required
              >
                {UNIDADES.map((un) => (
                  <option key={un} value={un}>
                    {un}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="checkbox"
                  id="perecedero"
                  name="perecedero"
                  checked={formData.perecedero === 1}
                  onChange={handleChange}
                />
                <label htmlFor="perecedero">Es Perecedero</label>
              </div>
              <div className="form-group">
                <input
                  type="checkbox"
                  id="requiere_frio"
                  name="requiere_frio"
                  checked={formData.requiere_frio === 1}
                  onChange={handleChange}
                />
                <label htmlFor="requiere_frio">Requiere Frío</label>
              </div>

              <div className="form-group">
                <input
                  type="checkbox"
                  id="permite_sublotes"
                  name="permite_sublotes"
                  checked={formData.permite_sublotes === 1}
                  onChange={handleChange}
                />
                <label htmlFor="permite_sublotes">Permite Sublotes</label>
              </div>
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

export default EditProductoModal;