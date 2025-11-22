import React, { useState, useEffect } from 'react';
// Importa la librería de notificaciones
import { toast } from 'react-toastify'; 
// Importa createUser Y la nueva función getAllRoles
import { createUser, getAllRoles } from "../services/settingsServices"; 
import "../../../style/addusermodal.css"

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        nombre: '',
        telefono: '',
        rolSeleccionado: '', 
    });
    const [availableRoles, setAvailableRoles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Ya no necesitamos el estado 'error' para mostrar el mensaje en el modal si usamos toastify
    const [localError, setLocalError] = useState(null); 

    // Cargar roles al montar el modal
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const rolesData = await getAllRoles();
                setAvailableRoles(rolesData);
                if (rolesData.length > 0) {
                    setFormData(prev => ({ ...prev, rolSeleccionado: rolesData[0].name }));
                }
            } catch (err) {
                console.error("Error al cargar roles:", err);
                // Si falla la carga inicial de roles, notificar.
                toast.error("Error al cargar la lista de roles.");
            }
        };
        
        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null);
        setIsSubmitting(true);

        try {
            if (!formData.username || !formData.password || !formData.email || !formData.nombre || !formData.rolSeleccionado) {
                const requiredError = "Todos los campos marcados con * son obligatorios.";
                setLocalError(requiredError);
                toast.error(requiredError);
                setIsSubmitting(false);
                return;
            }

            const dataToSend = {
                username: formData.username,
                password: formData.password,
                email: formData.email,
                nombre: formData.nombre,
                telefono: formData.telefono,
                roles: [formData.rolSeleccionado], 
            };

            const response = await createUser(dataToSend);
            
            // 🌟 Notificación de Éxito
            toast.success(`Usuario ${response.usuario?.username || formData.username} creado con éxito!`);
            
            onUserAdded();
            onClose();
            
            // 3. Resetear el formulario al cerrar
            setFormData({
                username: '',
                password: '',
                email: '',
                nombre: '',
                telefono: '',
                rolSeleccionado: availableRoles.length > 0 ? availableRoles[0].name : '', 
            });
            
        } catch (err) {
            const apiError = err.response?.data?.error || "Error al crear el usuario. Por favor, intenta nuevamente.";
            
            // ❌ Notificación de Error
            toast.error(apiError);
            setLocalError(apiError); // Mantenemos el error local por si el usuario lo prefiere en el modal
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
                
                <div className="modal-header">
                    <h3>
                        <i className="fas fa-user-plus"></i>
                        Agregar Nuevo Usuario
                    </h3>
                    <button 
                        className="modal-close-btn"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {/* El mensaje de error interno (localError) se mantiene por si quieres duplicar la alerta */}
                    {localError && ( 
                        <div className="modal-error">
                            {localError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Campo de ROL */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="rolSeleccionado">
                                Rol <span className="required-star">*</span>
                            </label>
                            <select
                                id="rolSeleccionado"
                                name="rolSeleccionado"
                                value={formData.rolSeleccionado}
                                onChange={handleChange}
                                className="form-input"
                                required
                                disabled={availableRoles.length === 0 || isSubmitting}
                            >
                                {availableRoles.length > 0 ? (
                                    availableRoles.map(role => (
                                        <option key={role.role_id} value={role.name}>
                                            {role.description} ({role.name})
                                        </option>
                                    ))
                                ) : (
                                    <option value="">Cargando roles...</option>
                                )}
                            </select>
                        </div>
                        
                        {/* Resto de campos (Nombre, Username, Email, Contraseña, Teléfono) */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="nombre">Nombre Completo <span className="required-star">*</span></label>
                            <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} className="form-input" placeholder="Ingrese el nombre completo" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="username">Nombre de Usuario <span className="required-star">*</span></label>
                            <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} className="form-input" placeholder="Ingrese el nombre de usuario" required />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email <span className="required-star">*</span></label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="usuario@ejemplo.com" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Contraseña <span className="required-star">*</span></label>
                            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className="form-input" placeholder="Ingrese la contraseña" required minLength="6" />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="telefono">Teléfono</label>
                            <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" placeholder="+54 9 11 1234-5678" />
                        </div>

                    </form>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        className="modal-btn modal-btn-cancel"
                        disabled={isSubmitting}
                    >
                        <i className="fas fa-times"></i>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="modal-btn modal-btn-submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check"></i>
                                Crear Usuario
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddUserModal;