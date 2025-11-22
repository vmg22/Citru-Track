import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { createChofer, getAllTransportes } from "../services/settingsServices";
import "../../../style/addusermodal.css";

const AddChoferModal = ({ isOpen, onClose, onChoferAdded }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    dni: "",
    licencia_categoria: "",
    licencia_vencimiento: "",
    telefono: "",
    transportista_id: ""
  });

  const [transportistas, setTransportistas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    const fetchTransportistas = async () => {
      try {
        const dataT = await getAllTransportes();
        setTransportistas(dataT);

        const defaultTransportistaId =
          dataT.length > 0 ? dataT[0].transportista_id : "";

        setFormData(prev => ({
          ...prev,
          transportista_id: defaultTransportistaId
        }));
      } catch (err) {
        console.error("Error al cargar transportistas:", err);
        toast.error("Error al cargar la lista de transportistas.");
      }
    };

    if (isOpen) {
      setFormData(prev => ({
        nombre: "",
        dni: "",
        licencia_categoria: "",
        licencia_vencimiento: "",
        telefono: "",
        transportista_id: prev.transportista_id
      }));
      setLocalError(null);
      fetchTransportistas();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    const finalValue = name === "transportista_id" ? parseInt(value) : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (
        !formData.nombre ||
        !formData.dni ||
        !formData.licencia_categoria ||
        !formData.licencia_vencimiento ||
        !formData.transportista_id
      ) {
        const requiredError =
          "Los campos Nombre, DNI, Licencia/Categoría, Vencimiento y Transportista son obligatorios.";
        setLocalError(requiredError);
        toast.error(requiredError);
        setIsSubmitting(false);
        return;
      }

      const dataToSend = {
        nombre: formData.nombre,
        dni: formData.dni,
        licencia_categoria: formData.licencia_categoria,
        licencia_vencimiento: formData.licencia_vencimiento,
        telefono: formData.telefono || null,
        transportista_id: formData.transportista_id
      };

      await createChofer(dataToSend);

      toast.success(`Chofer ${formData.nombre} agregado con éxito!`);

      onChoferAdded();
      onClose();

      const defaultTransportistaId =
        transportistas.length > 0 ? transportistas[0].transportista_id : "";

      setFormData({
        nombre: "",
        dni: "",
        licencia_categoria: "",
        licencia_vencimiento: "",
        telefono: "",
        transportista_id: defaultTransportistaId
      });
    } catch (err) {
      const apiError =
        err.response?.data?.error ||
        "Error al crear el chofer. Por favor, intenta nuevamente.";
      toast.error(apiError);
      setLocalError(apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            <i className="fas fa-id-card"></i>
            Agregar Nuevo Chofer
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
              <label className="form-label" htmlFor="transportista_id">
                Transportista Asignado <span className="required-star">*</span>
              </label>
              <select
                id="transportista_id"
                name="transportista_id"
                value={formData.transportista_id}
                onChange={handleChange}
                className="form-input"
                required
                disabled={transportistas.length === 0 || isSubmitting}
              >
                {transportistas.length > 0 ? (
                  transportistas.map(t => (
                    <option key={t.transportista_id} value={t.transportista_id}>
                      {t.nombre} ({t.cuit})
                    </option>
                  ))
                ) : (
                  <option value="">Cargando transportistas...</option>
                )}
              </select>

              {transportistas.length === 0 && (
                <p style={{ color: "red", fontSize: "0.85em", marginTop: "5px" }}>
                  No hay transportistas disponibles.
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="nombre">
                Nombre Completo <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="form-input"
                placeholder="Nombre completo del conductor"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dni">
                DNI <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="dni"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                className="form-input"
                placeholder="Número de identificación (DNI)"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="licencia_categoria">
                Categoría de Licencia <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="licencia_categoria"
                name="licencia_categoria"
                value={formData.licencia_categoria}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: C2, E1, B1"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="licencia_vencimiento">
                Vencimiento Licencia <span className="required-star">*</span>
              </label>
              <input
                type="date"
                id="licencia_vencimiento"
                name="licencia_vencimiento"
                value={formData.licencia_vencimiento}
                onChange={handleChange}
                className="form-input"
                required
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
                Crear Chofer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddChoferModal;
