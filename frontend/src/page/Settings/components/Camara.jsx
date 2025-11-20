import React, { useState, useEffect } from "react";
import { getAllCamaras } from "../../CamaraFrio/service/camaraService";
import "../../../style/camaraconfig.css";

const Camara = () => {
  const [camaras, setCamaras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllCamaras();
        setCamaras(data);
      } catch (error) {
        console.error("Error al cargar datos de Cámaras:", error);
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

  // Función para determinar el estado basado en la temperatura
  const getStatus = (temperatura) => {
    const temp = parseFloat(temperatura);
    return temp > 20 ? "alerta" : "normal";
  };

  // Función para obtener clase CSS según estado
  const getStatusClass = (temperatura) => {
    return getStatus(temperatura) === "alerta"
      ? "camara-status-alerta"
      : "camara-status-normal";
  };

  // Función para obtener texto del estado
  const getStatusText = (temperatura) => {
    return getStatus(temperatura) === "alerta"
      ? "Alerta Temperatura"
      : "Normal";
  };

  // Función para manejar eliminación
  const handleEliminarCamara = async (camara_id) => {
    if (window.confirm("¿Estás seguro que quieres eliminar esta cámara?")) {
      try {
        // await deleteCamaraById(camara_id); // Descomenta cuando tengas esta función
        alert("Cámara eliminada correctamente");
        // Recargar la lista
        const data = await getAllCamaras();
        setCamaras(data);
      } catch (error) {
        console.error("Error al eliminar cámara:", error);
        alert("Error al eliminar la cámara");
      }
    }
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
            <button className="camara-btn camara-btn-primary">
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
              {camaras.length === 0 ? (
                <tr>
                  <td colSpan="8" className="camara-empty-state">
                    No se encontraron cámaras.
                  </td>
                </tr>
              ) : (
                camaras.map((camara) => (
                  <tr key={camara.camara_id}>
                    <td className="camara-table-cell">{camara.camara_id}</td>
                    <td className="camara-table-cell">
                      <strong>{camara.nombre}</strong>
                    </td>
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
                        // onClick={() => handleEditarCamara(camara.camara_id)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="camara-btn-danger camara-action-btn"
                        title="Eliminar cámara"
                        style={{ marginLeft: "5px" }}
                        onClick={() => handleEliminarCamara(camara.camara_id)}
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

export default Camara;