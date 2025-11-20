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
      <div style={{ padding: "20px", textAlign: "center" }}>
        Cargando usuarios...
      </div>
    );
  }

  return (
    <div className="form-configuracion">
      <div className="form-section">
        <div className="table-header-section">
          <h2>
            <i className="fas fa-user-friends"></i>
            Gestión de Usuarios
          </h2>
          <div className="table-actions">
            <button className="btn btn-primary" onClick={openModal}>
              <i className="fas fa-plus"></i> Agregar Usuario
            </button>
            <button
              className="btn btn-secondary"
              style={{ marginLeft: "10px" }}
            >
              <i className="fas fa-file-export"></i> Exportar Lista
            </button>
          </div>
        </div>

        {/* Tabla de Usuarios (código omitido por brevedad, el mismo que tenías) */}
        <div className="usuarios-table-container">
          <table>
            <thead>
              <tr>
                <th className="tableHeaderStyle">ID</th>
                <th className="tableHeaderStyle">Nombre</th>
                <th className="tableHeaderStyle">Usuario</th>
                <th className="tableHeaderStyle">Email</th>
                <th className="tableHeaderStyle">Teléfono</th>
                <th className="tableHeaderStyle">Activo</th>
                <th className="tableHeaderStyle">Creado</th>
                <th className="tableHeaderStyle">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#6c757d",
                    }}
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => (
                  <tr key={user.user_id}>
                    <td className="tableCellStyle">{user.user_id}</td>
                    <td className="tableCellStyle">{user.nombre}</td>
                    <td className="tableCellStyle">{user.username}</td>
                    <td className="tableCellStyle">{user.email}</td>
                    <td className="tableCellStyle">{user.telefono || "N/A"}</td>
                    <td className="tableCellStyle">
                      <span
                        className={
                          user.activo === 1
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        {user.activo === 1 ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="tableCellStyle">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="tableCellStyle">
                      <button
                        className="btn-warning actionButtonStyle"
                        title="Editar"
                        style={{ backgroundColor: "#ffc107", color: "black" }}
                        // onClick={() => handleEditar(user)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-danger actionButtonStyle"
                        title="Eliminar"
                        style={{
                          backgroundColor: "#dc3545",
                          color: "white",
                          marginLeft: "5px",
                        }}
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

        {/* 3. Renderizar el Modal */}
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
