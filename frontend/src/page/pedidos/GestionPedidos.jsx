// Codigo completo actualizado de GestionPedidos.jsx con datos desde backend
import React, { useState, useEffect } from "react";
import { Button, Table, Form, Card } from "react-bootstrap";
import NuevoPedidoForm from "./NuevoPedidoForm";
import { getPedidos } from "../../services/pedidosService";
import {
  FaSearch,
  FaSync,
  FaEye,
  FaPlus,
  FaFilter,
  FaTruck,
} from "react-icons/fa";
import "../../style/gestionpedidos.css";

const GestionPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [activeTab, setActiveTab] = useState("lista");
  const [filtros, setFiltros] = useState({ estado: "", cliente: "", transporte: "", fecha: "", busqueda: "" });

  const metrics = {
    activos: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "pendiente").length,
    enTransito: pedidos.filter((p) => p.estado === "en_ruta" || p.estado === "en_carga").length,
    exportados: pedidos.filter((p) => p.estado === "entregado").length,
  };

  const loadPedidos = async () => {
    try {
      const data = await getPedidos();
      setPedidos(data);
    } catch (error) {
      console.error("Error cargando pedidos", error);
    }
  };

  useEffect(() => { loadPedidos(); }, [filtros]);

  const handleFilterChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const badgeEstado = (estado) => {
    switch (estado) {
      case "pendiente": return <span className="status-pill pendiente">Pendiente</span>;
      case "en_carga":
      case "en_ruta": return <span className="status-pill en_ruta">En Tránsito</span>;
      case "entregado": return <span className="status-pill entregado">Exportado</span>;
      case "cancelado": return <span className="status-pill cancelado">Cancelado</span>;
      default: return <span className="status-pill entregado">{estado}</span>;
    }
  };

  const handleFormAction = () => { setActiveTab("lista"); loadPedidos(); };
  const handleCancel = () => { setActiveTab("lista"); };

  const ListaPedidosTab = () => (
    <>
      <div className="tab-content-header mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 text-secondary" style={{ fontSize: "1.1rem" }}>Listado Maestro de Exportaciones</h5>
        <div className="acciones">
          <Button variant="light" className="btn-icon me-2 shadow-sm border" onClick={loadPedidos}>
            <FaSync color="#666" />
          </Button>
        </div>
      </div>

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
            {pedidos.map((p) => (
              <tr key={p.od_id}>
                <td className="text-highlight">{p.od_code}</td>
                <td style={{ fontWeight: "500" }}>{p.cliente_nombre}</td>
                <td>{p.destino}</td>
                <td style={{ textTransform: "capitalize" }}>{p.tipo_destino}</td>
                <td>{p.fecha_programada?.substring(0, 10)}</td>
                <td className="text-center"><strong>{p.cantidad_pallets_prevista}</strong></td>
                <td className="text-center">{badgeEstado(p.estado)}</td>
                <td className="text-end">
                  <Button variant="link" className="btn-action-table me-2" title="Seguimiento GPS">
                    <FaTruck size={16} />
                  </Button>
                  <Button variant="link" className="btn-action-table" title="Ver / Editar Detalles" onClick={() => setActiveTab("detalle")}>
                    <FaEye size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="mt-3 text-muted small px-2">Mostrando {pedidos.length} registros encontrados.</div>
    </>
  );

  const NuevoPedidoTab = () => (<NuevoPedidoForm onOrderSaved={handleFormAction} onCancel={handleCancel} />);

  const DetallePedidoTab = () => (
    <Card className="p-5 mt-3 text-center shadow-sm" style={{ border: 'none', borderRadius: '12px' }}>
      <h4 className="text-citrus-dark mb-3">Detalle del Pedido</h4>
      <p className="text-muted mb-4">Vista detallada de la Orden de Despacho.</p>
      <div className="d-flex justify-content-center">
        <Button variant="outline-secondary" onClick={() => setActiveTab("lista")}>
          Volver al Listado
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="gestion-pedidos-page">
      <div className="page-header">
        <h2>Gestión de Pedidos / Exportaciones</h2>
        <div className="search-bar">
          <div className="search-input-group">
            <FaSearch />
            <input type="text" placeholder="Buscar pedido, cliente..." name="busqueda" onChange={handleFilterChange} />
          </div>
          <Button variant="outline-success" className="btn-filter-icon me-2"><FaFilter /> Filtros</Button>
          <Button variant="success" className="btn-new-op" onClick={() => setActiveTab("nuevo")}>
            <FaPlus className="me-2" /> Nuevo Pedido
          </Button>
        </div>
      </div>

      <div className="metric-cards-container">
        <Card className="metric-card"><h3 className="text-success-dark">{metrics.activos}</h3><p className="text-secondary">Pedidos Activos</p></Card>
        <Card className="metric-card"><h3 className="text-warning-dark">{metrics.pendientes}</h3><p className="text-secondary">Pendientes</p></Card>
        <Card className="metric-card"><h3 className="text-info-dark">{metrics.enTransito}</h3><p className="text-secondary">En Tránsito</p></Card>
        <Card className="metric-card"><h3 className="text-secondary-dark">{metrics.exportados}</h3><p className="text-secondary">Exportados</p></Card>
      </div>

      <div className="inline-filters-row">
        <Form.Select name="estado" onChange={handleFilterChange} className="filter-select">
          <option value="">Estado: Todos</option>
          <option value="en_ruta">En Tránsito</option>
          <option value="pendiente">Pendiente</option>
        </Form.Select>

        <Form.Control as="select" name="cliente" onChange={handleFilterChange} className="filter-select">
          <option value="">Cliente</option>
        </Form.Control>

        <Form.Select name="transporte" onChange={handleFilterChange} className="filter-select">
          <option value="">Transporte</option>
          <option value="marítimo">Marítimo</option>
          <option value="aéreo">Aéreo</option>
          <option value="terrestre">Terrestre</option>
        </Form.Select>

        <Form.Control type="date" name="fecha" onChange={handleFilterChange} className="filter-date" />
      </div>

      <div className="tabs-navigation">
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
