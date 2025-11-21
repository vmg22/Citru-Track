// components/ProductoVariedades.jsx
import React, { useEffect, useState } from "react";
import {
  getAllProductsWithVarieties,
  deleteVariedadById,
} from "../services/settingsServices";

const ProductoVariedades = () => {
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllProductsWithVarieties();
      setProductsList(data);
    } catch (err) {
      console.error("Error al cargar todos los productos:", err);
      setError(
        `No se pudo cargar la lista completa de productos. ${err.message}`
      );
      setProductsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarVariedad = async (variedad_id, nombre_variedad) => {
    if (
      window.confirm(
        `¿Estás seguro que quieres eliminar la variedad "${nombre_variedad}"?`
      )
    ) {
      try {
        await deleteVariedadById(variedad_id);
        alert(`Variedad ${nombre_variedad} eliminada correctamente`);
        loadProducts();
      } catch (error) {
        alert("Error al eliminar la variedad.");
      }
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="camara-config-container">
        <div className="camara-loading-state">
          Cargando productos y variedades...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="camara-config-container">
        <div className="camara-empty-state" style={{ color: "red" }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="camara-config-container">
      <div className="camara-config-section">
        <div className="camara-table-header">
          <h2>
            <i className="fa-solid fa-lemon"></i> Gestión de Productos y
            Variedades
          </h2>
          <button className="camara-btn camara-btn-primary">
            <i className="fas fa-plus"></i> Añadir Producto
          </button>
        </div>

        {productsList.length === 0 && (
          <div className="camara-table-wrapper">
            <div className="camara-empty-state">
              No hay productos registrados en el sistema.
            </div>
          </div>
        )}

        {/* Mapeo sobre CADA PRODUCTO para mostrar su tabla */}
        {productsList.map((product) => (
          <div>
            <div className="camara-table-header" style={{marginTop:"40px"}}>
              <h3 style={{ margin: 0, color: "#2c3e50" }}>
                {product.nombre}
                <span
                  style={{
                    fontSize: "0.9rem",
                    color: "#6b7280",
                    marginLeft: "0.5rem",
                  }}
                >
                  ({product.categoria})
                </span>
              </h3>
              <div className="camara-table-actions">
                <button className="camara-btn camara-btn-primary">
                  <i className="fas fa-plus"></i> Añadir Variedad
                </button>
                <button className="camara-btn camara-btn-warning">
                  <i className="fas fa-edit"></i> Editar Producto
                </button>
                <button className="camara-btn camara-btn-danger">
                  <i className="fa-solid fa-trash"></i> Eliminar Producto
                </button>
              </div>
            </div>
            <div
              key={product.producto_id}
              className="camara-table-wrapper"
              style={{ marginBottom: "2rem" }}
            >
              {/* Tabla de Variedades del Producto */}
              <div className="camara-table-wrapper">
                <table className="camara-table">
                  <thead>
                    <tr>
                      <th className="camara-table-header-cell">ID</th>
                      <th className="camara-table-header-cell">
                        Nombre Variedad
                      </th>
                      <th className="camara-table-header-cell">Descripción</th>
                      <th className="camara-table-header-cell">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variedades.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="camara-empty-state">
                          No hay variedades registradas para {product.nombre}.
                        </td>
                      </tr>
                    ) : (
                      product.variedades.map((variedad) => (
                        <tr key={variedad.variedad_id}>
                          <td className="camara-table-cell">
                            <span className="camara-capacity-badge">
                              {variedad.variedad_id}
                            </span>
                          </td>
                          <td className="camara-table-cell">
                            <strong>{variedad.nombre}</strong>
                          </td>
                          <td className="camara-table-cell">
                            {variedad.descripcion ? (
                              <span
                                className="camara-location-text"
                                title={variedad.descripcion}
                              >
                                {variedad.descripcion.length > 50
                                  ? `${variedad.descripcion.substring(
                                      0,
                                      50
                                    )}...`
                                  : variedad.descripcion}
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: "#6b7280",
                                  fontStyle: "italic",
                                }}
                              >
                                N/A
                              </span>
                            )}
                          </td>
                          <td className="camara-table-cell">
                            <button
                              className="camara-btn-warning camara-action-btn"
                              title="Editar variedad"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="camara-btn-danger camara-action-btn"
                              title="Eliminar variedad"
                              style={{ marginLeft: "5px" }}
                              onClick={() =>
                                handleEliminarVariedad(
                                  variedad.variedad_id,
                                  variedad.nombre
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
        ))}
      </div>
    </div>
  );
};

export default ProductoVariedades;
