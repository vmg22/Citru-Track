import React, { useState, useEffect, useCallback } from "react";
import {
  eliminarProductor,
  getAllProductores,
} from "../services/settingsServices";
import { toast } from "react-toastify";
import "../../../style/productores.css";
import AddProductoresModal from "./AddProductoresModal";
import EditProductoresModal from "./EditProductoresModal";

const Productores = () => {
  const [productores, setProductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productorToEdit, setProductorToEdit] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllProductores();
      setProductores(data);
    } catch (error) {
      console.error("Error al cargar datos de Productores:", error);
      toast.error("Error al cargar la lista de productores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddProductor = () => {
    setIsAddModalOpen(true);
  };

  const handleEditProductor = (productor) => {
    setProductorToEdit(productor);
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setProductorToEdit(null);
  };

  const handleDataChange = () => {
    fetchData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR");
  };

  const handleEliminarProductor = async (productor_id, nombreProductor) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        toast.warn(
          ({ closeToast }) => (
            <div style={{ padding: "10px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Confirmar Eliminación
              </p>
              <p style={{ fontSize: "0.9em" }}>
                ¿Estás seguro que quieres eliminar al productor:{" "}
                <strong>{nombreProductor}</strong>?
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
                      await eliminarProductor(productor_id);
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
        pending: "Eliminando productor...",
        success: "Productor eliminado correctamente",
        error: {
          render({ data }) {
            if (data.message === "Operación cancelada") {
              return "Eliminación cancelada";
            }
            return "Error al eliminar el productor";
          }
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="camara-config-container">
        <div className="camara-loading-state">
          Cargando datos de productores...
        </div>
      </div>
    );
  }

  return (
    <div className="camara-config-container">
      <div className="camara-config-section">
        {/* Header con título y botones */}
        <div className="camara-table-header">
          <h2>
            <i className="fas fa-tractor"></i>
            Gestión de Productores
          </h2>
          <div className="camara-table-actions">
            <button
              className="camara-btn camara-btn-primary"
              onClick={handleAddProductor}
            >
              <i className="fas fa-plus"></i> Agregar Productor
            </button>
            <button
              className="camara-btn camara-btn-secondary"
              style={{ marginLeft: "10px" }}
            >
              <i className="fas fa-file-export"></i> Exportar Lista
            </button>
          </div>
        </div>

        {/* Tabla de Productores */}
        <div className="camara-table-wrapper">
          <table className="camara-table">
            <thead>
              <tr>
                <th className="camara-table-header-cell">ID</th>
                <th className="camara-table-header-cell">Nombre</th>
                <th className="camara-table-header-cell">CUIT</th>
                <th className="camara-table-header-cell">Teléfono</th>
                <th className="camara-table-header-cell">Dirección</th>
                <th className="camara-table-header-cell">Contactos/Notas</th>
                <th className="camara-table-header-cell">Fecha Registro</th>
                <th className="camara-table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productores.length === 0 ? (
                <tr>
                  <td colSpan="8" className="camara-empty-state">
                    No se encontraron productores.
                  </td>
                </tr>
              ) : (
                productores.map((productor) => (
                  <tr key={productor.productor_id}>
                    <td className="camara-table-cell">
                      {productor.productor_id}
                    </td>
                    <td className="camara-table-cell">
                      {productor.nombre}
                    </td>
                    <td className="camara-table-cell">
                      {productor.cuit ? (
                        <span>
                          {productor.cuit}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="camara-table-cell">
                        {productor.telefono ? (
                          <span className="camara-temperature-badge">
                            <i className="fas fa-phone"></i>
                            {productor.telefono}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                    <td className="camara-table-cell">
                      {productor.direccion ? (
                        <span
                          className="camara-location-text"
                          title={productor.direccion}
                        >
                          {productor.direccion.length > 30
                            ? `${productor.direccion.substring(0, 30)}...`
                            : productor.direccion}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="camara-table-cell">
                      {productor.contactos ? (
                        <span
                          title={productor.contactos}
                        >
                          {productor.contactos.length > 25
                            ? `${productor.contactos.substring(0, 25)}...`
                            : productor.contactos}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="camara-table-cell">
                      {formatDate(productor.created_at)}
                    </td>
                    <td className="camara-table-cell">
                      <button
                        className="camara-btn-warning camara-action-btn"
                        title="Editar productor"
                        onClick={() => handleEditProductor(productor)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="camara-btn-danger camara-action-btn"
                        title="Eliminar productor"
                        style={{ marginLeft: "5px" }}
                        onClick={() =>
                          handleEliminarProductor(productor.productor_id, productor.nombre)
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

      <AddProductoresModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModals}
        onProductorAdded={handleDataChange}
      />

      <EditProductoresModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        productorData={productorToEdit}
        onProductorUpdated={handleDataChange}
      />
    </div>
  );
};

export default Productores;