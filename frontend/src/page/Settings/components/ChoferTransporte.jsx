import React, { useEffect, useState } from "react";
import {
  getAllChoferes,
  getAllTransportes,
} from "../services/settingsServices";
import "../../../style/chofertransporte.css";

const ChoferTransporte = () => {
  const [choferes, setChoferes] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataC = await getAllChoferes();
        const dataT = await getAllTransportes();
        setChoferes(dataC);
        setTransportes(dataT);
      } catch (error) {
        console.error("Error al cargar datos de Choferes/Transportes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Función para manejar eliminación de chofer
  const handleEliminarChofer = async (chofer_id) => {
    if (window.confirm("¿Estás seguro que quieres eliminar este conductor?")) {
      try {
        // await deleteChoferById(chofer_id); // Descomenta cuando tengas esta función
        alert("Conductor eliminado correctamente");
        // Recargar la lista
        const data = await getAllChoferes();
        setChoferes(data);
      } catch (error) {
        console.error("Error al eliminar conductor:", error);
        alert("Error al eliminar el conductor");
      }
    }
  };

  // Función para manejar eliminación de transportista
  const handleEliminarTransportista = async (transportista_id) => {
    if (
      window.confirm("¿Estás seguro que quieres eliminar este transportista?")
    ) {
      try {
        // await deleteTransportistaById(transportista_id); // Descomenta cuando tengas esta función
        alert("Transportista eliminado correctamente");
        // Recargar la lista
        const data = await getAllTransportes();
        setTransportes(data);
      } catch (error) {
        console.error("Error al eliminar transportista:", error);
        alert("Error al eliminar el transportista");
      }
    }
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
        {/* Header principal con título y botones */}
        <div className="camara-table-header">
          <h2>
            <i className="fas fa-truck-moving"></i>
            Gestión de Transporte y Logística
          </h2>
        </div>
        <div className="camara-table-header">
          <h3>Conductores ({choferes.length})</h3>
          <div className="camara-table-actions">
            <button className="camara-btn camara-btn-primary">
              <i className="fas fa-user-plus"></i> Agregar Chofer
            </button>
          </div>
        </div>
        {/* Tabla de Choferes */}
        <div className="camara-table-wrapper">
          <div className="camara-table-wrapper">
            <table className="camara-table">
              <thead>
                <tr>
                  <th className="camara-table-header-cell">ID</th>
                  <th className="camara-table-header-cell">Nombre Completo</th>
                  <th className="camara-table-header-cell">Licencia</th>
                  <th className="camara-table-header-cell">Teléfono</th>
                  <th className="camara-table-header-cell">Transportista</th>
                  <th className="camara-table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {choferes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="camara-empty-state">
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
                        <strong>{chofer.nombre || "N/A"}</strong>
                      </td>
                      <td className="camara-table-cell">
                        <span className="camara-capacity-badge">
                          <i className="fas fa-id-card"></i>
                          {chofer.licencia || "N/A"}
                        </span>
                      </td>
                      <td className="camara-table-cell">
                        {chofer.telefono ? (
                          <span className="camara-temperature-badge camara-status-normal">
                            <i className="fas fa-phone"></i>
                            {chofer.telefono}
                          </span>
                        ) : (
                          "N/A"
                        )}
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
                          // onClick={() => handleEditarChofer(chofer.chofer_id)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="camara-btn-danger camara-action-btn"
                          title="Eliminar conductor"
                          style={{ marginLeft: "5px" }}
                          onClick={() => handleEliminarChofer(chofer.chofer_id)}
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
            <button className="camara-btn camara-btn-primary">
              <i className="fas fa-plus"></i> Agregar Transportista
            </button>
          </div>
        </div>
        {/* Tabla de Transportistas */}
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
                        <strong>{transporte.nombre || "N/A"}</strong>
                      </td>
                      <td className="camara-table-cell">
                        {transporte.cuit ? (
                          <span className="camara-capacity-badge">
                            <i className="fas fa-id-card"></i>
                            {transporte.cuit}
                          </span>
                        ) : (
                          "N/A"
                        )}
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
                          <span className="camara-temperature-badge camara-status-normal">
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
                          // onClick={() => handleEditarTransportista(transporte.transportista_id)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="camara-btn-danger camara-action-btn"
                          title="Eliminar transportista"
                          style={{ marginLeft: "5px" }}
                          onClick={() =>
                            handleEliminarTransportista(
                              transporte.transportista_id
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
    </div>
  );
};

export default ChoferTransporte;
