import React, { useState, useEffect } from "react";
import binloteServices from "./services/binloteServices";
import "../../style/bins.css";
// Importar Modal y Button de react-bootstrap
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { FaWarehouse, FaUserCircle, FaPlusCircle } from "react-icons/fa"; // Icono para el botón
import RecepcionBinModal from "./RecepcionBinModal";
// Importar el nuevo componente Modal

const BinsPage = () => {
  // ⚠️ Se eliminan los estados del formulario (formData, remitoValido, success, etc.)
  // YA QUE AHORA VIVEN DENTRO DEL MODAL.

  const [productores, setProductores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [fincasDisponibles, setFincasDisponibles] = useState([]);
  const [variedadesDisponibles, setVariedadesDisponibles] = useState([]);
  const [binsRecientes, setBinsRecientes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🎯 NUEVO ESTADO: Controla la visibilidad del modal
  const [showRecepcionModal, setShowRecepcionModal] = useState(false);

  useEffect(() => {
    // Solo cargar datos de Bins Recientes al inicio (el modal carga sus propios datos)
    loadBinsRecientes();
  }, []);

  const loadBinsRecientes = async () => {
    try {
      setLoading(true);
      const binsData = await binloteServices.getBinsRecientes(10);
      setBinsRecientes(binsData.data || []);
      setError(null);
    } catch (err) {
      console.error("Error cargando bins recientes:", err);
      setError("Error al cargar los bins recientes.");
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la acción de registro exitoso en el modal
  const handleBinRegistered = () => {
    // Cerrar el modal y recargar la lista
    handleCloseRecepcionModal();
    loadBinsRecientes();
  };

  // Handlers del Modal
  const handleShowRecepcionModal = () => setShowRecepcionModal(true);
  const handleCloseRecepcionModal = () => setShowRecepcionModal(false);

  // --- Funciones de Formato y Estado (Se mantienen) ---
  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    try {
      return new Date(fecha).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado?.toLowerCase()) {
      case "recepción":
        return "status-recepcion";
      case "en proceso":
      case "en_proceso":
        return "status-proceso";
      case "pendiente lote":
      case "pendiente_lote":
        return "status-pendiente";
      case "loteado":
        return "status-loteado";
      default:
        return "status-default";
    }
  };

  // --- Funciones de Paginación (Se mantienen) ---
  const getPaginatedBins = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = binsRecientes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(binsRecientes.length / itemsPerPage);
    return { currentItems, totalPages, totalItems: binsRecientes.length };
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    // ... (Lógica de paginación se mantiene) ...
    const { totalPages } = getPaginatedBins();
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="recepcion-bin-container">
      <div className="stock-header">
        <h1 className="stock-title">
          <i className="fas fa-warehouse"></i> Recepción de Bins
        </h1>
        <div className="monitoreo-user-info">
          <i className="fas fa-user-circle"></i>
          <span>Supervisor de Planta</span>
        </div>
      </div>

      {/* 🎯 BOTÓN PARA ABRIR EL MODAL */}
      <div className="divBtnRegistrarBin mb-4">
        <Button
          variant="success"
          onClick={handleShowRecepcionModal}
          className="btn-registrar-bin-main"
        >
          <i class="fa-solid fa-plus"></i> Registrar Bin
        </Button>
      </div>

      {/* Mensajes de error (ahora manejados en el padre si son globales) */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ⚠️ El Formulario ya NO está aquí, se movió al modal. */}

      {/* Bins recientes */}
      <div className="bins-recientes">
        <h3>Bins recientes</h3>
        {binsRecientes.length === 0 ? (
          <p>No hay bins registrados</p>
        ) : (
          <>
            <ul className="bins-card-grid">
              {getPaginatedBins().currentItems.map((bin) => (
                <li key={bin.bin_id} className="bin-card">
                  <div className="bin-header">
                    <strong>{bin.bin_id}</strong>
                    <span
                      className={`bin-status-badge ${getEstadoClass(
                        bin.estado_actual
                      )}`}
                    >
                      {bin.estado_actual}
                    </span>
                  </div>
                  <div className="bin-info">
                    {bin.producto_nombre}{" "}
                    {bin.variedad_nombre && `- ${bin.variedad_nombre}`}
                  </div>
                  <div className="bin-details">
                    {/* APLICAMOS toFixed(2) DIRECTAMENTE EN LA EXPRESIÓN */}
                    Remito: {bin.remito} | Peso: {parseFloat(bin.peso_bruto).toFixed(2)} kg
                  </div>
                  <div className="bin-meta">
                    <small>
                      Ingreso: {formatearFecha(bin.fecha_ingreso_bin)}
                    </small>
                  </div>
                </li>
              ))}
            </ul>

            {/* Paginación (Se mantiene) */}
            {getPaginatedBins().totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center mt-4 mb-3 paginationBin">
                <nav>
                  <ul className="pagination mb-0">
                    <li
                      className={`page-item ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    {getPageNumbers().map((page, index) => (
                      <li
                        key={index}
                        className={`page-item ${
                          page === currentPage ? "active" : ""
                        } ${page === "..." ? "disabled" : ""}`}
                      >
                        {page === "..." ? (
                          <span className="page-link">...</span>
                        ) : (
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        )}
                      </li>
                    ))}
                    <li
                      className={`page-item ${
                        currentPage === getPaginatedBins().totalPages
                          ? "disabled"
                          : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getPaginatedBins().totalPages}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
            <div className="mt-3 text-muted small px-2 d-flex justify-content-between align-items-center">
              <span>
                Mostrando{" "}
                {getPaginatedBins().currentItems.length > 0
                  ? (currentPage - 1) * itemsPerPage + 1
                  : 0}{" "}
                -{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  getPaginatedBins().totalItems
                )}{" "}
                de {getPaginatedBins().totalItems} registros
              </span>
            </div>
          </>
        )}
      </div>

      <RecepcionBinModal
        show={showRecepcionModal}
        handleClose={handleCloseRecepcionModal}
        onBinRegistered={handleBinRegistered}
      />
    </div>
  );
};

export default BinsPage;
