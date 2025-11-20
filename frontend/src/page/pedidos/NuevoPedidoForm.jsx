// src/components/GestionPedidos/NuevoPedidoForm.jsx
import React, { useEffect, useState } from "react";
import { Form, Button, Row, Col, Card, Alert, Badge } from "react-bootstrap";
import {
  getClientes,
  getTransportistas,
  savePedido,
} from "../../services/pedidosService";
import "../../style/gestionpedidos.css";

const NuevoPedidoForm = ({ onOrderSaved, onCancel }) => {
  const [formData, setFormData] = useState({
    clienteId: "",
    fechaProgramada: "",
    destino: "",
    tipoDestino: "puerto",
    tempConsigne: "",
    transportistaId: "",
    observaciones: "",
    palletsIds: [],
  });

  const [clientes, setClientes] = useState([]);
  const [transportistas, setTransportistas] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Cargar clientes y transportistas al montar
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [cData, tData] = await Promise.all([
          getClientes(),
          getTransportistas(),
        ]);
        if (!mounted) return;
        setClientes(Array.isArray(cData) ? cData : []);
        setTransportistas(Array.isArray(tData) ? tData : []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setClientes([]);
        setTransportistas([]);
      }
    }
    loadData();
    return () => (mounted = false);
  }, []);

  const tiposDestino = [
    { value: "puerto", label: "Marítimo (Puerto)" },
    { value: "aeropuerto", label: "Aéreo (Aeropuerto)" },
    { value: "otra_ciudad", label: "Terrestre (Ciudad)" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handlePalletAdd = () => {
    setFormData((p) => ({
      ...p,
      palletsIds: [
        ...p.palletsIds,
        `TEMP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      ],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validación básica
    if (!formData.clienteId || !formData.fechaProgramada || !formData.destino) {
      setError("Por favor complete Cliente, Fecha Programada y Destino.");
      return;
    }

    setIsLoading(true);
    try {
      // Adaptar payload al backend
      const payload = {
        clienteId: Number(formData.clienteId),
        fechaProgramada: formData.fechaProgramada,
        destino: formData.destino,
        tipoDestino: formData.tipoDestino,
        transportistaId: formData.transportistaId
          ? Number(formData.transportistaId)
          : null,
        camionId: null, // si todavía no usás camión
        choferId: null, // si todavía no usás chofer
        observaciones: formData.observaciones || null,
      };

      const res = await savePedido(payload);

      // Backend puede devolver { od_id, od_code } o similar
      const code = res?.od_code ?? (res?.od_id ? `OD-${res.od_id}` : null);
      setSuccessMessage(
        code ? `Orden ${code} creada con éxito.` : "Orden creada con éxito."
      );

      // Si tenés pallets reales, aquí deberías llamar a la API para asociarlos (od_pallets)
      // (no implementado: depende de si tenés pallet_id reales)

      if (onOrderSaved) onOrderSaved();
    } catch (err) {
      setError("Error al guardar el pedido: " + (err.message || String(err)));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 mt-3 shadow-sm">
      <h4 className="text-citrus-dark mb-4">
        Detalle del Nuevo Pedido (Orden de Despacho)
      </h4>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <Form onSubmit={handleSubmit}>
        <h5 className="mb-3 mt-3 text-secondary">
          Datos del Cliente y Destino
        </h5>
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
              {clientes.map((c) => (
                <option key={c.cliente_id || c.id} value={c.cliente_id || c.id}>
                  {c.nombre}
                </option>
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
              {tiposDestino.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
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

        <h5 className="mb-3 mt-3 text-secondary">
          Asignación Logística (Opcional)
        </h5>
        <Row className="mb-4">
          <Form.Group as={Col} md="6">
            <Form.Label>Transportista</Form.Label>
            <Form.Control
              as="select"
              name="transportistaId"
              value={formData.transportistaId}
              onChange={handleChange}
            >
              <option value="">(Sin asignar)</option>
              {transportistas.map((t) => (
                <option
                  key={t.transportista_id || t.id}
                  value={t.transportista_id || t.id}
                >
                  {t.nombre}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group as={Col} md="6">
            <Form.Label>Observaciones</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
            />
          </Form.Group>
        </Row>

        <h5 className="mb-3 mt-3 text-secondary">
          Pallets Asociados (Contenido del Pedido)
        </h5>
        <Row className="mb-4">
          <Col md="10">
            <Form.Label>Pallets del Pedido:</Form.Label>
            <div
              className="pallet-list-box p-2 border rounded bg-light"
              style={{ minHeight: "80px" }}
            >
              {formData.palletsIds.length === 0 ? (
                <p className="text-muted m-0">
                  Aún no se han asociado pallets. Total: 0
                </p>
              ) : (
                <div>
                  {formData.palletsIds.map((id, index) => (
                    <Badge key={index} bg="info" className="me-2 mb-1">
                      {id}
                    </Badge>
                  ))}
                  <p className="m-0 mt-2 text-primary">
                    Total de Pallets: {formData.palletsIds.length}
                  </p>
                </div>
              )}
            </div>
          </Col>
          <Col md="2" className="d-flex align-items-end">
            <Button
              variant="outline-primary"
              onClick={handlePalletAdd}
              className="w-100"
            >
              Añadir Pallet
            </Button>
          </Col>
        </Row>

        <div className="d-flex justify-content-end">
          <Button variant="secondary" onClick={onCancel} className="me-2">
            Cancelar
          </Button>
          <Button variant="success" type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Crear Orden de Despacho"}
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default NuevoPedidoForm;
