// AddVariedadModal.jsx

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../../style/addusermodal.css"; 
import { createVariedad } from "../services/settingsServices";

const AddVariedadModal = ({ isOpen, onClose, productoId, productoNombre, onVariedadAdded }) => {
    const [formData, setFormData] = useState({
        producto_id: "",
        nombre: "",
        descripcion: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({producto_id:"", nombre: "", descripcion: "" });
            setLocalError(null);
        }
    }, [isOpen]);

    if (!isOpen || !productoId) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null);
        setIsSubmitting(true);

        try {
            if (!formData.nombre) {
                setLocalError("El nombre de la variedad es obligatorio.");
                toast.error("El nombre de la variedad es obligatorio.");
                setIsSubmitting(false);
                return;
            }

            const dataToSend = {
                producto_id: productoId, // Clave foránea
                nombre: formData.nombre,
                descripcion: formData.descripcion || null,
            };

            await createVariedad(dataToSend);

            toast.success(`Variedad "${formData.nombre}" agregada a ${productoNombre}.`);
            onVariedadAdded();
            onClose();

        } catch (err) {
            const apiError = err.response?.data?.error || "Error al crear la variedad.";
            toast.error(apiError);
            setLocalError(apiError);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3><i className="fas fa-seedling"></i> Añadir Variedad a {productoNombre}</h3>
                    {/* ... (Botón de cerrar) ... */}
                </div>
                <div className="modal-body">
                    {localError && <div className="modal-error">{localError}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Nombre de la Variedad <span className="required-star">*</span></label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Descripción</label>
                            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} className="form-input" rows="3" />
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    {/* ... (Botones de Cancelar y Guardar) ... */}
                    <button type="button" onClick={onClose} className="modal-btn modal-btn-cancel" disabled={isSubmitting}>Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="modal-btn modal-btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? (<><i className="fas fa-spinner fa-spin"></i> Guardando...</>) : (<><i className="fas fa-check"></i> Crear Variedad</>)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddVariedadModal;