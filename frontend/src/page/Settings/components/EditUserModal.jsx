import React, { useState, useEffect } from 'react';
import { editUser } from "../services/settingsServices"; 
import "../../../style/addusermodal.css" 
import { toast } from 'react-toastify';

const EditUserModal = ({ isOpen, onClose, onUserUpdated, initialUserData }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        nombre: '',
        telefono: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState(null); 

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
            const userId = initialUserData.user_id; 
            const dataToUpdate = { ...formData }; 
            
            await editUser(userId, dataToUpdate);
            
            toast.success(`Usuario ${formData.username} actualizado con éxito!`);
            
            onUserUpdated();
            onClose();

        } catch (err) {
            const apiError = err.response?.data?.error || "Error al actualizar el usuario. Por favor, intenta nuevamente.";
            
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
                        
                         <p className="form-note">
                             <i className="fas fa-info-circle"></i> La contraseña debe cambiarse en una sección separada.
                         </p>
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