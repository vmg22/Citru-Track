// import React, { useEffect, useState } from "react";
// import { Button, Table, Form, Card, Alert, Spinner, Badge } from "react-bootstrap";
// import { FaSearch, FaSync, FaEye, FaPlus, FaFilter, FaTruck, FaPlusCircle, FaTrash } from "react-icons/fa";
// import Swal from 'sweetalert2';
// import "../../style/gestionpedidos.css";
// import NuevoPedidoForm from "./NuevoPedidoForm";
// import { getPedidos, updatePedido, getTransportistas, deletePedido, getClientes } from "../../services/pedidosService";

// const GestionPedidos = () => {
//   const [pedidos, setPedidos] = useState([]);
//   const [activeTab, setActiveTab] = useState("lista");
//   const [filtros, setFiltros] = useState({ estado: "", cliente: "", transporte: "", fecha: "", busqueda: "" });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const [selectedPedido, setSelectedPedido] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [saveMessage, setSaveMessage] = useState(null);

//   const [transportistas, setTransportistas] = useState([]);
//   const [clientes, setClientes] = useState([]);

//   const metrics = {
//     activos: pedidos.length,
//     pendientes: pedidos.filter((p) => p.estado === "pendiente").length,
//     enTransito: pedidos.filter((p) => p.estado === "en_ruta" || p.estado === "en_carga").length,
//     exportados: pedidos.filter((p) => p.estado === "entregado").length
//   };

//   useEffect(() => {
//     loadPedidos();
//     loadTransportistas();
//     loadClientes();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [filtros]);

//   async function loadPedidos() {
//     setError(null);
//     setLoading(true);
//     try {
//       const rows = await getPedidos();
//       console.log("[loadPedidos] Datos recibidos:", rows);
//       const list = Array.isArray(rows) ? rows : (rows?.data || []);
//       const filtered = list.filter((p) => {
//         if (filtros.estado && p.estado !== filtros.estado) return false;
//         if (filtros.cliente && p.cliente_nombre !== filtros.cliente) return false;
//         if (filtros.transporte && (p.tipo_destino || "").toLowerCase() !== filtros.transporte.toLowerCase()) return false;
//         if (filtros.fecha && p.fecha_programada && !p.fecha_programada.startsWith(filtros.fecha)) return false;
//         if (filtros.busqueda) {
//           const q = filtros.busqueda.toLowerCase();
//           const hay = (p.od_code || "") + " " + (p.cliente_nombre || "") + " " + (p.destino || "");
//           if (!hay.toLowerCase().includes(q)) return false;
//         }
//         return true;
//       });
//       setPedidos(filtered);
//     } catch (err) {
//       console.error("Error cargando pedidos", err);
//       setError(err.message || "Error cargando pedidos");
//       setPedidos([]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadTransportistas() {
//     try {
//       const t = await getTransportistas();
//       setTransportistas(Array.isArray(t) ? t : (t?.data || []));
//     } catch (err) {
//       console.error("Error cargando transportistas", err);
//       setTransportistas([]);
//     }
//   }

//   async function loadClientes() {
//     try {
//       const c = await getClientes();
//       console.log("[loadClientes] Clientes recibidos:", c);
//       setClientes(Array.isArray(c) ? c : (c?.data || []));
//     } catch (err) {
//       console.error("Error cargando clientes", err);
//       setClientes([]);
//     }
//   }

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFiltros((f) => ({ ...f, [name]: value }));
//   };

//   const badgeEstado = (estado) => {
//     switch (estado) {
//       case "pendiente": return <span className="status-pill pendiente">Pendiente</span>;
//       case "en_carga":
//       case "en_ruta": return <span className="status-pill en_ruta">En Tránsito</span>;
//       case "entregado": return <span className="status-pill entregado">Exportado</span>;
//       case "cancelado": return <span className="status-pill cancelado">Cancelado</span>;
//       default: return <span className="status-pill">{estado}</span>;
//     }
//   };

//   const handleFormAction = () => { setActiveTab("lista"); loadPedidos(); };
//   const handleCancel = () => { setActiveTab("lista"); };

//   const openDetalle = (pedido) => {
//     console.log("[openDetalle] Pedido original recibido:", pedido);
    
//     // Mapeo exhaustivo de todos los posibles nombres de campos
//     const normalized = {
//       ...pedido,
//       od_id: pedido.od_id ?? pedido.id ?? pedido.odId ?? null,
//       od_code: pedido.od_code ?? pedido.odCode ?? `OD-${pedido.od_id || pedido.id}`,
//       cliente_id: pedido.cliente_id ?? pedido.clienteId ?? null,
//       cliente_nombre: pedido.cliente_nombre ?? pedido.clienteNombre ?? pedido.cliente ?? "",
//       tipo_destino: pedido.tipo_destino ?? pedido.tipoDestino ?? "",
//       fecha_programada: pedido.fecha_programada ?? pedido.fechaProgramada ?? "",
//       transportista_id: pedido.transportista_id ?? pedido.transportistaId ?? null,
//       temperatura_consigne: pedido.temperatura_consigne ?? pedido.tempConsigne ?? pedido.temperaturaConsigne ?? "",
//       destino: pedido.destino ?? "",
//       observaciones: pedido.observaciones ?? "",
//       estado: pedido.estado ?? "pendiente",
//       palletsIds: pedido.palletsIds ?? pedido.od_pallets ?? []
//     };
    
//     console.log("[openDetalle] Pedido normalizado:", normalized);
//     setSelectedPedido({ ...normalized });
//     setSaveMessage(null);
//     setActiveTab("detalle");
//   };

//   const handleDeletePedido = async (pedido) => {
//     const pedidoId = pedido.od_id ?? pedido.id ?? pedido.odId;
//     const pedidoCode = pedido.od_code ?? pedido.odCode ?? `OD-${pedidoId}`;

//     const result = await Swal.fire({
//       title: '¿Estás seguro?',
//       html: `¿Deseas eliminar el pedido <strong>${pedidoCode}</strong>?<br/><small>Esta acción no se puede deshacer</small>`,
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#d33',
//       cancelButtonColor: '#3085d6',
//       confirmButtonText: 'Sí, eliminar',
//       cancelButtonText: 'Cancelar'
//     });

//     if (result.isConfirmed) {
//       try {
//         await deletePedido(pedidoId);
        
//         Swal.fire({
//           title: '¡Eliminado!',
//           text: `El pedido ${pedidoCode} ha sido eliminado exitosamente.`,
//           icon: 'success',
//           timer: 2000,
//           showConfirmButton: false
//         });
        
//         await loadPedidos();
//       } catch (err) {
//         console.error("Error eliminando pedido:", err);
//         Swal.fire({
//           title: 'Error',
//           text: err?.message || 'No se pudo eliminar el pedido',
//           icon: 'error',
//           confirmButtonText: 'Cerrar'
//         });
//       }
//     }
//   };

//   const handleDetalleChange = (e) => {
//     const { name, value } = e.target;
//     setSelectedPedido((p) => ({ ...p, [name]: value }));
//   };

//   const handleAddPallet = () => {
//     setSelectedPedido((p) => {
//       const next = [...(p.palletsIds || []), `TEMP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`];
//       return { ...p, palletsIds: next };
//     });
//   };
  
//   const handleRemovePallet = (idx) => {
//     setSelectedPedido((p) => {
//       const next = (p.palletsIds || []).filter((_, i) => i !== idx);
//       return { ...p, palletsIds: next };
//     });
//   };

//   const handleClearDetalle = () => {
//     if (!selectedPedido) return;
//     setSelectedPedido((p) => ({
//       ...p,
//       transportista_id: null,
//       palletsIds: [],
//       destino: "",
//       temperatura_consigne: "",
//       observaciones: ""
//     }));
//     setSaveMessage("Campos limpiados.");
//   };

//   const handleSaveDetalle = async () => {
//     if (!selectedPedido) return setSaveMessage("No hay pedido seleccionado.");
//     const pedidoId = selectedPedido.od_id ?? selectedPedido.id ?? selectedPedido.odId;
//     if (!pedidoId) return setSaveMessage("ID de pedido inválido.");

//     setSaving(true);
//     setSaveMessage(null);

//     try {
//       // Build payload with only modified/non-empty fields
//       const payload = {};
      
//       // Only add fields that have values
//       if (selectedPedido.destino?.trim()) {
//         payload.destino = selectedPedido.destino.trim();
//       }
      
//       if (selectedPedido.tipo_destino) {
//         payload.tipo_destino = selectedPedido.tipo_destino;
//       }
      
//       // Format date properly (YYYY-MM-DD)
//       if (selectedPedido.fecha_programada) {
//         const dateStr = selectedPedido.fecha_programada.substring(0, 10);
//         if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
//           payload.fecha_programada = dateStr;
//         }
//       }
      
//       if (selectedPedido.estado) {
//         payload.estado = selectedPedido.estado;
//       }
      
//       if (selectedPedido.observaciones?.trim()) {
//         payload.observaciones = selectedPedido.observaciones.trim();
//       }
      
//       // Cliente: ensure it's a number if backend expects it
//       if (selectedPedido.cliente_id) {
//         const cid = Number(selectedPedido.cliente_id);
//         if (!isNaN(cid)) {
//           payload.cliente_id = cid;
//         }
//       }
      
//       // Transportista: ensure it's a number if backend expects it
//       if (selectedPedido.transportista_id) {
//         const tid = Number(selectedPedido.transportista_id);
//         if (!isNaN(tid)) {
//           payload.transportista_id = tid;
//         }
//       }
      
//       // Temperature: ensure it's a number
//       if (selectedPedido.temperatura_consigne !== "" && selectedPedido.temperatura_consigne != null) {
//         const temp = Number(selectedPedido.temperatura_consigne);
//         if (!isNaN(temp)) {
//           payload.temperatura_consigne = temp;
//         }
//       }
      
//       // NOTE: No enviamos od_pallets en el PATCH (se omite intencionalmente)

//       console.log("[GestionPedidos] PATCH payload:", JSON.stringify(payload, null, 2), "pedidoId:", pedidoId);

//       const res = await updatePedido(pedidoId, payload);
//       console.log("[GestionPedidos] updatePedido response:", res);

//       setSaveMessage("Guardado exitoso.");
//       await loadPedidos();
//       if (res && typeof res === "object") {
//         setSelectedPedido((prev) => ({ ...prev, ...res }));
//       }
//     } catch (err) {
//       console.error("Error guardando detalle:", err);
//       const status = err?.status;
//       const body = err?.body;
//       let msg = err?.message || "Error al actualizar pedido";
//       if (status) msg += ` (status ${status})`;
//       if (body) {
//         const bodyMsg = typeof body === "string" ? body : (body?.message || body?.error || JSON.stringify(body));
//         msg += ` — ${bodyMsg}`;
//       }
//       setSaveMessage("Error al guardar: " + msg);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const ListaPedidosTab = () => (
//     <>
//       <div className="tab-content-header mb-3 d-flex justify-content-between align-items-center">
//         <h5 className="mb-0 text-secondary" style={{ fontSize: "1.1rem" }}>Listado Maestro de Exportaciones</h5>
//         <div className="acciones">
//           <Button variant="light" className="btn-icon me-2 shadow-sm border" onClick={loadPedidos} title="Refrescar">
//             <FaSync color="#666" />
//           </Button>
//         </div>
//       </div>

//       {error && <Alert variant="danger">{error}</Alert>}

//       <div className="table-container">
//         <Table responsive hover className="custom-table">
//           <thead>
//             <tr>
//               <th>N° Pedido</th>
//               <th>Cliente</th>
//               <th>Destino</th>
//               <th>Transporte</th>
//               <th>Fecha Est.</th>
//               <th className="text-center">Pallets</th>
//               <th className="text-center">Estado</th>
//               <th className="text-end">Acciones</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan="8" className="text-center py-4"><Spinner animation="border" size="sm" className="me-2" /> Cargando...</td></tr>
//             ) : pedidos.length === 0 ? (
//               <tr><td colSpan="8" className="text-center py-4 text-muted">No hay pedidos para mostrar.</td></tr>
//             ) : (
//               pedidos.map((p) => (
//                 <tr key={p.od_id || p.id || p.odId}>
//                   <td className="text-highlight">{p.od_code || p.odCode || `OD-${p.od_id || p.id}`}</td>
//                   <td style={{ fontWeight: "500" }}>{p.cliente_nombre || p.cliente}</td>
//                   <td>{p.destino}</td>
//                   <td style={{ textTransform: "capitalize" }}>{p.tipo_destino || p.tipoDestino}</td>
//                   <td>{(p.fecha_programada || p.fechaProgramada || "").substring(0, 10)}</td>
//                   <td className="text-center"><strong>{p.cantidad_pallets_prevista || p.cantidad_pallets || (p.od_pallets?.length ?? 0) || 0}</strong></td>
//                   <td className="text-center">{badgeEstado(p.estado)}</td>
//                   <td className="text-end">
//                     <Button variant="link" className="btn-action-table me-2" title="Seguimiento GPS"><FaTruck size={16} /></Button>
//                     <Button
//                       variant="link"
//                       className="btn-action-table me-2"
//                       title="Ver / Editar Detalles"
//                       onClick={() => openDetalle(p)}
//                     >
//                       <FaEye size={16} />
//                     </Button>
//                     <Button
//                       variant="link"
//                       className="btn-action-table text-danger"
//                       title="Eliminar Pedido"
//                       onClick={() => handleDeletePedido(p)}
//                     >
//                       <FaTrash size={16} />
//                     </Button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </Table>
//       </div>
//       <div className="mt-3 text-muted small px-2">Mostrando {pedidos.length} registros encontrados.</div>
//     </>
//   );

//   const NuevoPedidoTab = () => <NuevoPedidoForm onOrderSaved={handleFormAction} onCancel={handleCancel} />;

//   const DetallePedidoTab = () => {
//     if (!selectedPedido) {
//       return (
//         <Card className="p-5 mt-3 text-center shadow-sm" style={{ border: "none", borderRadius: "12px" }}>
//           <h4 className="text-citrus-dark mb-3">Detalle del Pedido</h4>
//           <p className="text-muted mb-4">No hay pedido seleccionado.</p>
//           <div className="d-flex justify-content-center">
//             <Button variant="outline-secondary" onClick={() => setActiveTab("lista")}>Volver al Listado</Button>
//           </div>
//         </Card>
//       );
//     }

//     return (
//       <Card className="p-4 mt-3 shadow-sm">
//         <h4 className="text-citrus-dark mb-3">Detalle del Pedido {selectedPedido.od_code || selectedPedido.odCode || `OD-${selectedPedido.od_id || selectedPedido.id}`}</h4>

//         {saveMessage && <Alert variant={saveMessage.startsWith("Error") ? "danger" : "success"}>{saveMessage}</Alert>}

//         <Form>
//           <Form.Group className="mb-2">
//             <Form.Label>Cliente</Form.Label>
//             <Form.Select 
//               name="cliente_id" 
//               value={selectedPedido.cliente_id ?? ""} 
//               onChange={handleDetalleChange}
//             >
//               <option value="">(Seleccionar cliente)</option>
//               {clientes.map((c) => (
//                 <option 
//                   key={c.cliente_id || c.id} 
//                   value={c.cliente_id || c.id}
//                 >
//                   {c.nombre || c.cliente_nombre || c.razon_social}
//                 </option>
//               ))}
//             </Form.Select>
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>Destino Final</Form.Label>
//             <Form.Control name="destino" value={selectedPedido.destino || ""} onChange={handleDetalleChange} />
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>Tipo de Destino</Form.Label>
//             <Form.Select name="tipo_destino" value={selectedPedido.tipo_destino || selectedPedido.tipoDestino || ""} onChange={handleDetalleChange}>
//               <option value="">(Seleccionar)</option>
//               <option value="puerto">Marítimo (Puerto)</option>
//               <option value="aeropuerto">Aéreo (Aeropuerto)</option>
//               <option value="otra_ciudad">Terrestre (Ciudad)</option>
//             </Form.Select>
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>Fecha Programada</Form.Label>
//             <Form.Control type="date" name="fecha_programada"
//               value={(selectedPedido.fecha_programada || "").substring(0,10)}
//               onChange={handleDetalleChange} />
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>Transportista</Form.Label>
//             <Form.Select name="transportista_id" value={selectedPedido.transportista_id ?? ""} onChange={handleDetalleChange}>
//               <option value="">(Sin asignar)</option>
//               {transportistas.map((t) => (
//                 <option key={t.transportista_id || t.id} value={t.transportista_id || t.id}>
//                   {t.nombre}
//                 </option>
//               ))}
//             </Form.Select>
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>Temperatura Consigne (°C)</Form.Label>
//             <Form.Control
//               type="number"
//               step="0.1"
//               name="temperatura_consigne"
//               value={selectedPedido.temperatura_consigne ?? ""}
//               onChange={handleDetalleChange}
//             />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Pallets Asociados</Form.Label>
//             <div style={{ minHeight: 80, border: "1px dashed #d6e6d6", padding: 12, borderRadius: 6, background: "#fafdf9" }}>
//               {(selectedPedido.palletsIds && selectedPedido.palletsIds.length) ? (
//                 selectedPedido.palletsIds.map((id, idx) => (
//                   <Badge key={idx} pill style={{ marginRight: 8, cursor: "default", padding: "8px 10px", borderRadius: 8 }}>
//                     {id}{" "}
//                     <FaTrash style={{ marginLeft: 6, cursor: "pointer" }} onClick={() => handleRemovePallet(idx)} />
//                   </Badge>
//                 ))
//               ) : (
//                 <div className="text-muted">Aún no se han asociado pallets.</div>
//               )}
//             </div>
//             <div style={{ marginTop: 8 }}>
//               <Button variant="outline-primary" size="sm" onClick={handleAddPallet}><FaPlusCircle className="me-1" /> Añadir Pallet</Button>
//             </div>
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Observaciones</Form.Label>
//             <Form.Control as="textarea" rows={3} name="observaciones" value={selectedPedido.observaciones || ""} onChange={handleDetalleChange} />
//           </Form.Group>

//           <div className="d-flex justify-content-center gap-2">
//             <Button variant="secondary" onClick={() => setActiveTab("lista")}>Volver</Button>

//             <Button
//               variant="warning"
//               onClick={handleClearDetalle}
//               style={{ background: "#fff7d6", color: "#7a5b00", border: "1px solid #f0c36d" }}
//             >
//               Limpiar
//             </Button>

//             <Button variant="success" onClick={handleSaveDetalle} disabled={saving}>
//               {saving ? "Guardando..." : "Guardar cambios"}
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     );
//   };

//   return (
//     <div className="gestion-pedidos-page">
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
//         <div style={{ flex: 1 }}>
//           <h2>Gestión de Pedidos / Exportaciones</h2>
//           <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
//             <div style={{ display: "flex", alignItems: "center" }} className="search-bar">
//               <div className="search-input-group">
//                 <FaSearch />
//                 <input type="text" placeholder="Buscar pedido, cliente..." name="busqueda" onChange={handleFilterChange} />
//               </div>
//             </div>

//             <Button variant="outline-success" className="btn-filter-icon me-2">
//               <FaFilter /> Filtros
//             </Button>

//             <Button variant="success" className="btn-new-op" onClick={() => setActiveTab("nuevo")}>
//               <FaPlus className="me-2" /> Nuevo Pedido
//             </Button>
//           </div>
//         </div>

//         <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
//           <Card className="metric-card text-center p-2" style={{ minWidth: 140 }}>
//             <h3 className="text-success-dark">{metrics.activos}</h3>
//             <p className="text-secondary">Pedidos Activos</p>
//           </Card>
//           <Card className="metric-card text-center p-2" style={{ minWidth: 140 }}>
//             <h3 className="text-warning-dark">{metrics.pendientes}</h3>
//             <p className="text-secondary">Pendientes</p>
//           </Card>
//           <Card className="metric-card text-center p-2" style={{ minWidth: 140 }}>
//             <h3 className="text-info-dark">{metrics.enTransito}</h3>
//             <p className="text-secondary">En Tránsito</p>
//           </Card>
//           <Card className="metric-card text-center p-2" style={{ minWidth: 140 }}>
//             <h3 className="text-secondary-dark">{metrics.exportados}</h3>
//             <p className="text-secondary">Exportados</p>
//           </Card>
//         </div>
//       </div>

//       <div className="inline-filters-row mt-3" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
//         <Form.Select name="estado" onChange={handleFilterChange} className="filter-select" style={{ width: 160 }}>
//           <option value="">Estado: Todos</option>
//           <option value="en_ruta">En Tránsito</option>
//           <option value="pendiente">Pendiente</option>
//         </Form.Select>

//         <Form.Control as="select" name="cliente" onChange={handleFilterChange} className="filter-select" style={{ width: 200 }}>
//           <option value="">Cliente</option>
//         </Form.Control>

//         <Form.Select name="transporte" onChange={handleFilterChange} className="filter-select" style={{ width: 160 }}>
//           <option value="">Transporte</option>
//           <option value="marítimo">Marítimo</option>
//           <option value="aéreo">Aéreo</option>
//           <option value="terrestre">Terrestre</option>
//         </Form.Select>

//         <Form.Control type="date" name="fecha" onChange={handleFilterChange} className="filter-date" style={{ width: 160 }} />
//       </div>

//       <div className="tabs-navigation mt-3">
//         <button className={activeTab === "lista" ? "tab-active" : ""} onClick={() => setActiveTab("lista")}>Lista de Pedidos</button>
//         <button className={activeTab === "nuevo" ? "tab-active" : ""} onClick={() => setActiveTab("nuevo")}>Nuevo Pedido</button>
//         <button className={activeTab === "detalle" ? "tab-active" : ""} onClick={() => setActiveTab("detalle")}>Detalle del Pedido</button>
//       </div>

//       <div className="tab-content-container" style={{ background: "transparent", boxShadow: "none", padding: 0 }}>
//         {activeTab === "lista" && <ListaPedidosTab />}
//         {activeTab === "nuevo" && <NuevoPedidoTab />}
//         {activeTab === "detalle" && <DetallePedidoTab />}
//       </div>
//     </div>
//   );
// };

// export default GestionPedidos;

import React, { useEffect, useState } from "react";
import { Button, Table, Form, Card, Alert, Spinner, Badge } from "react-bootstrap";
import { FaSearch, FaSync, FaEye, FaPlus, FaFilter, FaTruck, FaPlusCircle, FaTrash } from "react-icons/fa";
import Swal from 'sweetalert2';
import "../../style/gestionpedidos.css";
import NuevoPedidoForm from "./NuevoPedidoForm";
import { getPedidos, updatePedido, getTransportistas, deletePedido, getClientes } from "../../services/pedidosService";

const GestionPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [activeTab, setActiveTab] = useState("lista");
  const [filtros, setFiltros] = useState({ estado: "", cliente: "", transporte: "", fecha: "", busqueda: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedPedido, setSelectedPedido] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const [transportistas, setTransportistas] = useState([]);
  const [clientes, setClientes] = useState([]);

  const metrics = {
    activos: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "pendiente").length,
    enTransito: pedidos.filter((p) => p.estado === "en_ruta" || p.estado === "en_carga").length,
    exportados: pedidos.filter((p) => p.estado === "entregado").length
  };

  useEffect(() => {
    loadPedidos();
    loadTransportistas();
    loadClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  async function loadPedidos() {
    setError(null);
    setLoading(true);
    try {
      const rows = await getPedidos();
      console.log("[loadPedidos] Datos recibidos:", rows);
      const list = Array.isArray(rows) ? rows : (rows?.data || []);
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
      console.log("[loadTransportistas] Transportistas recibidos:", t);
      setTransportistas(Array.isArray(t) ? t : (t?.data || []));
    } catch (err) {
      console.error("Error cargando transportistas", err);
      setTransportistas([]);
    }
  }

  async function loadClientes() {
    try {
      const c = await getClientes();
      console.log("[loadClientes] Clientes recibidos:", c);
      setClientes(Array.isArray(c) ? c : (c?.data || []));
    } catch (err) {
      console.error("Error cargando clientes", err);
      setClientes([]);
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

  const openDetalle = (pedido) => {
    console.log("[openDetalle] Pedido original recibido:", pedido);
    console.log("[openDetalle] Clientes disponibles:", clientes);
    console.log("[openDetalle] Transportistas disponibles:", transportistas);
    
    // Intentar encontrar el cliente_id si solo tenemos el nombre
    let clienteId = pedido.cliente_id ?? pedido.clienteId ?? null;
    if (!clienteId && pedido.cliente_nombre && clientes.length > 0) {
      const clienteEncontrado = clientes.find(c => 
        (c.nombre === pedido.cliente_nombre) || 
        (c.cliente_nombre === pedido.cliente_nombre) ||
        (c.razon_social === pedido.cliente_nombre)
      );
      if (clienteEncontrado) {
        clienteId = clienteEncontrado.cliente_id || clienteEncontrado.id;
        console.log("[openDetalle] Cliente encontrado por nombre:", clienteEncontrado);
      }
    }
    
    // Mapeo exhaustivo de todos los posibles nombres de campos
    const normalized = {
      ...pedido,
      od_id: pedido.od_id ?? pedido.id ?? pedido.odId ?? null,
      od_code: pedido.od_code ?? pedido.odCode ?? `OD-${pedido.od_id || pedido.id}`,
      cliente_id: clienteId,
      cliente_nombre: pedido.cliente_nombre ?? pedido.clienteNombre ?? pedido.cliente ?? "",
      tipo_destino: pedido.tipo_destino ?? pedido.tipoDestino ?? "",
      fecha_programada: pedido.fecha_programada ?? pedido.fechaProgramada ?? "",
      transportista_id: pedido.transportista_id ?? pedido.transportistaId ?? null,
      temperatura_consigne: pedido.temperatura_consigne ?? pedido.tempConsigne ?? pedido.temperaturaConsigne ?? "",
      destino: pedido.destino ?? "",
      observaciones: pedido.observaciones ?? "",
      estado: pedido.estado ?? "pendiente",
      palletsIds: pedido.palletsIds ?? pedido.od_pallets ?? []
    };
    
    console.log("[openDetalle] Pedido normalizado:", normalized);
    setSelectedPedido({ ...normalized });
    setSaveMessage(null);
    setActiveTab("detalle");
  };

  const handleDeletePedido = async (pedido) => {
    const pedidoId = pedido.od_id ?? pedido.id ?? pedido.odId;
    const pedidoCode = pedido.od_code ?? pedido.odCode ?? `OD-${pedidoId}`;

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      html: `¿Deseas eliminar el pedido <strong>${pedidoCode}</strong>?<br/><small>Esta acción no se puede deshacer</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deletePedido(pedidoId);
        
        Swal.fire({
          title: '¡Eliminado!',
          text: `El pedido ${pedidoCode} ha sido eliminado exitosamente.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        await loadPedidos();
      } catch (err) {
        console.error("Error eliminando pedido:", err);
        Swal.fire({
          title: 'Error',
          text: err?.message || 'No se pudo eliminar el pedido',
          icon: 'error',
          confirmButtonText: 'Cerrar'
        });
      }
    }
  };

  const handleDetalleChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia el cliente, actualizar también el nombre
    if (name === "cliente_id") {
      const clienteSeleccionado = clientes.find(c => 
        String(c.cliente_id || c.id) === String(value)
      );
      if (clienteSeleccionado) {
        setSelectedPedido((p) => ({ 
          ...p, 
          cliente_id: value,
          cliente_nombre: clienteSeleccionado.nombre || clienteSeleccionado.cliente_nombre || clienteSeleccionado.razon_social
        }));
        return;
      }
    }
    
    setSelectedPedido((p) => ({ ...p, [name]: value }));
  };

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

  const handleSaveDetalle = async () => {
    if (!selectedPedido) return setSaveMessage("No hay pedido seleccionado.");
    const pedidoId = selectedPedido.od_id ?? selectedPedido.id ?? selectedPedido.odId;
    if (!pedidoId) return setSaveMessage("ID de pedido inválido.");

    setSaving(true);
    setSaveMessage(null);

    try {
      // Build payload with only modified/non-empty fields
      const payload = {};
      
      // Only add fields that have values
      if (selectedPedido.destino?.trim()) {
        payload.destino = selectedPedido.destino.trim();
      }
      
      if (selectedPedido.tipo_destino) {
        payload.tipo_destino = selectedPedido.tipo_destino;
      }
      
      // Format date properly (YYYY-MM-DD)
      if (selectedPedido.fecha_programada) {
        const dateStr = selectedPedido.fecha_programada.substring(0, 10);
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          payload.fecha_programada = dateStr;
        }
      }
      
      if (selectedPedido.estado) {
        payload.estado = selectedPedido.estado;
      }
      
      if (selectedPedido.observaciones?.trim()) {
        payload.observaciones = selectedPedido.observaciones.trim();
      }
      
      // Cliente: ensure it's a number if backend expects it
      if (selectedPedido.cliente_id) {
        const cid = Number(selectedPedido.cliente_id);
        if (!isNaN(cid)) {
          payload.cliente_id = cid;
        }
      }
      
      // Transportista: ensure it's a number if backend expects it
      if (selectedPedido.transportista_id) {
        const tid = Number(selectedPedido.transportista_id);
        if (!isNaN(tid)) {
          payload.transportista_id = tid;
        }
      }
      
      // Temperature: ensure it's a number
      if (selectedPedido.temperatura_consigne !== "" && selectedPedido.temperatura_consigne != null) {
        const temp = Number(selectedPedido.temperatura_consigne);
        if (!isNaN(temp)) {
          payload.temperatura_consigne = temp;
        }
      }
      
      // NOTE: No enviamos od_pallets en el PATCH (se omite intencionalmente)

      console.log("[GestionPedidos] PATCH payload:", JSON.stringify(payload, null, 2), "pedidoId:", pedidoId);

      const res = await updatePedido(pedidoId, payload);
      console.log("[GestionPedidos] updatePedido response:", res);

      setSaveMessage("Guardado exitoso.");
      await loadPedidos();
      if (res && typeof res === "object") {
        setSelectedPedido((prev) => ({ ...prev, ...res }));
      }
    } catch (err) {
      console.error("Error guardando detalle:", err);
      const status = err?.status;
      const body = err?.body;
      let msg = err?.message || "Error al actualizar pedido";
      if (status) msg += ` (status ${status})`;
      if (body) {
        const bodyMsg = typeof body === "string" ? body : (body?.message || body?.error || JSON.stringify(body));
        msg += ` — ${bodyMsg}`;
      }
      setSaveMessage("Error al guardar: " + msg);
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
                      className="btn-action-table me-2"
                      title="Ver / Editar Detalles"
                      onClick={() => openDetalle(p)}
                    >
                      <FaEye size={16} />
                    </Button>
                    <Button
                      variant="link"
                      className="btn-action-table text-danger"
                      title="Eliminar Pedido"
                      onClick={() => handleDeletePedido(p)}
                    >
                      <FaTrash size={16} />
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
        <h4 className="text-citrus-dark mb-3">Detalle del Pedido {selectedPedido.od_code || selectedPedido.odCode || `OD-${selectedPedido.od_id || selectedPedido.id}`}</h4>

        {saveMessage && <Alert variant={saveMessage.startsWith("Error") ? "danger" : "success"}>{saveMessage}</Alert>}

        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Cliente</Form.Label>
            <Form.Select 
              name="cliente_id" 
              value={selectedPedido.cliente_id ?? ""} 
              onChange={handleDetalleChange}
            >
              <option value="">(Seleccionar cliente)</option>
              {clientes.map((c) => (
                <option 
                  key={c.cliente_id || c.id} 
                  value={c.cliente_id || c.id}
                >
                  {c.nombre || c.cliente_nombre || c.razon_social}
                </option>
              ))}
            </Form.Select>
            {selectedPedido.cliente_nombre && !selectedPedido.cliente_id && (
              <Form.Text className="text-warning">
                Cliente actual: {selectedPedido.cliente_nombre} (seleccione del listado para actualizar)
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Destino Final</Form.Label>
            <Form.Control name="destino" value={selectedPedido.destino || ""} onChange={handleDetalleChange} />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Tipo de Destino</Form.Label>
            <Form.Select name="tipo_destino" value={selectedPedido.tipo_destino || selectedPedido.tipoDestino || ""} onChange={handleDetalleChange}>
              <option value="">(Seleccionar)</option>
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

  return (
    <div className="gestion-pedidos-page">
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