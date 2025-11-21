import React, { useEffect, useState } from "react";
import { Button, Table, Form, Card, Alert, Spinner, Badge } from "react-bootstrap";
import { FaSearch, FaSync, FaEye, FaPlus, FaFilter, FaTruck, FaPlusCircle, FaTrash } from "react-icons/fa";
import "../../style/gestionpedidos.css";
import NuevoPedidoForm from "./NuevoPedidoForm";
import { getPedidos, updatePedido, getTransportistas } from "../../services/pedidosService";

const GestionPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [activeTab, setActiveTab] = useState("lista");
  const [filtros, setFiltros] = useState({ estado: "", cliente: "", transporte: "", fecha: "", busqueda: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pedido seleccionado para ver/editar
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // transportistas para select en detalle
  const [transportistas, setTransportistas] = useState([]);

  const metrics = {
    activos: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "pendiente").length,
    enTransito: pedidos.filter((p) => p.estado === "en_ruta" || p.estado === "en_carga").length,
    exportados: pedidos.filter((p) => p.estado === "entregado").length
  };

  useEffect(() => {
    loadPedidos();
    loadTransportistas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  async function loadPedidos() {
    setError(null);
    setLoading(true);
    try {
      const rows = await getPedidos();
      const list = Array.isArray(rows) ? rows : (rows?.data || []);
      // aplicar filtros de forma simple
      const filtered = list.filter((p) => {
        if (filtros.estado && p.estado !== filtros.estado) return false;
        if (filtros.cliente && p.cliente_nombre !== filtros.cliente) return false;
        if (filtros.transporte && (p.tipo_destino || "").toLowerCase() !== filtros.transporte.toLowerCase()) return false;
        if (filtros.fecha && p.fecha_programada && !p.fecha_programada.startsWith(filtros.fecha)) return false;
        if (filtros.busqueda) {
          const q = filtros.busqueda.toLowerCase();
          const hay = (p.od_code || "") + " " + (p.cliente_nombre || "") + " " + (p.destino || "");
          if (!hay.toLowerCase().includes(q)) return false;
        }
        return true;
      });
      setPedidos(filtered);
    } catch (err) {
      console.error("Error cargando pedidos", err);
      setError(err.message || "Error cargando pedidos");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadTransportistas() {
    try {
      const t = await getTransportistas();
      setTransportistas(Array.isArray(t) ? t : (t?.data || []));
    } catch (err) {
      console.error("Error cargando transportistas", err);
      setTransportistas([]);
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros((f) => ({ ...f, [name]: value }));
  };

  const badgeEstado = (estado) => {
    switch (estado) {
      case "pendiente": return <span className="status-pill pendiente">Pendiente</span>;
      case "en_carga":
      case "en_ruta": return <span className="status-pill en_ruta">En Tránsito</span>;
      case "entregado": return <span className="status-pill entregado">Exportado</span>;
      case "cancelado": return <span className="status-pill cancelado">Cancelado</span>;
      default: return <span className="status-pill">{estado}</span>;
    }
  };

  const handleFormAction = () => { setActiveTab("lista"); loadPedidos(); };
  const handleCancel = () => { setActiveTab("lista"); };

  // ABRE DETALLE: guarda pedido en estado y cambia pestaña
  const openDetalle = (pedido) => {
    // normalizar nombres de campos para editar localmente
    const normalized = {
      ...pedido,
      // asegurar nombres esperados
      tipo_destino: pedido.tipo_destino ?? pedido.tipoDestino ?? "",
      fecha_programada: pedido.fecha_programada ?? pedido.fechaProgramada ?? "",
      transportista_id: pedido.transportista_id ?? pedido.transportistaId ?? null,
      temperatura_consigne: pedido.temperatura_consigne ?? pedido.tempConsigne ?? "",
      palletsIds: pedido.palletsIds ?? pedido.od_pallets ?? [] // si traes pallets reales del backend
    };
    setSelectedPedido({ ...normalized });
    setSaveMessage(null);
    setActiveTab("detalle");
  };

  // manejar cambios en el form de detalle
  const handleDetalleChange = (e) => {
    const { name, value } = e.target;
    setSelectedPedido((p) => ({ ...p, [name]: value }));
  };

  // pallets: agregar / remover (temporal)
  const handleAddPallet = () => {
    setSelectedPedido((p) => {
      const next = [...(p.palletsIds || []), `TEMP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`];
      return { ...p, palletsIds: next };
    });
  };
  const handleRemovePallet = (idx) => {
    setSelectedPedido((p) => {
      const next = (p.palletsIds || []).filter((_, i) => i !== idx);
      return { ...p, palletsIds: next };
    });
  };

  // Limpiar (botón amarillo suave)
  const handleClearDetalle = () => {
    if (!selectedPedido) return;
    setSelectedPedido((p) => ({
      ...p,
      transportista_id: null,
      palletsIds: [],
      destino: "",
      temperatura_consigne: "",
      observaciones: ""
    }));
    setSaveMessage("Campos limpiados.");
  };

  // Guardar cambios -> PATCH
  const handleSaveDetalle = async () => {
    if (!selectedPedido || !selectedPedido.od_id) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      // armar payload sólo con los campos permitidos para actualizar
      const payload = {
        destino: selectedPedido.destino,
        tipo_destino: selectedPedido.tipo_destino,
        fecha_programada: selectedPedido.fecha_programada,
        estado: selectedPedido.estado,
        observaciones: selectedPedido.observaciones ?? null,
        transportista_id: selectedPedido.transportista_id || null,
        temperatura_consigne:
          selectedPedido.temperatura_consigne !== "" ? Number(selectedPedido.temperatura_consigne) : null,
        // si querés enviar pallets, nombra la propiedad que tu backend espera; aquí la envío como od_pallets (ejemplo)
        od_pallets: selectedPedido.palletsIds || []
      };

      await updatePedido(selectedPedido.od_id, payload);
      setSaveMessage("Guardado exitoso.");
      await loadPedidos(); // refrescar lista
      // actualizar selectedPedido con valores persistidos opcionalmente
    } catch (err) {
      console.error("Error guardando detalle:", err);
      setSaveMessage("Error al guardar: " + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  const ListaPedidosTab = () => (
    <>
      <div className="tab-content-header mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 text-secondary" style={{ fontSize: "1.1rem" }}>Listado Maestro de Exportaciones</h5>
        <div className="acciones">
          <Button variant="light" className="btn-icon me-2 shadow-sm border" onClick={loadPedidos} title="Refrescar">
            <FaSync color="#666" />
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="table-container">
        <Table responsive hover className="custom-table">
          <thead>
            <tr>
              <th>N° Pedido</th>
              <th>Cliente</th>
              <th>Destino</th>
              <th>Transporte</th>
              <th>Fecha Est.</th>
              <th className="text-center">Pallets</th>
              <th className="text-center">Estado</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center py-4"><Spinner animation="border" size="sm" className="me-2" /> Cargando...</td></tr>
            ) : pedidos.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-4 text-muted">No hay pedidos para mostrar.</td></tr>
            ) : (
              pedidos.map((p) => (
                <tr key={p.od_id || p.id || p.odId}>
                  <td className="text-highlight">{p.od_code || p.odCode || `OD-${p.od_id || p.id}`}</td>
                  <td style={{ fontWeight: "500" }}>{p.cliente_nombre || p.cliente}</td>
                  <td>{p.destino}</td>
                  <td style={{ textTransform: "capitalize" }}>{p.tipo_destino || p.tipoDestino}</td>
                  <td>{(p.fecha_programada || p.fechaProgramada || "").substring(0, 10)}</td>
                  <td className="text-center"><strong>{p.cantidad_pallets_prevista || p.cantidad_pallets || (p.od_pallets?.length ?? 0) || 0}</strong></td>
                  <td className="text-center">{badgeEstado(p.estado)}</td>
                  <td className="text-end">
                    <Button variant="link" className="btn-action-table me-2" title="Seguimiento GPS"><FaTruck size={16} /></Button>
                    <Button
                      variant="link"
                      className="btn-action-table"
                      title="Ver / Editar Detalles"
                      onClick={() => openDetalle(p)}
                    >
                      <FaEye size={16} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
      <div className="mt-3 text-muted small px-2">Mostrando {pedidos.length} registros encontrados.</div>
    </>
  );

  const NuevoPedidoTab = () => <NuevoPedidoForm onOrderSaved={handleFormAction} onCancel={handleCancel} />;

  const DetallePedidoTab = () => {
    if (!selectedPedido) {
      return (
        <Card className="p-5 mt-3 text-center shadow-sm" style={{ border: "none", borderRadius: "12px" }}>
          <h4 className="text-citrus-dark mb-3">Detalle del Pedido</h4>
          <p className="text-muted mb-4">No hay pedido seleccionado.</p>
          <div className="d-flex justify-content-center">
            <Button variant="outline-secondary" onClick={() => setActiveTab("lista")}>Volver al Listado</Button>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-4 mt-3 shadow-sm">
        <h4 className="text-citrus-dark mb-3">Detalle del Pedido {selectedPedido.od_code || selectedPedido.odCode || `OD-${selectedPedido.od_id}`}</h4>

        {saveMessage && <Alert variant={saveMessage.startsWith("Error") ? "danger" : "success"}>{saveMessage}</Alert>}

        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Cliente</Form.Label>
            <Form.Control type="text" value={selectedPedido.cliente_nombre || selectedPedido.cliente || ""} readOnly />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Destino Final</Form.Label>
            <Form.Control name="destino" value={selectedPedido.destino || ""} onChange={handleDetalleChange} />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Tipo de Destino</Form.Label>
            <Form.Select name="tipo_destino" value={selectedPedido.tipo_destino || selectedPedido.tipoDestino || ""} onChange={handleDetalleChange}>
              <option value="puerto">Marítimo (Puerto)</option>
              <option value="aeropuerto">Aéreo (Aeropuerto)</option>
              <option value="otra_ciudad">Terrestre (Ciudad)</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Fecha Programada</Form.Label>
            <Form.Control type="date" name="fecha_programada"
              value={(selectedPedido.fecha_programada || "").substring(0,10)}
              onChange={handleDetalleChange} />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Transportista</Form.Label>
            <Form.Select name="transportista_id" value={selectedPedido.transportista_id ?? ""} onChange={handleDetalleChange}>
              <option value="">(Sin asignar)</option>
              {transportistas.map((t) => (
                <option key={t.transportista_id || t.id} value={t.transportista_id || t.id}>
                  {t.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Temperatura Consigne (°C)</Form.Label>
            <Form.Control
              type="number"
              step="0.1"
              name="temperatura_consigne"
              value={selectedPedido.temperatura_consigne ?? ""}
              onChange={handleDetalleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Pallets Asociados</Form.Label>
            <div style={{ minHeight: 80, border: "1px dashed #d6e6d6", padding: 12, borderRadius: 6, background: "#fafdf9" }}>
              {(selectedPedido.palletsIds && selectedPedido.palletsIds.length) ? (
                selectedPedido.palletsIds.map((id, idx) => (
                  <Badge key={idx} pill style={{ marginRight: 8, cursor: "default", padding: "8px 10px", borderRadius: 8 }}>
                    {id}{" "}
                    <FaTrash style={{ marginLeft: 6, cursor: "pointer" }} onClick={() => handleRemovePallet(idx)} />
                  </Badge>
                ))
              ) : (
                <div className="text-muted">Aún no se han asociado pallets.</div>
              )}
            </div>
            <div style={{ marginTop: 8 }}>
              <Button variant="outline-primary" size="sm" onClick={handleAddPallet}><FaPlusCircle className="me-1" /> Añadir Pallet</Button>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Observaciones</Form.Label>
            <Form.Control as="textarea" rows={3} name="observaciones" value={selectedPedido.observaciones || ""} onChange={handleDetalleChange} />
          </Form.Group>

          <div className="d-flex justify-content-center gap-2">
            <Button variant="secondary" onClick={() => setActiveTab("lista")}>Volver</Button>

            {/* Limpiar: amarillo suave */}
            <Button
              variant="warning"
              onClick={handleClearDetalle}
              style={{ background: "#fff7d6", color: "#7a5b00", border: "1px solid #f0c36d" }}
            >
              Limpiar
            </Button>

            <Button variant="success" onClick={handleSaveDetalle} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </Form>
      </Card>
    );
  };

  // RENDER
  return (
    <div className="gestion-pedidos-page">
      {/* HEADER ROW: título + search + acciones */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h2>Gestión de Pedidos / Exportaciones</h2>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center" }} className="search-bar">
              <div className="search-input-group">
                <FaSearch />
                <input type="text" placeholder="Buscar pedido, cliente..." name="busqueda" onChange={handleFilterChange} />
              </div>
            </div>

            <Button variant="outline-success" className="btn-filter-icon me-2">
              <FaFilter /> Filtros
            </Button>

            <Button variant="success" className="btn-new-op" onClick={() => setActiveTab("nuevo")}>
              <FaPlus className="me-2" /> Nuevo Pedido
            </Button>
          </div>
        </div>

        {/* METRIC CARDS - colocadas en la parte superior a la derecha */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Card className="metric-card text-center p-2" style={{ minWidth: 140 }}>
            <h3 className="text-success-dark">{metrics.activos}</h3>
            <p className="text-secondary">Pedidos Activos</p>
          </Card>
          <Card className="metric-card text-center p-2" style={{ minWidth: 140 }}>
            <h3 className="text-warning-dark">{metrics.pendientes}</h3>
            <p className="text-secondary">Pendientes</p>
          </Card>
          <Card className="metric-card text-center p-2" style={{ minWidth: 140 }}>
            <h3 className="text-info-dark">{metrics.enTransito}</h3>
            <p className="text-secondary">En Tránsito</p>
          </Card>
          <Card className="metric-card text-center p-2" style={{ minWidth: 140 }}>
            <h3 className="text-secondary-dark">{metrics.exportados}</h3>
            <p className="text-secondary">Exportados</p>
          </Card>
        </div>
      </div>

      {/* FILTROS INLINE (debajo del header/cards) */}
      <div className="inline-filters-row mt-3" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Form.Select name="estado" onChange={handleFilterChange} className="filter-select" style={{ width: 160 }}>
          <option value="">Estado: Todos</option>
          <option value="en_ruta">En Tránsito</option>
          <option value="pendiente">Pendiente</option>
        </Form.Select>

        <Form.Control as="select" name="cliente" onChange={handleFilterChange} className="filter-select" style={{ width: 200 }}>
          <option value="">Cliente</option>
        </Form.Control>

        <Form.Select name="transporte" onChange={handleFilterChange} className="filter-select" style={{ width: 160 }}>
          <option value="">Transporte</option>
          <option value="marítimo">Marítimo</option>
          <option value="aéreo">Aéreo</option>
          <option value="terrestre">Terrestre</option>
        </Form.Select>

        <Form.Control type="date" name="fecha" onChange={handleFilterChange} className="filter-date" style={{ width: 160 }} />
      </div>

      {/* TABS */}
      <div className="tabs-navigation mt-3">
        <button className={activeTab === "lista" ? "tab-active" : ""} onClick={() => setActiveTab("lista")}>Lista de Pedidos</button>
        <button className={activeTab === "nuevo" ? "tab-active" : ""} onClick={() => setActiveTab("nuevo")}>Nuevo Pedido</button>
        <button className={activeTab === "detalle" ? "tab-active" : ""} onClick={() => setActiveTab("detalle")}>Detalle del Pedido</button>
      </div>

      <div className="tab-content-container" style={{ background: "transparent", boxShadow: "none", padding: 0 }}>
        {activeTab === "lista" && <ListaPedidosTab />}
        {activeTab === "nuevo" && <NuevoPedidoTab />}
        {activeTab === "detalle" && <DetallePedidoTab />}
      </div>
    </div>
  );
};

export default GestionPedidos;
