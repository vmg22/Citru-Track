import React, { useEffect, useState } from "react";
import { deleteUserById, getAllUsers } from "../services/settingsServices";
import "../../../style/usuariostable.css";
// Importar el nuevo modal
import AddUserModal from "./AddUserModal";

const UsuariosTable = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  // Nuevo estado para controlar la visibilidad del modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Función para obtener y establecer usuarios (centralizada para reutilizar)
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleEliminarUsuario = async (id_user) => {
    const confirmacion = window.confirm(
      "¿Estás seguro que quieres eliminar el usuario?"
    );

    if (confirmacion) {
      try {
        await deleteUserById(id_user);
        alert("Usuario eliminado correctamente");
        // Recargar la lista de usuarios
        fetchUsuarios();
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        alert("Error al eliminar el usuario");
      }
    } else {
      alert("El usuario no se eliminó");
    }
  };

  // Funciones para manejar el modal
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Función de callback que se pasa al modal para recargar la tabla después de crear un usuario
  const handleUserAdded = () => {
    fetchUsuarios();
  };

  // Formato de fecha simple
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
            <button className="camara-btn camara-btn-primary" onClick={openModal}>
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
                <th className="camara-table-header-cell">Teléfono</th>
                <th className="camara-table-header-cell">Activo</th>
                <th className="camara-table-header-cell">Creado</th>
                <th className="camara-table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="8" className="camara-empty-state">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => (
                  <tr key={user.user_id}>
                    <td className="camara-table-cell">{user.user_id}</td>
                    <td className="camara-table-cell">{user.nombre}</td>
                    <td className="camara-table-cell">{user.username}</td>
                    <td className="camara-table-cell">{user.email}</td>
                    <td className="camara-table-cell">
                      {user.telefono ? (
                        <span className="camara-temperature-badge camara-status-normal">
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
                        // onClick={() => handleEditar(user)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="camara-btn-danger camara-action-btn"
                        title="Eliminar"
                        style={{ marginLeft: "5px" }}
                        onClick={() => handleEliminarUsuario(user.user_id)}
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

        {/* Renderizar el Modal */}
        <AddUserModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onUserAdded={handleUserAdded}
        />
      </div>
    </div>
  );
};

export default UsuariosTable;