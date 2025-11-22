import React, { useState, useEffect } from "react";
import { getAllProductores } from "../services/settingsServices";
import "../../../style/productores.css";

const Productores = () => {
  const [productores, setProductores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllProductores();
        setProductores(data);
      } catch (error) {
        console.error("Error al cargar datos de Productores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Función para manejar eliminación
  const handleEliminarProductor = async (productor_id) => {
    if (window.confirm("¿Estás seguro que quieres eliminar este productor?")) {
      try {
        // await deleteProductorById(productor_id); // Descomenta cuando tengas esta función
        alert("Productor eliminado correctamente");
        // Recargar la lista
        const data = await getAllProductores();
        setProductores(data);
      } catch (error) {
        console.error("Error al eliminar productor:", error);
        alert("Error al eliminar el productor");
      }
    }
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
            <button className="camara-btn camara-btn-primary">
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
                <th className="camara-table-header-cell">Contactos</th>
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
                      <strong>{productor.nombre}</strong>
                    </td>
                    <td className="camara-table-cell">
                      {productor.cuit ? (
                        <span className="camara-capacity-badge">
                          <i className="fas fa-id-card"></i>
                          {productor.cuit}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="camara-table-cell">
                      {productor.telefono ? (
                        <span className="camara-temperature-badge camara-status-normal">
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
                          <i className="fas fa-map-marker-alt"></i>
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
                          className="camara-temperature-badge camara-status-normal"
                          title={productor.contactos}
                        >
                          <i className="fas fa-users"></i>
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
                        // onClick={() => handleEditarProductor(productor.productor_id)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="camara-btn-danger camara-action-btn"
                        title="Eliminar productor"
                        style={{ marginLeft: "5px" }}
                        onClick={() =>
                          handleEliminarProductor(productor.productor_id)
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
  );
};

export default Productores;
