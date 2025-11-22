import React, { useEffect, useState } from "react";
import {
  eliminarChofer,
  eliminarTransportista,
  getAllChoferes,
  getAllTransportes,
} from "../services/settingsServices";
import "../../../style/chofertransporte.css";
import { toast } from "react-toastify";
import AddChoferModal from "./AddChoferModal";
import EditChoferModal from "./EditChoferModal";
import AddTransportistaModal from "./AddTransportistaModal";
import EditTransportistaModal from "./EditTransportistaModal";

const ChoferTransporte = () => {
  const [choferes, setChoferes] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isChoferModalOpen, setIsChoferModalOpen] = useState(false);

  const [isEditChoferModalOpen, setIsEditChoferModalOpen] = useState(false);
  const [choferToEdit, setChoferToEdit] = useState(null);

  const [isTransportistaModalOpen, setIsTransportistaModalOpen] =
    useState(false);
  const [isEditTransportistaModalOpen, setIsEditTransportistaModalOpen] =
    useState(false);
  const [transportistaToEdit, setTransportistaToEdit] = useState(null);

  const fetchChoferes = async () => {
    try {
      const dataC = await getAllChoferes();
      setChoferes(dataC);
    } catch (error) {
      console.error("Error al cargar choferes:", error);
      toast.error("Error al cargar la lista de choferes.");
    }
  };

  const fetchTransportes = async () => {
    try {
      const dataT = await getAllTransportes();
      setTransportes(dataT);
    } catch (error) {
      console.error("Error al cargar transportistas:", error);
      toast.error("Error al cargar la lista de transportistas.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchChoferes();
      await fetchTransportes();
      setLoading(false);
    };
    fetchData();
  }, []);

  const openChoferModal = () => setIsChoferModalOpen(true);
  const closeChoferModal = () => setIsChoferModalOpen(false);

  const openEditChoferModal = (chofer) => {
    setChoferToEdit(chofer);
    setIsEditChoferModalOpen(true);
  };

  const closeEditChoferModal = () => {
    setIsEditChoferModalOpen(false);
    setChoferToEdit(null);
  };

  const handleChoferAction = () => {
    fetchChoferes();
  };

  const openTransportistaModal = () => setIsTransportistaModalOpen(true);
  const closeTransportistaModal = () => setIsTransportistaModalOpen(false);
  const openEditTransportistaModal = (transporte) => {
    setTransportistaToEdit(transporte);
    setIsEditTransportistaModalOpen(true);
  };
  const closeEditTransportistaModal = () => {
    setIsEditTransportistaModalOpen(false);
    setTransportistaToEdit(null);
  };

  const handleTransportistaAction = () => {
    fetchTransportes();
    fetchChoferes();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR");
  };

  const handleEliminarChofer = async (chofer_id, nombreChofer) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        toast.warn(
          ({ closeToast }) => (
            <div style={{ padding: "10px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Confirmar Eliminación
              </p>
              <p style={{ fontSize: "0.9em" }}>
                ¿Estás seguro que quieres desactivar al conductor:{" "}
                <strong>{nombreChofer}</strong>?
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
                      await eliminarChofer(chofer_id);
                      fetchChoferes();
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
            pending: "Esperando confirmación...",
            success: "Conductor eliminado correctamente",
            error: {
              render({ data }) {
                return data.message === "Operación cancelada"
                  ? "Eliminación cancelada"
                  : "Error al eliminar el conductor";
              },
            },
            closeButton: false,
            autoClose: false,
            position: "top-center",
          }
        );
      }),
      {
        pending: "Eliminando conductor...",
        success: "Conductor eliminado correctamente",
        error: {
          render({ data }) {
            if (data.message === "Operación cancelada") {
              return "Eliminación cancelada";
            }
            return "Error al eliminar el conductor";
          },
        },
      }
    );
  };

  const handleEliminarTransportista = async (
    transportista_id,
    nombreTransportista
  ) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        toast.warn(
          ({ closeToast }) => (
            <div style={{ padding: "10px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Confirmar Eliminación
              </p>
              <p style={{ fontSize: "0.9em" }}>
                ¿Estás seguro que quieres eliminar al transportista:{" "}
                <strong>{nombreTransportista}</strong>?
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
                      await eliminarTransportista(transportista_id);
                      handleTransportistaAction();
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
            pending: "Esperando confirmación...",
            success: "Transportista eliminado correctamente",
            error: {
              render: ({ data }) =>
                data.message === "Operación cancelada"
                  ? "Eliminación cancelada"
                  : "Error al eliminar el transportista",
            },
            closeButton: false,
            autoClose: false,
            position: "top-center",
          }
        );
      }),
      {
        pending: "Eliminando transportista...",
        success: "Transportista eliminado correctamente",
        error: {
          render: ({ data }) =>
            data.message === "Operación cancelada"
              ? "Eliminación cancelada"
              : "Error al eliminar el transportista",
        },
      }
    );
  };

  if (loading) {
    return (
      <div className="camara-config-container">
        <div className="camara-loading-state">
          Cargando datos de transporte y choferes...
        </div>
      </div>
    );
  }

  return (
    <div className="camara-config-container">
      <div className="camara-config-section">
        <div className="camara-table-header">
          <h2>
            <i className="fa-solid fa-clipboard-user"></i>
            Gestión de Choferes y Transportistas
          </h2>
        </div>

        <div className="camara-table-header">
          <h3>Choferes ({choferes.length})</h3>
          <div className="camara-table-actions">
            <button
              className="camara-btn camara-btn-primary"
              onClick={openChoferModal}
            >
              <i className="fas fa-user-plus"></i> Agregar Chofer
            </button>
          </div>
        </div>

        <div className="camara-table-wrapper">
          <div className="camara-table-wrapper">
            <table className="camara-table">
              <thead>
                <tr>
                  <th className="camara-table-header-cell">ID</th>
                  <th className="camara-table-header-cell">Nombre Completo</th>
                  <th className="camara-table-header-cell">DNI</th>
                  <th className="camara-table-header-cell">Teléfono</th>
                  <th className="camara-table-header-cell">Categoria</th>
                  <th className="camara-table-header-cell">Vencimiento</th>
                  <th className="camara-table-header-cell">Transportista</th>
                  <th className="camara-table-header-cell">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {choferes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="camara-empty-state">
                      No se encontraron conductores.
                    </td>
                  </tr>
                ) : (
                  choferes.map((chofer) => (
                    <tr key={chofer.chofer_id}>
                      <td className="camara-table-cell">
                        {chofer.chofer_id || "N/A"}
                      </td>

                      <td className="camara-table-cell">
                        {chofer.nombre || "N/A"}
                      </td>

                      <td className="camara-table-cell">
                        {chofer.dni || "N/A"}
                      </td>

                      <td className="camara-table-cell">
                        {chofer.telefono ? (
                          <span className="camara-temperature-badge">
                            <i className="fas fa-phone"></i>
                            {chofer.telefono}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      <td className="camara-table-cell">
                        {chofer.licencia_categoria || "N/A"}
                      </td>

                      <td className="camara-table-cell">
                        {formatDate(chofer.licencia_vencimiento) || "N/A"}
                      </td>

                      <td className="camara-table-cell">
                        <span className="camara-location-text">
                          {chofer.nombre_transportista || "Sin asignar"}
                        </span>
                      </td>

                      <td className="camara-table-cell">
                        <button
                          className="camara-btn-warning camara-action-btn"
                          title="Editar conductor"
                          onClick={() => openEditChoferModal(chofer)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>

                        <button
                          className="camara-btn-danger camara-action-btn"
                          title="Eliminar conductor"
                          style={{ marginLeft: "5px" }}
                          onClick={() =>
                            handleEliminarChofer(
                              chofer.chofer_id,
                              chofer.nombre
                            )
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

        <div className="camara-table-header" style={{ marginTop: "20px" }}>
          <h3>Transportistas ({transportes.length})</h3>

          <div className="camara-table-actions">
            <button
              className="camara-btn camara-btn-primary"
              onClick={openTransportistaModal}
            >
              <i className="fas fa-plus"></i> Agregar Transportista
            </button>
          </div>
        </div>

        <div className="camara-table-wrapper" style={{ marginTop: "2rem" }}>
          <div className="camara-table-wrapper">
            <table className="camara-table">
              <thead>
                <tr>
                  <th className="camara-table-header-cell">ID</th>
                  <th className="camara-table-header-cell">Nombre Empresa</th>
                  <th className="camara-table-header-cell">CUIT</th>
                  <th className="camara-table-header-cell">Contacto</th>
                  <th className="camara-table-header-cell">Teléfono</th>
                  <th className="camara-table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transportes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="camara-empty-state">
                      No se encontraron transportistas.
                    </td>
                  </tr>
                ) : (
                  transportes.map((transporte) => (
                    <tr key={transporte.transportista_id}>
                      <td className="camara-table-cell">
                        {transporte.transportista_id || "N/A"}
                      </td>

                      <td className="camara-table-cell">
                        {transporte.nombre || "N/A"}
                      </td>

                      <td className="camara-table-cell">
                        {transporte.cuit || "N/A"}
                      </td>

                      <td className="camara-table-cell">
                        {transporte.contacto ? (
                          <span className="camara-location-text">
                            <i className="fas fa-user"></i>
                            {transporte.contacto}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      <td className="camara-table-cell">
                        {transporte.telefono ? (
                          <span className="camara-temperature-badge">
                            <i className="fas fa-phone"></i>
                            {transporte.telefono}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      <td className="camara-table-cell">
                        <button
                          className="camara-btn-warning camara-action-btn"
                          title="Editar transportista"
                          onClick={() => openEditTransportistaModal(transporte)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>

                        <button
                          className="camara-btn-danger camara-action-btn"
                          title="Eliminar transportista"
                          style={{ marginLeft: "5px" }}
                          onClick={() =>
                            handleEliminarTransportista(
                              transporte.transportista_id,
                              transporte.nombre
                            )
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
      </div>

      <AddChoferModal
        isOpen={isChoferModalOpen}
        onClose={closeChoferModal}
        onChoferAdded={handleChoferAction}
      />

      <EditChoferModal
        isOpen={isEditChoferModalOpen}
        onClose={closeEditChoferModal}
        onChoferUpdated={handleChoferAction}
        initialChoferData={choferToEdit}
      />

      <AddTransportistaModal
        isOpen={isTransportistaModalOpen}
        onClose={closeTransportistaModal}
        onTransportistaAdded={handleTransportistaAction}
      />

      <EditTransportistaModal
        isOpen={isEditTransportistaModalOpen}
        onClose={closeEditTransportistaModal}
        onTransportistaUpdated={handleTransportistaAction}
        initialTransportistaData={transportistaToEdit}
      />
    </div>
  );
};

export default ChoferTransporte;
