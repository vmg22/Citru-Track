import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import binloteServices from "./services/binloteServices";
import "../../style/binModal.css";
import Swal from "sweetalert2";
import {
  FaWarehouse,
  FaPlusCircle,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

// Componente que contiene el formulario de recepción de bins
const RecepcionBinModal = ({ show, handleClose, onBinRegistered }) => {
  // ⚠️ Importaciones de estado duplicadas del padre, ahora viven aquí:
  const [productores, setProductores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [fincasDisponibles, setFincasDisponibles] = useState([]);
  const [variedadesDisponibles, setVariedadesDisponibles] = useState([]);

  const [formData, setFormData] = useState({
    producto_id: "",
    variedad_id: "",
    productor_id: "",
    finca_id: "",
    fecha_cosecha: "",
    peso_bruto: "",
    remito: "",
    observaciones: "",
    responsable: "Admin",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [remitoValido, setRemitoValido] = useState(null);

  // Reinicia el estado del formulario al abrir el modal
  useEffect(() => {
    if (show) {
      setFormData({
        producto_id: "",
        variedad_id: "",
        productor_id: "",
        finca_id: "",
        fecha_cosecha: "",
        peso_bruto: "",
        remito: "",
        observaciones: "",
        responsable: "Admin",
      });
      setError(null);
      setSuccess(false);
      setRemitoValido(null);
      cargarDatosIniciales();
    }
  }, [show]);

  const cargarDatosIniciales = async () => {
    try {
      const [productoresData, productosData] = await Promise.all([
        binloteServices.getProductores(),
        binloteServices.getProductos(),
      ]);

      setProductores(productoresData.data || []);
      setProductos(productosData.data || []);
      setFincasDisponibles([]);
      setVariedadesDisponibles([]);
    } catch (err) {
      console.error("Error cargando datos iniciales del modal:", err);
      setError("Error al cargar datos de productos/productores");
    }
  };

  // --- Handlers de Formulario (Casi sin cambios) ---
  const handleProductorChange = (e) => {
    const productorId = parseInt(e.target.value);
    setFormData({ ...formData, productor_id: productorId, finca_id: "" });
    const productor = productores.find((p) => p.productor_id === productorId);
    setFincasDisponibles(productor?.fincas || []);
  };

  const handleProductoChange = (e) => {
    const productoId = parseInt(e.target.value);
    setFormData({ ...formData, producto_id: productoId, variedad_id: "" });
    const producto = productos.find((p) => p.producto_id === productoId);
    setVariedadesDisponibles(producto?.variedades || []);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRemitoBlur = async (e) => {
    const remito = e.target.value;
    if (remito.length < 3) {
      setRemitoValido(null);
      return;
    }

    try {
      const response = await binloteServices.validarRemito(remito);
      setRemitoValido(!response.existe);
      if (response.existe) {
        setError("⚠️ Este número de remito ya existe en el sistema");
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Error validando remito:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (
        !formData.producto_id ||
        !formData.fecha_cosecha ||
        !formData.peso_bruto ||
        !formData.remito
      ) {
        setError("Por favor complete todos los campos obligatorios");
        setLoading(false);
        return;
      }

      if (remitoValido === false) {
        setError("El remito ingresado ya existe o es inválido.");
        setLoading(false);
        return;
      }
      // Validar remito en el momento si no se ha hecho
      if (remitoValido === null) {
        const responseCheck = await binloteServices.validarRemito(
          formData.remito
        );
        if (responseCheck.existe) {
          setError("⚠️ Este número de remito ya existe en el sistema");
          setRemitoValido(false);
          setLoading(false);
          return;
        }
      }

      const response = await binloteServices.crearBin({
        producto_id: parseInt(formData.producto_id),
        variedad_id: formData.variedad_id
          ? parseInt(formData.variedad_id)
          : null,
        productor_id: formData.productor_id
          ? parseInt(formData.productor_id)
          : null,
        finca_id: formData.finca_id ? parseInt(formData.finca_id) : null,
        fecha_cosecha: formData.fecha_cosecha,
        peso_bruto: parseFloat(formData.peso_bruto),
        remito: formData.remito,
        observaciones: formData.observaciones,
        responsable: formData.responsable,
      });

      setSuccess(true);
      const binCreado = response.data.bin || response.data;

      Swal.fire({
        icon: "success",
        title: "BIN registrado exitosamente",
        html: `<div style="text-align: left; font-size: 1.1rem;"><hr><p><strong>📦 BIN ID:</strong> ${
          binCreado.bin_id || "N/A"
        }</p><p><strong>⚖️ Peso:</strong> ${
          formData.peso_bruto
        } kg</p><p><strong>📄 Remito:</strong> ${
          formData.remito
        }</p><hr></div>`,
        confirmButtonText: "Aceptar",
      });

      // Llama a la función del padre para recargar la lista
      onBinRegistered();

      // Cerrar el modal después de un pequeño retraso
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (err) {
      console.error("❌ Error creando bin:", err);
      if (err.response?.status === 409) {
        setError("⚠️ El número de remito ya existe en el sistema");
      } else if (err.response?.status === 400) {
        setError(
          "⚠️ Datos inválidos: " +
            (err.response.data.message || "Verifique los campos")
        );
      } else {
        setError(
          "❌ Error al crear el bin: " +
            (err.response?.data?.message || err.message)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null; // Retorna null si no debe mostrarse, como en el modal de chofer

  // Manejador para cerrar el modal al hacer clic en el overlay (fondo oscuro)
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      handleClose();
    }
  };

  // Función para manejar el cierre del modal desde el botón interno
  const handleCloseButton = () => {
    if (!loading) {
      handleClose();
    }
  };

  return (
    // Usamos las clases del modal de chofer para el estilo completo
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" style={{ maxWidth: "650px" }}>
        <div className="modal-header">
          <h3>
            <FaWarehouse style={{ marginRight: "8px" }} />
            Registrar Nuevo Bin
          </h3>
          <button
            className="modal-close-btn"
            onClick={handleCloseButton}
            disabled={loading}
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        {/* Body */}
        <div className="modal-body">
          {error && (
            <div className="modal-error">
              <FaExclamationTriangle style={{ marginRight: "8px" }} /> {error}
            </div>
          )}

          {/* El mensaje de éxito se maneja mejor con Swal, pero lo dejamos por si acaso */}
          {/* {success && (...) } */}

          <form onSubmit={handleSubmit} className="bin-form-modal">
            {/* 1. Productor */}
            <div className="form-group">
              <label className="form-label" htmlFor="productor_id">
                Productor
              </label>
              <select
                id="productor_id"
                name="productor_id"
                value={formData.productor_id}
                onChange={handleProductorChange}
                disabled={loading}
                className="form-input"
              >
                <option value="">Seleccione productor</option>
                {productores.map((productor) => (
                  <option
                    key={productor.productor_id}
                    value={productor.productor_id}
                  >
                    {productor.productor_nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Finca */}
            <div className="form-group">
              <label className="form-label" htmlFor="finca_id">
                Finca
              </label>
              <select
                id="finca_id"
                name="finca_id"
                value={formData.finca_id}
                onChange={handleInputChange}
                disabled={!formData.productor_id || loading}
                className="form-input"
              >
                <option value="">Seleccione finca</option>
                {fincasDisponibles.map((finca) => (
                  <option key={finca.finca_id} value={finca.finca_id}>
                    {finca.nombre} - {finca.ubicacion}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Producto */}
            <div className="form-group">
              <label className="form-label" htmlFor="producto_id">
                Producto <span className="required-star">*</span>
              </label>
              <select
                id="producto_id"
                name="producto_id"
                value={formData.producto_id}
                onChange={handleProductoChange}
                disabled={loading}
                required
                className="form-input"
              >
                <option value="">Seleccione producto</option>
                {productos.map((producto) => (
                  <option
                    key={producto.producto_id}
                    value={producto.producto_id}
                  >
                    {producto.producto_nombre} ({producto.categoria})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Variedad */}
            <div className="form-group">
              <label className="form-label" htmlFor="variedad_id">
                Variedad
              </label>
              <select
                id="variedad_id"
                name="variedad_id"
                value={formData.variedad_id}
                onChange={handleInputChange}
                disabled={!formData.producto_id || loading}
                className="form-input"
              >
                <option value="">Seleccione variedad</option>
                {variedadesDisponibles.map((variedad) => (
                  <option
                    key={variedad.variedad_id}
                    value={variedad.variedad_id}
                  >
                    {variedad.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Fecha cosecha */}
            <div className="form-group">
              <label className="form-label" htmlFor="fecha_cosecha">
                Fecha cosecha <span className="required-star">*</span>
              </label>
              <input
                type="date"
                id="fecha_cosecha"
                name="fecha_cosecha"
                value={formData.fecha_cosecha}
                onChange={handleInputChange}
                disabled={loading}
                required
                className="form-input"
              />
            </div>

            {/* 6. Peso estimado */}
            <div className="form-group">
              <label className="form-label" htmlFor="peso_bruto">
                Peso estimado (kg) <span className="required-star">*</span>
              </label>
              <input
                type="number"
                id="peso_bruto"
                name="peso_bruto"
                value={formData.peso_bruto}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                placeholder="420"
                disabled={loading}
                required
                className="form-input"
              />
            </div>

            {/* 7. Remito */}
            <div className="form-group">
              <label className="form-label" htmlFor="remito">
                Remito <span className="required-star">*</span>
                {remitoValido === false && (
                  <span className="error-text"> ⚠️ Ya existe</span>
                )}
                {remitoValido === true && (
                  <span className="success-text"> ✓ Disponible</span>
                )}
              </label>
              <input
                type="text"
                id="remito"
                name="remito"
                value={formData.remito}
                onChange={handleInputChange}
                onBlur={handleRemitoBlur}
                placeholder="RMT-55422"
                disabled={loading}
                required
                className="form-input"
              />
            </div>

            {/* 8. Observaciones (full width) */}
            <div className="form-group">
              <label className="form-label" htmlFor="observaciones">
                Observaciones
              </label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows="3"
                placeholder="Fruta en buen estado, sin daños visibles"
                disabled={loading}
                className="form-input"
              />
            </div>
          </form>
        </div>
        {/* Footer con el botón de Submit/Cancelar */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleCloseButton}
            className="modal-btn modal-btn-cancel"
            disabled={loading}
          >
            <FaTimes />
            Cancelar
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            className="modal-btn modal-btn-submit"
            disabled={loading || remitoValido === false}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Registrando...
              </>
            ) : (
              <>
                <i class="fa-solid fa-plus"></i>
                Registrar Bin
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecepcionBinModal;
