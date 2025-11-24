import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAllCamiones, getAllTransportes, eliminarCamion } from '../services/settingsServices';
import AddCamionModal from './AddCamionModal';
import EditCamionModal from './EditCamionModal';
import "../../../style/usuariostable.css";

const Camion = () => {
  const [camiones, setCamiones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [camionToEdit, setCamionToEdit] = useState(null);

  const fetchCamiones = async () => {
    setLoading(true);
    try {
      const data = await getAllCamiones();
      setCamiones(data);
    } catch (error) {
      console.error("Error al cargar camiones:", error);
      toast.error("Error al cargar la lista de camiones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamiones();
  }, []);

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const openEditModal = (camion) => {
    setCamionToEdit(camion);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCamionToEdit(null);
  };

  const handleCamionAction = () => {
    fetchCamiones();
  };

  const handleEliminarCamion = async (camion_id, patente) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        toast.warn(
          ({ closeToast }) => (
            <div style={{ padding: "10px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "8px" }}>Confirmar Eliminación</p>
              <p style={{ fontSize: "0.9em" }}>
                ¿Estás seguro de eliminar el camión con patente <strong>{patente}</strong>? (Eliminación permanente)
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  style={{ padding: "5px 10px", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: "#ccc" }}
                  onClick={() => { closeToast(); reject(new Error("Operación cancelada")); }}
                >Cancelar</button>
                <button
                  style={{ padding: "5px 10px", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: "#dc3545", color: "white" }}
                  onClick={async () => {
                    closeToast();
                    try {
                      await eliminarCamion(camion_id);
                      fetchCamiones();
                      resolve();
                    } catch (error) { reject(error); }
                  }}
                >Eliminar</button>
              </div>
            </div>
          ),
          {
            pending: "Esperando confirmación...",
            success: "Camión eliminado correctamente",
            error: { render: ({ data }) => data.message === "Operación cancelada" ? "Eliminación cancelada" : "Error al eliminar el camión" },
            closeButton: false,
            autoClose: false,
            position: "top-center"
          }
        );
      }),
      {
        pending: "Eliminando camión...",
        success: "Camión eliminado correctamente",
        error: { render: ({ data }) => data.message === "Operación cancelada" ? "Eliminación cancelada" : "Error al eliminar el camión" }
      }
    );
  };

  if (loading) {
    return (
      <div className="camara-config-container">
        <div className="camara-loading-state">Cargando camiones...</div>
      </div>
    );
  }

  return (
    <div className="camara-config-container">
      <div className="camara-config-section">

        <div className="camara-table-header">
          <h2>
            <i className="fas fa-truck-moving"></i>
            Gestión de Flota de Camiones
          </h2>
          <div className="camara-table-actions">
            <button className="camara-btn camara-btn-primary" onClick={openAddModal}>
              <i className="fas fa-plus"></i> Registrar Camión
            </button>
          </div>
        </div>

        <div className="camara-table-wrapper">
          <table className="camara-table">
            <thead>
              <tr>
                <th className="camara-table-header-cell">ID</th>
                <th className="camara-table-header-cell">Patente</th>
                <th className="camara-table-header-cell">Acoplado</th>
                <th className="camara-table-header-cell">Tipo / Capacidad</th>
                <th className="camara-table-header-cell">Temp Min/Máx</th>
                <th className="camara-table-header-cell">Transportista</th>
                <th className="camara-table-header-cell">Estado</th>
                <th className="camara-table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {camiones.length === 0 ? (
                <tr>
                  <td colSpan="8" className="camara-empty-state">No hay camiones registrados.</td>
                </tr>
              ) : (
                camiones.map((camion) => (
                  <tr key={camion.camion_id}>
                    <td className="camara-table-cell">
                          <span className="camara-capacity-badge">
                            {camion.camion_id}
                          </span>
                        </td>
                    <td className="camara-table-cell">
                      <span className="camara-capacity-badge">{camion.patente}</span>
                    </td>
                    <td className="camara-table-cell">{camion.patente_acoplado || 'N/A'}</td>
                    <td className="camara-table-cell">
                      {camion.tipo_camion} ({camion.capacidad_pallets} Pallets)
                    </td>
                    <td className="camara-table-cell">
                      {camion.temp_min !== null && camion.temp_max !== null
                        ? <span>{camion.temp_min}°C / {camion.temp_max}°C</span>
                        : 'N/A'}
                    </td>
                    <td className="camara-table-cell">
                      <span className="camara-location-text">
                        {camion.transportista_nombre || 'Sin asignar'}
                      </span>
                    </td>
                    <td className="camara-table-cell">
                      <span
                        className={`camara-status-badge ${
                          camion.estado === 'activo'
                            ? 'camara-status-normal'
                            : camion.estado === 'mantenimiento'
                            ? 'camara-status-alerta'
                            : 'camara-status-danger'
                        }`}
                      >
                        {camion.estado}
                      </span>
                    </td>
                    <td className="camara-table-cell">
                      <button
                        className="camara-btn-warning camara-action-btn"
                        onClick={() => openEditModal(camion)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="camara-btn-danger camara-action-btn"
                        style={{ marginLeft: "5px" }}
                        onClick={() => handleEliminarCamion(camion.camion_id, camion.patente)}
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

      <AddCamionModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onCamionAdded={handleCamionAction}
      />

      <EditCamionModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onCamionUpdated={handleCamionAction}
        initialCamionData={camionToEdit}
      />
    </div>
  );
};

export default Camion;
