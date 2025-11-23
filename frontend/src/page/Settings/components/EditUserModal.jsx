import React, { useState, useEffect } from 'react';
import { editUser } from "../services/settingsServices"; // Asegúrate de que esta ruta sea correcta
import "../../../style/addusermodal.css" // Reutiliza los estilos del modal de añadir
import { toast } from 'react-toastify'; // Importar toastify

// Definición de la función de servicio editUser
// export const editUser = async(id,userData) =>{
//   const response = await axios.put(`${USER_URL}/${id}`, userData) // Usar PUT o PATCH
//   return response.data;
// }

const EditUserModal = ({ isOpen, onClose, onUserUpdated, initialUserData }) => {
    // Estado inicial del formulario se carga con los datos del usuario
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        nombre: '',
        telefono: '',
        // La contraseña no se incluye aquí
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Cambiamos 'error' a 'localError' si prefieres mostrarlo también en el modal
    const [localError, setLocalError] = useState(null); 
    
    //console.log(initialUserData) // Mantener este console.log para debugging

    // Efecto para actualizar el formulario cuando cambian los datos iniciales
    useEffect(() => {
        if (initialUserData) {
            setFormData({
                username: initialUserData.username || '',
                email: initialUserData.email || '',
                nombre: initialUserData.nombre || '',
                telefono: initialUserData.telefono || '',
            });
            setLocalError(null); // Limpiar errores al abrir con nuevos datos
        }
    }, [initialUserData]);

    if (!isOpen || !initialUserData) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null);
        setIsSubmitting(true);

        try {
            if (!formData.username || !formData.email || !formData.nombre) {
                const requiredError = "Los campos obligatorios (*) no pueden estar vacíos.";
                setLocalError(requiredError);
                toast.error(requiredError);
                setIsSubmitting(false);
                return;
            }
            
            // Crea un objeto con los datos a enviar
            // Asumiendo que el ID en la tabla es 'user_id'
            const userId = initialUserData.user_id; 
            const dataToUpdate = { ...formData }; 
            
            // Llama a la función de edición
            await editUser(userId, dataToUpdate);
            
            // 🌟 Notificación de Éxito
            toast.success(`Usuario ${formData.username} actualizado con éxito!`);
            
            // Llama a la función de actualización y cierra el modal
            onUserUpdated();
            onClose();

        } catch (err) {
            const apiError = err.response?.data?.error || "Error al actualizar el usuario. Por favor, intenta nuevamente.";
            
            // ❌ Notificación de Error
            toast.error(apiError);
            setLocalError(apiError);

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
                
                {/* Header */}
                <div className="modal-header">
                    <h3>
                        <i className="fas fa-user-edit"></i>
                        Editar Usuario: {initialUserData.username}
                    </h3>
                    <button 
                        className="modal-close-btn"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {localError && (
                        <div className="modal-error">
                            {localError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Nombre Completo */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="nombre">
                                Nombre Completo <span className="required-star">*</span>
                            </label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Ingrese el nombre completo"
                                required
                            />
                        </div>

                        {/* Username */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="username">
                                Nombre de Usuario <span className="required-star">*</span>
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Ingrese el nombre de usuario"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Email <span className="required-star">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="usuario@ejemplo.com"
                                required
                            />
                        </div>

                        {/* Teléfono */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="telefono">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                id="telefono"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="+54 9 11 1234-5678"
                            />
                        </div>
                        
                        {/* Nota sobre la contraseña */}
                         <p className="form-note">
                             <i className="fas fa-info-circle"></i> La contraseña debe cambiarse en una sección separada.
                         </p>
                    </form>
                </div>

                {/* Footer */}
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
                                <i className="fas fa-save"></i>
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditUserModal;