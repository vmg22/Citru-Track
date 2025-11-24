import React, { useEffect, useState } from "react";
import { deleteUserById, getAllUsers } from "../services/settingsServices";
import { toast } from "react-toastify";
import "../../../style/usuariostable.css";
// Importar el nuevo modal
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";

const UsuariosTable = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error al cargar la lista de usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleEliminarUsuario = async (id_user, username) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        toast.warn(
          ({ closeToast }) => (
            <div style={{ padding: "10px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Confirmar Eliminación
              </p>
              <p style={{ fontSize: "0.9em" }}>
                ¿Estás seguro que quieres eliminar al usuario:{" "}
                <strong>{username}</strong>?
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
                      await deleteUserById(id_user);
                      await fetchUsuarios();
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
        pending: "Eliminando usuario...",
        success: "Usuario eliminado correctamente",
        error: {
          render({ data }) {
            if (data.message === "Operación cancelada") {
              return "Eliminación cancelada";
            }
            return "Error al eliminar el usuario";
          }
        }
      }
    );
  };

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const openEditModal = (user) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setUserToEdit(null); // Limpiar el estado al cerrar
  };

  // Función de callback que se pasa al modal para recargar la tabla después de crear un usuario
  const handleUserAdded = () => {
    fetchUsuarios();
  };

  const handleUserUpdate = () => {
    fetchUsuarios();
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="camara-config-container">
        <div className="camara-loading-state">
          Cargando usuarios...
        </div>
      </div>
    );
  }

  return (
    <div className="camara-config-container">
      <div className="camara-config-section">
        <div className="camara-table-header">
          <h2>
            <i className="fas fa-user-friends"></i>
            Gestión de Usuarios
          </h2>
          <div className="camara-table-actions">
            <button className="camara-btn camara-btn-primary" onClick={openAddModal}>
              <i className="fas fa-plus"></i> Agregar Usuario
            </button>
            <button
              className="camara-btn camara-btn-secondary"
              style={{ marginLeft: "10px" }}
            >
              <i className="fas fa-file-export"></i> Exportar Lista
            </button>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="camara-table-wrapper">
          <table className="camara-table">
            <thead>
              <tr>
                <th className="camara-table-header-cell">ID</th>
                <th className="camara-table-header-cell">Nombre</th>
                <th className="camara-table-header-cell">Usuario</th>
                <th className="camara-table-header-cell">Email</th>
                <th className="camara-table-header-cell">Rol(es)</th>
                <th className="camara-table-header-cell">Teléfono</th>
                <th className="camara-table-header-cell">Activo</th>
                <th className="camara-table-header-cell">Creado</th>
                <th className="camara-table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="9" className="camara-empty-state">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => (
                  <tr key={user.user_id}>
                    <td className="camara-table-cell">
                          <span className="camara-capacity-badge">
                            {user.user_id}
                          </span>
                        </td>
                    <td className="camara-table-cell">{user.nombre}</td>
                    <td className="camara-table-cell">{user.username}</td>
                    <td className="camara-table-cell">{user.email}</td>
                    <td className="camara-table-cell">
                      {user.roles_asignados || 'Sin Rol'} 
                    </td>
                    <td className="camara-table-cell">
                      {user.telefono ? (
                        <span className="camara-temperature-badge">
                          <i className="fas fa-phone"></i>
                          {user.telefono}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="camara-table-cell">
                      <span
                        className={`camara-status-badge ${
                          user.activo === 1
                            ? "camara-status-normal"
                            : "camara-status-alerta"
                        }`}
                      >
                        {user.activo === 1 ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="camara-table-cell">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="camara-table-cell">
                      <button
                        className="camara-btn-warning camara-action-btn"
                        title="Editar"
                        onClick={() => openEditModal(user)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="camara-btn-danger camara-action-btn"
                        title="Eliminar"
                        style={{ marginLeft: "5px" }}
                        onClick={() => handleEliminarUsuario(user.user_id, user.username)}
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

        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
          onUserAdded={handleUserUpdate}
        />
        
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onUserUpdated={handleUserUpdate}
          initialUserData={userToEdit}
        />
      </div>
    </div>
  );
};

export default UsuariosTable;