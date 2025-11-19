import React, { useState } from 'react';
import { createUser } from "../services/settingsServices"; 
import "../../../style/addusermodal.css"

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        nombre: '',
        telefono: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            if (!formData.username || !formData.password || !formData.email || !formData.nombre) {
                setError("Todos los campos marcados con * son obligatorios.");
                setIsSubmitting(false);
                return;
            }

            await createUser(formData);
            onUserAdded();
            onClose();
            setFormData({
                username: '',
                password: '',
                email: '',
                nombre: '',
                telefono: '',
            });
            
        } catch (err) {
            const apiError = err.response?.data?.error || "Error al crear el usuario. Por favor, intenta nuevamente.";
            setError(apiError);
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

                {/* Body */}
                <div className="modal-body">
                    {error && (
                        <div className="modal-error">
                            {error}
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

                        {/* Contraseña */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">
                                Contraseña <span className="required-star">*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Ingrese la contraseña"
                                required
                                minLength="6"
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