import React, { useState, useEffect } from 'react'
import { getAllProductores } from '../services/settingsServices'
import "../../../style/productores.css"

const Productores = () => {
    const [productores, setProductores] = useState([])
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAllProductores()
                setProductores(data)
            } catch (error) {
                console.error("Error al cargar datos de Productores:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData(); 
    }, [])

    // Función para formatear fecha
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
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
            <div className="form-configuracion">
                <div className="loading-state">
                    Cargando datos de productores...
                </div>
            </div>
        );
    }

    return (
        <div className="form-configuracion">
            <div className="form-section">
                {/* Header con título y botones */}
                <div className="table-header-section">
                    <h2>
                        <i className="fas fa-tractor"></i>
                        Gestión de Productores
                    </h2>
                    <div className="table-actions">
                        <button className="btn btn-primary">
                            <i className="fas fa-plus"></i> Agregar Productor
                        </button>
                        <button className="btn btn-secondary" style={{ marginLeft: "10px" }}>
                            <i className="fas fa-file-export"></i> Exportar Lista
                        </button>
                    </div>
                </div>

                {/* Tabla de Productores */}
                <div className="usuarios-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th className="tableHeaderStyle">ID</th>
                                <th className="tableHeaderStyle">Nombre</th>
                                <th className="tableHeaderStyle">CUIT</th>
                                <th className="tableHeaderStyle">Teléfono</th>
                                <th className="tableHeaderStyle">Dirección</th>
                                <th className="tableHeaderStyle">Contactos</th>
                                <th className="tableHeaderStyle">Fecha Registro</th>
                                <th className="tableHeaderStyle">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productores.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="empty-state">
                                        No se encontraron productores.
                                    </td>
                                </tr>
                            ) : (
                                productores.map((productor) => (
                                    <tr key={productor.productor_id}>
                                        <td className="tableCellStyle">{productor.productor_id}</td>
                                        <td className="tableCellStyle">
                                            <strong>{productor.nombre}</strong>
                                        </td>
                                        <td className="tableCellStyle">
                                            {productor.cuit ? (
                                                <span className="cuit-badge">
                                                    {productor.cuit}
                                                </span>
                                            ) : (
                                                'N/A'
                                            )}
                                        </td>
                                        <td className="tableCellStyle">
                                            {productor.telefono || 'N/A'}
                                        </td>
                                        <td className="tableCellStyle">
                                            {productor.direccion ? (
                                                <span 
                                                    className="address-text" 
                                                    title={productor.direccion}
                                                >
                                                    {productor.direccion.length > 30 
                                                        ? `${productor.direccion.substring(0, 30)}...` 
                                                        : productor.direccion
                                                    }
                                                </span>
                                            ) : (
                                                'N/A'
                                            )}
                                        </td>
                                        <td className="tableCellStyle">
                                            {productor.contactos ? (
                                                <span 
                                                    className="contacts-text" 
                                                    title={productor.contactos}
                                                >
                                                    {productor.contactos.length > 25 
                                                        ? `${productor.contactos.substring(0, 25)}...` 
                                                        : productor.contactos
                                                    }
                                                </span>
                                            ) : (
                                                'N/A'
                                            )}
                                        </td>
                                        <td className="tableCellStyle">
                                            {formatDate(productor.created_at)}
                                        </td>
                                        <td className="tableCellStyle">
                                            <button 
                                                className="btn-warning actionButtonStyle" 
                                                title="Editar productor"
                                                // onClick={() => handleEditarProductor(productor.productor_id)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn-danger actionButtonStyle"
                                                title="Eliminar productor"
                                                style={{ marginLeft: '5px' }}
                                                onClick={() => handleEliminarProductor(productor.productor_id)}
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
    )
}

export default Productores