import React, { useState, useEffect, useCallback } from "react";
import {
  deleteCamara,
  getAllCamaras,
} from "../../CamaraFrio/service/camaraService";
import { toast } from "react-toastify";
import "../../../style/camaraconfig.css";
import AddCamaraModal from "./AddCamaraModal";
import EditCamaraModal from "./EditCamaraModal";

const Camara = () => {
  const [camaras, setCamaras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [camaraToEdit, setCamaraToEdit] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllCamaras();
      setCamaras(data);
    } catch (error) {
      console.error("Error al cargar datos de Cámaras:", error);
      toast.error("Error al cargar la lista de cámaras.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddCamara = () => {
    setIsAddModalOpen(true);
  };

  const handleEditCamara = (camara) => {
    setCamaraToEdit(camara);
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setCamaraToEdit(null);
  };
  console.log(camaras);
  const handleDataChange = () => {
    fetchData();
  };

  const handleEliminarCamara = async (camara_id, nombre) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        toast.warn(
          ({ closeToast }) => (
            <div style={{ padding: "10px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Confirmar Eliminación
              </p>
              <p style={{ fontSize: "0.9em" }}>
                ¿Estás seguro que quieres eliminar la cámara:
                <strong>{nombre}</strong>?
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  style={{
                    padding: "5px 10px",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "#ccc",
                  }}
                  onClick={() => {
                    closeToast();
                    reject(new Error("Operación cancelada"));
                  }}
                >
                  Cancelar
                </button>

                <button
                  style={{
                    padding: "5px 10px",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "#dc3545",
                    color: "white",
                  }}
                  onClick={async () => {
                    closeToast();
                    try {
                      await deleteCamara(camara_id);
                      await fetchData();
                      resolve();
                    } catch (error) {
                      reject(error);
                    }
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ),
          {
            closeButton: false,
            autoClose: false,
            position: "top-center",
          }
        );
      }),
      {
        pending: "Desactivando cámara...",
        success: "Cámara desactivada correctamente",
        error: {
          render({ data }) {
            if (data.message === "Operación cancelada") {
              return "Operación cancelada";
            }
            return "Error al desactivar la cámara";
          },
        },
      }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR");
  };

  const getStatus = (temperatura) => {
    const temp = parseFloat(temperatura);
    return temp > 20 ? "alerta" : "normal";
  };

  const getStatusClass = (temperatura) => {
    return getStatus(temperatura) === "alerta"
      ? "camara-status-alerta"
      : "camara-status-normal";
  };

  const getStatusText = (temperatura) => {
    return getStatus(temperatura) === "alerta"
      ? "Alerta Temperatura"
      : "Normal";
  };

  if (loading) {
    return (
      <div className="camara-config-container">
        <div className="camara-loading-state">Cargando datos de cámaras...</div>
      </div>
    );
  }

  return (
    <div className="camara-config-container">
      <div className="camara-config-section">
        {/* Header con título y botones */}
        <div className="camara-table-header">
          <h2>
            <i className="fa-solid fa-snowflake"></i>
            Gestión de Cámaras de Frío
          </h2>
          <div className="camara-table-actions">
            <button
              className="camara-btn camara-btn-primary"
              onClick={handleAddCamara}
            >
              <i className="fas fa-plus"></i> Agregar Cámara
            </button>
            <button
              className="camara-btn camara-btn-secondary"
              style={{ marginLeft: "10px" }}
            >
              <i className="fas fa-file-export"></i> Exportar Lista
            </button>
          </div>
        </div>

        {/* Tabla de Cámaras */}
        <div className="camara-table-wrapper">
          <table className="camara-table">
            <thead>
              <tr>
                <th className="camara-table-header-cell">ID</th>
                <th className="camara-table-header-cell">Nombre</th>
                <th className="camara-table-header-cell">Temperatura</th>
                <th className="camara-table-header-cell">Capacidad</th>
                <th className="camara-table-header-cell">Ubicación</th>
                <th className="camara-table-header-cell">Estado</th>
                <th className="camara-table-header-cell">Fecha Registro</th>
                <th className="camara-table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {camaras.data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="camara-empty-state">
                    No se encontraron cámaras.
                  </td>
                </tr>
              ) : (
                camaras.data.map((camara) => (
                  <tr key={camara.camara_id}>
                    <td className="camara-table-cell">
                          <span className="camara-capacity-badge">
                            {camara.camara_id}
                          </span>
                        </td>
                    <td className="camara-table-cell">{camara.nombre}</td>
                    <td className="camara-table-cell">
                      <span
                        className={`camara-temperature-badge ${getStatusClass(
                          camara.temperatura_aproximada
                        )}`}
                      >
                        <i className="fas fa-thermometer-half"></i>
                        {camara.temperatura_aproximada}°C
                      </span>
                    </td>
                    <td className="camara-table-cell">
                      <span className="camara-capacity-badge">
                        <i className="fas fa-pallet"></i>
                        {camara.capacidad_pallets} pallets
                      </span>
                    </td>
                    <td className="camara-table-cell">
                      {camara.ubicacion ? (
                        <span
                          className="camara-location-text"
                          title={camara.ubicacion}
                        >
                          <i className="fas fa-map-marker-alt"></i>
                          {camara.ubicacion.length > 30
                            ? `${camara.ubicacion.substring(0, 30)}...`
                            : camara.ubicacion}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="camara-table-cell">
                      <span
                        className={`camara-status-badge ${getStatusClass(
                          camara.temperatura_aproximada
                        )}`}
                      >
                        {getStatusText(camara.temperatura_aproximada)}
                      </span>
                    </td>
                    <td className="camara-table-cell">
                      {formatDate(camara.created_at)}
                    </td>
                    <td className="camara-table-cell">
                      <button
                        className="camara-btn-warning camara-action-btn"
                        title="Editar cámara"
                        onClick={() => handleEditCamara(camara)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="camara-btn-danger camara-action-btn"
                        title="Desactivar cámara"
                        style={{ marginLeft: "5px" }}
                        onClick={() =>
                          handleEliminarCamara(camara.camara_id, camara.nombre)
                        }
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddCamaraModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModals}
        onCamaraAdded={handleDataChange}
      />

      <EditCamaraModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        camaraData={camaraToEdit}
        onCamaraUpdated={handleDataChange}
      />
    </div>
  );
};

export default Camara;
