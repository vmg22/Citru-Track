// components/ProductoVariedades.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  getAllProductsWithVarieties,
  deleteVariedadById,
  deleteProductById,
} from "../services/settingsServices";
import { toast } from "react-toastify";
import AddProductModal from "./AddProductoModal";
import EditProductoModal from "./EditProductoModal";
import AddVariedadModal from "./AddVariedadModal";

const ProductoVariedades = () => {
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. ESTADOS DE CONTROL ---
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const [isAddVariedadModalOpen, setIsAddVariedadModalOpen] = useState(false);
  const [selectedProductForVariedad, setSelectedProductForVariedad] = useState(null);

  // --- FUNCIÓN CENTRAL DE CARGA ---
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllProductsWithVarieties(); 
      setProductsList(data);
    } catch (err) {
      console.error("Error al cargar todos los productos:", err);
      setError(`No se pudo cargar la lista completa de productos.`);
      setProductsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- FUNCIÓN DE CIERRE DE MODALES ---
  const handleCloseModals = () => {
    setIsAddProductModalOpen(false);
    setIsEditProductModalOpen(false);
    setIsAddVariedadModalOpen(false);
    setProductToEdit(null);
    setSelectedProductForVariedad(null);
  };

  // Producto: Editar
  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setIsEditProductModalOpen(true);
  };

  // Producto: Eliminar
  const handleEliminarProducto = async (producto_id, nombre) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        toast.warn(
          ({ closeToast }) => (
            <div style={{ padding: "10px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Confirmar Eliminación
              </p>
              <p style={{ fontSize: "0.9em" }}>
                ¿Estás seguro que quieres eliminar el producto:{" "}
                <strong>{nombre}</strong>?
              </p>
              <p style={{ fontSize: "0.85em", color: "#dc3545", marginTop: "8px" }}>
                Esta acción es irreversible y puede romper referencias.
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
                      await deleteProductById(producto_id);
                      await loadProducts();
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
        pending: "Eliminando producto...",
        success: `Producto ${nombre} eliminado correctamente`,
        error: {
          render({ data }) {
            if (data.message === "Operación cancelada") {
              return "Eliminación cancelada";
            }
            return "Error al eliminar el producto. Podría tener dependencias.";
          }
        }
      }
    );
  };

  // Variedad: Añadir
  const handleAddVariedad = (product) => {
    setSelectedProductForVariedad(product);
    setIsAddVariedadModalOpen(true);
  };
  
  // Variedad: Eliminar
  const handleEliminarVariedad = async (variedad_id, nombre_variedad) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        toast.warn(
          ({ closeToast }) => (
            <div style={{ padding: "10px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Confirmar Eliminación
              </p>
              <p style={{ fontSize: "0.9em" }}>
                ¿Estás seguro que quieres eliminar la variedad:{" "}
                <strong>{nombre_variedad}</strong>?
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
                      await deleteVariedadById(variedad_id);
                      await loadProducts();
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
        pending: "Eliminando variedad...",
        success: `Variedad ${nombre_variedad} eliminada correctamente`,
        error: {
          render({ data }) {
            if (data.message === "Operación cancelada") {
              return "Eliminación cancelada";
            }
            return "Error al eliminar la variedad.";
          }
        }
      }
    );
  };

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // --- RENDERIZADO ---
  if (loading) {
    return (
      <div className="camara-config-container">
        <div className="camara-loading-state">
          <i className="fas fa-spinner fa-spin"></i> Cargando productos y variedades...
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
        
        {/* HEADER GLOBAL: Botón Añadir Producto */}
        <div className="camara-table-header">
          <h2>
            <i className="fa-solid fa-lemon"></i> Gestión de Productos y Variedades
          </h2>
          <button 
            className="camara-btn camara-btn-primary"
            onClick={() => setIsAddProductModalOpen(true)}
          >
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
          <div key={product.producto_id}>
            {/* HEADER DE PRODUCTO: Botones Añadir Variedad, Editar Producto, Eliminar Producto */}
            <div className="camara-table-header" style={{marginTop:"40px"}}>
              <h3 style={{ margin: 0, color: "#2c3e50" }}>
                {product.nombre}
                <span style={{ fontSize: "0.9rem", color: "#6b7280", marginLeft: "0.5rem" }}>
                  ({product.categoria})
                </span>
              </h3>
              <div className="camara-table-actions">
                <button 
                  className="camara-btn camara-btn-primary"
                  onClick={() => handleAddVariedad(product)}
                >
                  <i className="fas fa-plus"></i> Añadir Variedad
                </button>
                <button 
                  className="camara-btn camara-btn-warning"
                  onClick={() => handleEditProduct(product)}
                >
                  <i className="fas fa-edit"></i> Editar Producto
                </button>
                <button 
                  className="camara-btn camara-btn-danger"
                  onClick={() => handleEliminarProducto(product.producto_id, product.nombre)}
                >
                  <i className="fa-solid fa-trash"></i> Eliminar Producto
                </button>
              </div>
            </div>
            
            <div className="camara-table-wrapper" style={{ marginBottom: "2rem" }}>
              {/* TABLA DE VARIEDADES */}
              <table className="camara-table">
                <thead>
                  <tr>
                    <th className="camara-table-header-cell">ID</th>
                    <th className="camara-table-header-cell">Nombre Variedad</th>
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
                          <span className="camara-capacity-badge">{variedad.variedad_id}</span>
                        </td>
                        <td className="camara-table-cell">
                          <strong>{variedad.nombre}</strong>
                        </td>
                        <td className="camara-table-cell">
                          {variedad.descripcion ? (
                            <span className="camara-location-text" title={variedad.descripcion}>
                              {variedad.descripcion.length > 50 
                                ? `${variedad.descripcion.substring(0, 50)}...` 
                                : variedad.descripcion}
                            </span>
                          ) : (
                            <span style={{ color: "#6b7280", fontStyle: "italic" }}>N/A</span>
                          )}
                        </td>
                        <td className="camara-table-cell">
                          <button
                            className="camara-btn-warning camara-action-btn"
                            title="Editar variedad"
                            // onClick={() => handleEditVariedad(variedad)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="camara-btn-danger camara-action-btn"
                            title="Eliminar variedad"
                            style={{ marginLeft: "5px" }}
                            onClick={() => handleEliminarVariedad(variedad.variedad_id, variedad.nombre)}
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
        ))}
      </div>
      
      {/* RENDERIZADO DE MODALES */}
      
      {/* Modal para CREAR Producto */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={handleCloseModals}
        onProductAdded={loadProducts}
      />

      {/* Modal para EDITAR Producto */}
      <EditProductoModal
        isOpen={isEditProductModalOpen}
        onClose={handleCloseModals}
        productData={productToEdit}
        onProductUpdated={loadProducts}
      />

      {/* Modal para CREAR Variedad */}
      <AddVariedadModal
        isOpen={isAddVariedadModalOpen}
        onClose={handleCloseModals}
        productoId={selectedProductForVariedad?.producto_id}
        productoNombre={selectedProductForVariedad?.nombre}
        onVariedadAdded={loadProducts}
      />
      
      {/* Modal para EDITAR Variedad (Debe ser implementado) */}
      {/* <EditVariedadModal ... /> */}
    </div>
  );
};

export default ProductoVariedades;