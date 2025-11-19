import React, { useEffect, useState } from 'react';
import { getAllChoferes, getAllTransportes } from '../services/settingsServices';
import "../../../style/chofertransporte.css"

const ChoferTransporte = () => {
    const [choferes, setChoferes] = useState([])
    const [transportes, setTransportes] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const dataC = await getAllChoferes()
                const dataT = await getAllTransportes()
                setChoferes(dataC)
                setTransportes(dataT)
            } catch (error) {
                console.error("Error al cargar datos de Choferes/Transportes:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData(); 
    }, [])

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
        if (window.confirm("¿Estás seguro que quieres eliminar este transportista?")) {
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
            <div className="form-configuracion">
                <div className="loading-state">
                    Cargando datos de transporte y choferes...
                </div>
            </div>
        );
    }
    
    return (
        <div className="form-configuracion">
            <div className="form-section">
                {/* Header principal con título y botones */}
                <div className="table-header-section">
                    <h2>
                        <i className="fas fa-truck-moving"></i>
                        Gestión de Transporte y Logística
                    </h2>
                </div>

                {/* Tabla de Choferes */}
                <div className="transportes-table-container">
                    <div className="table-subheader-section">
                        <h3>
                            Conductores ({choferes.length})
                        </h3>
                        <button className="btn btn-primary">
                            <i className="fas fa-user-plus"></i> Agregar Chofer
                        </button>
                    </div>
                    
                    <div className="usuarios-table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th className="tableHeaderStyle">ID</th>
                                    <th className="tableHeaderStyle">Nombre Completo</th>
                                    <th className="tableHeaderStyle">Licencia</th>
                                    <th className="tableHeaderStyle">Teléfono</th>
                                    <th className="tableHeaderStyle">Transportista</th>
                                    <th className="tableHeaderStyle">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {choferes.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            No se encontraron conductores.
                                        </td>
                                    </tr>
                                ) : (
                                    choferes.map((chofer) => (
                                        <tr key={chofer.chofer_id}>
                                            <td className="tableCellStyle">{chofer.chofer_id || 'N/A'}</td>
                                            <td className="tableCellStyle">
                                                <strong>{chofer.nombre || 'N/A'}</strong>
                                            </td>
                                            <td className="tableCellStyle">
                                                <span className="license-badge">
                                                    {chofer.licencia || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="tableCellStyle">
                                                {chofer.telefono || 'N/A'}
                                            </td>
                                            <td className="tableCellStyle">
                                                <span className="transportista-name">
                                                    {chofer.nombre_transportista || 'Sin asignar'}
                                                </span>
                                            </td> 
                                            <td className="tableCellStyle">
                                                <button 
                                                    className="btn-warning actionButtonStyle" 
                                                    title="Editar conductor"
                                                    // onClick={() => handleEditarChofer(chofer.chofer_id)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    className="btn-danger actionButtonStyle"
                                                    title="Eliminar conductor"
                                                    style={{marginLeft: '5px'}}
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

                {/* Tabla de Transportistas */}
                <div className="transportes-table-container">
                    <div className="table-subheader-section">
                        <h3>
                            Transportistas ({transportes.length})
                        </h3>
                        <button className="btn btn-primary">
                            <i className="fas fa-plus"></i> Agregar Transportista
                        </button>
                    </div>
                    
                    <div className="usuarios-table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th className="tableHeaderStyle">ID</th>
                                    <th className="tableHeaderStyle">Nombre Empresa</th>
                                    <th className="tableHeaderStyle">CUIT</th>
                                    <th className="tableHeaderStyle">Contacto</th>
                                    <th className="tableHeaderStyle">Teléfono</th>
                                    <th className="tableHeaderStyle">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transportes.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            No se encontraron transportistas.
                                        </td>
                                    </tr>
                                ) : (
                                    transportes.map((transporte) => (
                                        <tr key={transporte.transportista_id}>
                                            <td className="tableCellStyle">{transporte.transportista_id || 'N/A'}</td>
                                            <td className="tableCellStyle">
                                                <strong>{transporte.nombre || 'N/A'}</strong>
                                            </td>
                                            <td className="tableCellStyle">
                                                {transporte.cuit ? (
                                                    <span>
                                                        {transporte.cuit}
                                                    </span>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td className="tableCellStyle">
                                                {transporte.contacto || 'N/A'}
                                            </td>
                                            <td className="tableCellStyle">
                                                {transporte.telefono || 'N/A'}
                                            </td>
                                            <td className="tableCellStyle">
                                                <button 
                                                    className="btn-warning actionButtonStyle" 
                                                    title="Editar transportista"
                                                    // onClick={() => handleEditarTransportista(transporte.transportista_id)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    className="btn-danger actionButtonStyle"
                                                    title="Eliminar transportista"
                                                    style={{marginLeft: '5px'}}
                                                    onClick={() => handleEliminarTransportista(transporte.transportista_id)}
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