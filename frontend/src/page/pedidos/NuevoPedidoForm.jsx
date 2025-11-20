// ✍️ NuevoPedidoForm.jsx

import React, { useState } from 'react';
import { Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
// Importa tus servicios para guardar el pedido y obtener datos
// import { saveOrder } from '../../services/pedidosService'; 
// import { fetchClientes } from '../../services/clientesService'; 
import "../../style/gestionpedidos.css"

const NuevoPedidoForm = ({ onOrderSaved, onCancel }) => {
    // --- Estado para el formulario ---
    const [formData, setFormData] = useState({
        clienteId: '',
        fechaProgramada: '',
        destino: '',
        tipoDestino: 'puerto', // Valor por defecto
        tempConsigne: '',
        // Campos para la logística, que podrían dejarse nulos inicialmente
        transportistaId: '', 
        camionId: '',
        choferId: '',
        observaciones: '',
        // Pallets se manejaría en una sección separada (Simplificado aquí)
        palletsIds: [], 
    });
    
    // --- Estados Auxiliares ---
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // --- Datos de Opciones (Simulados) ---
    // En un entorno real, estos vendrían de la API (fetchClientes, etc.)
    const clientes = [
        { id: 1, nombre: 'Importadora Europea S.A.' },
        { id: 2, nombre: 'Distribuciones Norte SA' },
    ];
    const tiposDestino = [
        { value: 'puerto', label: 'Marítimo (Puerto)' },
        { value: 'aeropuerto', label: 'Aéreo (Aeropuerto)' },
        { value: 'otra_ciudad', label: 'Terrestre (Ciudad)' },
    ];

    // --- Manejadores ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePalletAdd = () => {
        // Lógica para abrir modal/selector de Pallets y añadirlos al array palletsIds
        alert("Función para añadir Pallets: Esta lógica requiere un modal o buscador de Pallets listos.");
        // Ejemplo de adición simple:
        setFormData(prev => ({ 
            ...prev, 
            palletsIds: [...prev.palletsIds, `PALL-TEMP-${Math.random().toFixed(4)}`] 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        // Validaciones básicas
        if (!formData.clienteId || !formData.fechaProgramada || !formData.destino) {
            setError("Por favor, complete los campos obligatorios (*).");
            setIsLoading(false);
            return;
        }

        try {
            // Lógica de guardado (Descomentar en la implementación real)
            // const newOrder = await saveOrder(formData); 
            // setSuccessMessage(`Pedido ${newOrder.od_code} creado con éxito.`);

            // Simulación exitosa
            setSuccessMessage("Pedido OD-2025-X01 creado con éxito.");
            
            // Llamar a la función para notificar al componente padre
            // onOrderSaved(); 

        } catch (err) {
            setError("Error al guardar el pedido: " + (err.message || "Problema de conexión."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="p-4 mt-3 shadow-sm">
            <h4 className="text-citrus-dark mb-4">Detalle del Nuevo Pedido (Orden de Despacho)</h4>

            {error && <Alert variant="danger">{error}</Alert>}
            {successMessage && <Alert variant="success">{successMessage}</Alert>}

            <Form onSubmit={handleSubmit}>
                {/* --- SECCIÓN PRINCIPAL: DATOS DEL PEDIDO --- */}
                <h5 className="mb-3 mt-3 text-secondary">Datos del Cliente y Destino</h5>
                <Row className="mb-3">
                    <Form.Group as={Col} md="6">
                        <Form.Label>Cliente (*)</Form.Label>
                        <Form.Control
                            as="select"
                            name="clienteId"
                            value={formData.clienteId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Seleccione Cliente</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </Form.Control>
                    </Form.Group>
                    <Form.Group as={Col} md="6">
                        <Form.Label>Fecha de Carga Programada (*)</Form.Label>
                        <Form.Control
                            type="date"
                            name="fechaProgramada"
                            value={formData.fechaProgramada}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                </Row>

                <Row className="mb-4">
                    <Form.Group as={Col} md="4">
                        <Form.Label>Tipo de Destino (*)</Form.Label>
                        <Form.Control
                            as="select"
                            name="tipoDestino"
                            value={formData.tipoDestino}
                            onChange={handleChange}
                            required
                        >
                            {tiposDestino.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </Form.Control>
                    </Form.Group>
                    <Form.Group as={Col} md="5">
                        <Form.Label>Destino Final (Puerto/Ciudad) (*)</Form.Label>
                        <Form.Control
                            type="text"
                            name="destino"
                            placeholder="Ej: Puerto de Rotterdam / Aeropuerto de Miami"
                            value={formData.destino}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="3">
                        <Form.Label>Temp. Consigne (°C)</Form.Label>
                        <Form.Control
                            type="number"
                            step="0.1"
                            name="tempConsigne"
                            placeholder="Ej: -1.0"
                            value={formData.tempConsigne}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </Row>

                {/* --- SECCIÓN LOGÍSTICA (Puede ser asignada después) --- */}
                <h5 className="mb-3 mt-3 text-secondary">Asignación Logística (Opcional)</h5>
                <Row className="mb-4">
                    <Form.Group as={Col} md="4">
                        <Form.Label>Transportista</Form.Label>
                        <Form.Control as="select" name="transportistaId" value={formData.transportistaId} onChange={handleChange}>
                            <option value="">(Sin asignar)</option>
                            {/* Opciones de transportistas */}
                        </Form.Control>
                    </Form.Group>
                    <Form.Group as={Col} md="4">
                        <Form.Label>Camión (Patente)</Form.Label>
                        <Form.Control as="select" name="camionId" value={formData.camionId} onChange={handleChange}>
                            <option value="">(Sin asignar)</option>
                            {/* Opciones de camiones disponibles */}
                        </Form.Control>
                    </Form.Group>
                    <Form.Group as={Col} md="4">
                        <Form.Label>Chofer</Form.Label>
                        <Form.Control as="select" name="choferId" value={formData.choferId} onChange={handleChange}>
                            <option value="">(Sin asignar)</option>
                            {/* Opciones de choferes disponibles */}
                        </Form.Control>
                    </Form.Group>
                </Row>
                
                {/* --- SECCIÓN PALLETS --- */}
                <h5 className="mb-3 mt-3 text-secondary">Pallets Asociados (Contenido del Pedido)</h5>
                <Row className="mb-4">
                    <Col md="10">
                        <Form.Label>Pallets del Pedido:</Form.Label>
                        <div className="pallet-list-box p-2 border rounded bg-light" style={{ minHeight: '80px' }}>
                            {formData.palletsIds.length === 0 ? (
                                <p className="text-muted m-0">Aún no se han asociado pallets. Total: 0</p>
                            ) : (
                                <div>
                                    {formData.palletsIds.map((id, index) => (
                                        <Badge key={index} bg="info" className="me-2 mb-1">{id}</Badge>
                                    ))}
                                    <p className="m-0 mt-2 text-primary">Total de Pallets: **{formData.palletsIds.length}**</p>
                                </div>
                            )}
                        </div>
                    </Col>
                    <Col md="2" className="d-flex align-items-end">
                        <Button variant="outline-primary" onClick={handlePalletAdd} className="w-100">
                            <i className="fas fa-barcode"></i> Añadir Pallet
                        </Button>
                    </Col>
                </Row>

                {/* --- OBSERVACIONES Y ACCIONES --- */}
                <Form.Group className="mb-4">
                    <Form.Label>Observaciones</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={handleChange}
                    />
                </Form.Group>

                <div className="d-flex justify-content-end">
                    <Button variant="secondary" onClick={onCancel} className="me-2">
                        Cancelar
                    </Button>
                    <Button variant="success" type="submit" disabled={isLoading}>
                        {isLoading ? 'Guardando...' : 'Crear Orden de Despacho'}
                    </Button>
                </div>
            </Form>
        </Card>
    );
};

export default NuevoPedidoForm;