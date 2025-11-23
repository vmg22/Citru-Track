import React, { useEffect, useState } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Card,
  Alert,
  Badge,
  Table,
} from "react-bootstrap";
import {
  getClientes,
  getTransportistas,
  getProductos,
  getCamiones,
  getChoferes,
  getPalletsByProducto,
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
    productoId: "",
    transportistaId: "",
    camionId: "",
    choferId: "",
    observaciones: "",
    palletsIds: [],
  });

  const [clientes, setClientes] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [camiones, setCamiones] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [palletsDisponibles, setPalletsDisponibles] = useState([]);
  const [palletsSeleccionados, setPalletsSeleccionados] = useState([]);
  const [loadingPallets, setLoadingPallets] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Cargar clientes, transportistas, productos, camiones y choferes al montar
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [cData, tData, pData, camData, chofData] = await Promise.all([
          getClientes(),
          getTransportistas(),
          getProductos(),
          getCamiones(),
          getChoferes(),
        ]);
        if (!mounted) return;
        setClientes(Array.isArray(cData) ? cData : []);
        setTransportistas(Array.isArray(tData) ? tData : []);
        setProductos(Array.isArray(pData) ? pData : []);
        setCamiones(Array.isArray(camData) ? camData : []);
        setChoferes(Array.isArray(chofData) ? chofData : []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setClientes([]);
        setTransportistas([]);
        setProductos([]);
        setCamiones([]);
        setChoferes([]);
      }
    }
    loadData();
    return () => (mounted = false);
  }, []);

  // Cargar pallets cuando cambie el producto
  useEffect(() => {
    if (formData.productoId) {
      loadPalletsDisponibles(formData.productoId);
    } else {
      setPalletsDisponibles([]);
      setPalletsSeleccionados([]);
    }
  }, [formData.productoId]);

  const loadPalletsDisponibles = async (productoId) => {
    setLoadingPallets(true);
    try {
      const pallets = await getPalletsByProducto(productoId);
      setPalletsDisponibles(Array.isArray(pallets) ? pallets : []);
    } catch (err) {
      console.error("Error cargando pallets:", err);
      setPalletsDisponibles([]);
      setError("Error al cargar pallets disponibles: " + err.message);
    } finally {
      setLoadingPallets(false);
    }
  };

  const tiposDestino = [
    { value: "puerto", label: "Marítimo (Puerto)" },
    { value: "aeropuerto", label: "Aéreo (Aeropuerto)" },
    { value: "otra_ciudad", label: "Terrestre (Ciudad)" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => {
      const newData = { ...p, [name]: value };

      // Si cambia el transportista, resetear camión y chofer
      if (name === "transportistaId") {
        newData.camionId = "";
        newData.choferId = "";
      }

      // Si cambia el producto, limpiar pallets seleccionados
      if (name === "productoId") {
        setPalletsSeleccionados([]);
      }

      return newData;
    });
  };

  const handlePalletCheck = (pallet, isChecked) => {
    if (isChecked) {
      setPalletsSeleccionados((prev) => [...prev, pallet]);
    } else {
      setPalletsSeleccionados((prev) =>
        prev.filter((p) => p.pallet_id !== pallet.pallet_id)
      );
    }
  };

  const handleAgregarPallets = () => {
    if (palletsSeleccionados.length === 0) {
      setError("Seleccione al menos un pallet antes de agregar.");
      return;
    }

    setFormData((p) => ({
      ...p,
      palletsIds: [
        ...p.palletsIds,
        ...palletsSeleccionados.map((pal) => pal.pallet_id),
      ],
    }));

    // Remover pallets agregados de la lista de disponibles
    setPalletsDisponibles((prev) =>
      prev.filter(
        (p) =>
          !palletsSeleccionados.find((sel) => sel.pallet_id === p.pallet_id)
      )
    );

    setPalletsSeleccionados([]);
    setError(null);
  };

  const handleRemoverPallet = (palletId) => {
    setFormData((p) => ({
      ...p,
      palletsIds: p.palletsIds.filter((id) => id !== palletId),
    }));

    // Recargar pallets disponibles para ese producto
    if (formData.productoId) {
      loadPalletsDisponibles(formData.productoId);
    }
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

    if (!formData.productoId) {
      setError("Por favor seleccione un Producto.");
      return;
    }

    if (formData.palletsIds.length === 0) {
      setError("Debe seleccionar al menos un pallet para el pedido.");
      return;
    }

    setIsLoading(true);
    try {
      // 🔧 Construir payload SIN campo 'estado'
      const payload = {
        clienteId: Number(formData.clienteId),
        fechaProgramada: formData.fechaProgramada,
        destino: formData.destino,
        tipoDestino: formData.tipoDestino,
        productoId: formData.productoId ? Number(formData.productoId) : null,
        transportistaId: formData.transportistaId
          ? Number(formData.transportistaId)
          : null,
        camionId: formData.camionId ? Number(formData.camionId) : null,
        choferId: formData.choferId ? Number(formData.choferId) : null,
        temperatura_consigne: formData.tempConsigne
          ? Number(formData.tempConsigne)
          : null,
        observaciones: formData.observaciones || null,
        palletsIds: formData.palletsIds,
      };

      // 🔍 LOG para verificar qué se envía
      console.log(
        "🔍 PAYLOAD ANTES DE ENVIAR:",
        JSON.stringify(payload, null, 2)
      );

      const res = await savePedido(payload);

      console.log("✅ RESPUESTA DEL SERVIDOR:", res);

      // Backend devuelve { ok: true, od_id, od_code, totales }
      const code = res?.od_code ?? (res?.od_id ? `OD-${res.od_id}` : null);
      setSuccessMessage(
        code ? `Orden ${code} creada con éxito.` : "Orden creada con éxito."
      );

      // Limpiar formulario después de crear
      setFormData({
        clienteId: "",
        fechaProgramada: "",
        destino: "",
        tipoDestino: "puerto",
        tempConsigne: "",
        productoId: "",
        transportistaId: "",
        camionId: "",
        choferId: "",
        observaciones: "",
        palletsIds: [],
      });

      // Notificar al componente padre
      if (onOrderSaved) onOrderSaved();
    } catch (err) {
      console.error("❌ ERROR AL GUARDAR:", err);
      setError("Error al guardar el pedido: " + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar camiones activos asociados al transportista seleccionado
  const camionesDisponibles = camiones.filter((c) => {
    const esActivo = c.estado === "activo" || c.activo === true;
    const perteneceAlTransportista = formData.transportistaId
      ? String(c.transportista_id) === String(formData.transportistaId)
      : false;
    return esActivo && perteneceAlTransportista;
  });

  // Filtrar choferes activos asociados al transportista seleccionado
  const choferesDisponibles = choferes.filter((ch) => {
    const esActivo = ch.estado === "activo" || ch.activo === true;
    const perteneceAlTransportista = formData.transportistaId
      ? String(ch.transportista_id) === String(formData.transportistaId)
      : false;
    return esActivo && perteneceAlTransportista;
  });

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

        <Row className="mb-4">
          <Form.Group as={Col} md="12">
            <Form.Label>Producto (*)</Form.Label>
            <Form.Control
              as="select"
              name="productoId"
              value={formData.productoId}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione Producto</option>
              {productos.map((p) => (
                <option
                  key={p.producto_id || p.id}
                  value={p.producto_id || p.id}
                >
                  {p.nombre}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Row>

        {/* TABLA DE PALLETS DISPONIBLES */}
        {formData.productoId && (
          <>
            <h5 className="mb-3 mt-4 text-secondary">
              Pallets Disponibles en Cámara
            </h5>
            {loadingPallets ? (
              <Alert variant="info">Cargando pallets...</Alert>
            ) : palletsDisponibles.length === 0 ? (
              <Alert variant="warning">
                No hay pallets disponibles en cámara para este producto.
              </Alert>
            ) : (
              <>
                <div className="pallets-disponibles-table-wrapper">
                  <Table
                    striped
                    bordered
                    hover
                    className="pallets-disponibles-table mb-3"
                  >
                    <thead>
                      <tr>
                        <th className="pallets-col-checkbox">Seleccionar</th>
                        <th className="pallets-col-id">ID Pallet</th>
                        <th className="pallets-col-lote">Lote</th>
                        <th className="pallets-col-cajas">Cajas</th>
                        <th className="pallets-col-peso">Peso (kg)</th>
                        <th className="pallets-col-tipo">Tipo Pallet</th>
                        <th className="pallets-col-fecha">Fecha Armado</th>
                        <th className="pallets-col-estado">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {palletsDisponibles.map((pallet) => (
                        <tr key={pallet.pallet_id}>
                          <td className="text-center align-middle">
                            <Form.Check
                              type="checkbox"
                              checked={palletsSeleccionados.some(
                                (p) => p.pallet_id === pallet.pallet_id
                              )}
                              onChange={(e) =>
                                handlePalletCheck(pallet, e.target.checked)
                              }
                            />
                          </td>
                          <td className="align-middle">
                            <strong>{pallet.pallet_id}</strong>
                          </td>
                          <td className="align-middle">
                            {pallet.lote_descripcion ||
                              `Lote #${pallet.lote_id}` ||
                              "-"}
                          </td>
                          <td className="text-center align-middle">
                            <Badge bg="info" className="px-3 py-2">
                              {pallet.cantidad_cajas || 0}
                            </Badge>
                          </td>
                          <td className="text-center align-middle">
                            <strong>
                              {parseFloat(pallet.peso_total || 0).toFixed(2)}
                            </strong>
                          </td>
                          <td className="align-middle">
                            {pallet.tipo_pallet || "-"}
                          </td>
                          <td className="text-center align-middle">
                            {pallet.fecha_armado
                              ? new Date(
                                  pallet.fecha_armado
                                ).toLocaleDateString("es-AR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              : "-"}
                          </td>
                          <td className="text-center align-middle">
                            <Badge bg="success" className="px-3 py-2">
                              {pallet.estado}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <div className="pallets-disponibles-footer d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                  <div className="text-muted">
                    <strong>Total disponibles:</strong>{" "}
                    {palletsDisponibles.length} pallet(s)
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleAgregarPallets}
                    disabled={palletsSeleccionados.length === 0}
                  >
                    Agregar Pallets Seleccionados ({palletsSeleccionados.length}
                    )
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        <h5 className="mb-3 mt-3 text-secondary">
          Asignación Logística (Opcional)
        </h5>
        <Row className="mb-4">
          <Form.Group as={Col} md="12">
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
        </Row>

        {/* Mostrar Camión y Chofer solo si hay transportista seleccionado */}
        {formData.transportistaId && (
          <Row className="mb-4">
            <Form.Group as={Col} md="6">
              <Form.Label>Camión</Form.Label>
              <Form.Control
                as="select"
                name="camionId"
                value={formData.camionId}
                onChange={handleChange}
              >
                <option value="">(Sin asignar)</option>
                {camionesDisponibles.length > 0 ? (
                  camionesDisponibles.map((c) => (
                    <option
                      key={c.camion_id || c.id}
                      value={c.camion_id || c.id}
                    >
                      {c.patente} -{" "}
                      {c.tipo_camion || c.tipo || "Tipo no especificado"}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No hay camiones activos para este transportista
                  </option>
                )}
              </Form.Control>
            </Form.Group>

            <Form.Group as={Col} md="6">
              <Form.Label>Chofer</Form.Label>
              <Form.Control
                as="select"
                name="choferId"
                value={formData.choferId}
                onChange={handleChange}
              >
                <option value="">(Sin asignar)</option>
                {choferesDisponibles.length > 0 ? (
                  choferesDisponibles.map((ch) => (
                    <option
                      key={ch.chofer_id || ch.id}
                      value={ch.chofer_id || ch.id}
                    >
                      {ch.nombre}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No hay choferes activos para este transportista
                  </option>
                )}
              </Form.Control>
            </Form.Group>
          </Row>
        )}

        <Row className="mb-4">
          <Form.Group as={Col} md="12">
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
          Pallets Asociados al Pedido (*)
        </h5>
        <Row className="mb-4">
          <Col md="12">
            <Form.Label>Pallets del Pedido:</Form.Label>
            <div
              className="pallet-list-box p-3 border rounded bg-light"
              style={{ minHeight: "100px" }}
            >
              {formData.palletsIds.length === 0 ? (
                <p className="text-muted m-0">
                  Aún no se han asociado pallets. Debe agregar al menos uno.
                </p>
              ) : (
                <div>
                  <Row>
                    {formData.palletsIds.map((id, index) => (
                      <Col md="3" key={index} className="mb-2">
                        <Badge
                          bg="success"
                          className="w-100 p-2 d-flex justify-content-between align-items-center"
                        >
                          <span>{id}</span>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-white p-0 ms-2"
                            onClick={() => handleRemoverPallet(id)}
                            style={{ textDecoration: "none" }}
                          >
                            ✕
                          </Button>
                        </Badge>
                      </Col>
                    ))}
                  </Row>
                  <p className="m-0 mt-3 text-primary fw-bold">
                    Total de Pallets: {formData.palletsIds.length}
                  </p>
                </div>
              )}
            </div>
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
