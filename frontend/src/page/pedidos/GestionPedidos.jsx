
import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Form,
  Card,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import {
  FaSearch,
  FaSync,
  FaEye,
  FaPlus,
  FaFilter,
  FaTruck,
  FaPlusCircle,
  FaTrash,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "../../style/gestionpedidos.css";
import NuevoPedidoForm from "./NuevoPedidoForm";
import {
  getPedidos,
  updatePedido,
  getTransportistas,
  deletePedido,
  getClientes,
  getCamiones,
  getChoferes,
  getProductos,
  getPalletsParaEditar, // 🔥 IMPORTAR (nueva función)
} from "../../services/pedidosService";

const GestionPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [activeTab, setActiveTab] = useState("lista");
  const [filtros, setFiltros] = useState({
    estado: "",
    cliente: "",
    transporte: "",
    fecha: "",
    busqueda: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedPedido, setSelectedPedido] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const [transportistas, setTransportistas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [camiones, setCamiones] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [productos, setProductos] = useState([]);

  // Estados para pallets disponibles
  const [palletsDisponibles, setPalletsDisponibles] = useState([]);
  const [palletsSeleccionados, setPalletsSeleccionados] = useState([]);
  const [loadingPallets, setLoadingPallets] = useState(false);

  //estado para paginacion
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const metrics = {
    activos: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "pendiente").length,
    enTransito: pedidos.filter(
      (p) => p.estado === "en_ruta" || p.estado === "en_carga"
    ).length,
    exportados: pedidos.filter((p) => p.estado === "entregado").length,
    rechazados: pedidos.filter((p) => p.estado === "rechazado").length,
  };
    

  useEffect(() => {
  setCurrentPage(1); // Resetear a la primera página cuando cambien los filtros
  loadPedidos();
  loadTransportistas();
  loadClientes();
  loadCamiones();
  loadChoferes();
  loadProductos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [filtros]);



  // 🔥 PASO 6: Cargar pallets cuando se edita un pedido existente
  useEffect(() => {
    if (
      selectedPedido?.od_id &&
      selectedPedido?.producto_id &&
      selectedPedido.estado === "pendiente" &&
      activeTab === "detalle"
    ) {
      loadPalletsParaEditar(selectedPedido.od_id, selectedPedido.producto_id);
    } else {
      setPalletsDisponibles([]);
      setPalletsSeleccionados([]);
    }
  }, [selectedPedido?.producto_id, selectedPedido?.od_id, selectedPedido?.estado, activeTab]);

  async function loadPedidos() {
    setError(null);
    setLoading(true);
    try {
      const rows = await getPedidos();
      console.log("[loadPedidos] Datos recibidos:", rows);
      const list = Array.isArray(rows) ? rows : rows?.data || [];
      const filtered = list.filter((p) => {
        if (filtros.estado && p.estado !== filtros.estado) return false;
        if (filtros.cliente && p.cliente_nombre !== filtros.cliente)
          return false;
        if (
          filtros.transporte &&
          (p.tipo_destino || "").toLowerCase() !==
            filtros.transporte.toLowerCase()
        )
          return false;
        if (
          filtros.fecha &&
          p.fecha_programada &&
          !p.fecha_programada.startsWith(filtros.fecha)
        )
          return false;
        if (filtros.busqueda) {
          const q = filtros.busqueda.toLowerCase();
          const hay =
            (p.od_code || "") +
            " " +
            (p.cliente_nombre || "") +
            " " +
            (p.destino || "");
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
      setTransportistas(Array.isArray(t) ? t : t?.data || []);
    } catch (err) {
      console.error("Error cargando transportistas", err);
      setTransportistas([]);
    }
  }

  async function loadClientes() {
    try {
      const c = await getClientes();
      console.log("[loadClientes] Clientes recibidos:", c);
      setClientes(Array.isArray(c) ? c : c?.data || []);
    } catch (err) {
      console.error("Error cargando clientes", err);
      setClientes([]);
    }
  }

  async function loadCamiones() {
    try {
      const cam = await getCamiones();
      console.log("[loadCamiones] Camiones recibidos:", cam);
      setCamiones(Array.isArray(cam) ? cam : cam?.data || []);
    } catch (err) {
      console.error("Error cargando camiones", err);
      setCamiones([]);
    }
  }

  async function loadChoferes() {
    try {
      const chof = await getChoferes();
      console.log("[loadChoferes] Choferes recibidos:", chof);
      setChoferes(Array.isArray(chof) ? chof : chof?.data || []);
    } catch (err) {
      console.error("Error cargando choferes", err);
      setChoferes([]);
    }
  }

  async function loadProductos() {
    try {
      const p = await getProductos();
      console.log("[loadProductos] Productos recibidos:", p);
      setProductos(Array.isArray(p) ? p : p?.data || []);
    } catch (err) {
      console.error("Error cargando productos", err);
      setProductos([]);
    }
  }

  // Función para paginación
  const getPaginatedPedidos = () => {
  // Ordenar pedidos por fecha de creación (más recientes primero)
  const sortedPedidos = [...pedidos].sort((a, b) => {
    const dateA = new Date(a.created_at || a.fecha_programada || 0);
    const dateB = new Date(b.created_at || b.fecha_programada || 0);
    return dateB - dateA; // Orden descendente (más recientes primero)
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedPedidos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedPedidos.length / itemsPerPage);

  return {
    currentItems,
    totalPages,
    totalItems: sortedPedidos.length
  };
};

// Función para cambiar de página
const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};


  // 🔥 PASO 6: Nueva función para cargar pallets al editar
  const loadPalletsParaEditar = async (pedidoId, productoId) => {
    setLoadingPallets(true);
    try {
      console.log(`🔍 [loadPalletsParaEditar] pedidoId: ${pedidoId}, productoId: ${productoId}`);
      const pallets = await getPalletsParaEditar(pedidoId, productoId);
      
      console.log("📦 Pallets recibidos:", pallets);
      
      // Separar pallets por origen
      const asociados = pallets.filter(p => p.origen === 'asociado');
      const disponibles = pallets.filter(p => p.origen === 'disponible');
      
      console.log("✅ Pallets asociados:", asociados.length);
      console.log("✅ Pallets disponibles:", disponibles.length);
      
      // Pre-seleccionar los pallets ya asociados
      const palletsIdsAsociados = asociados.map(p => p.pallet_id);
      
      setSelectedPedido(prev => ({
        ...prev,
        palletsIds: palletsIdsAsociados
      }));
      
      // Mostrar todos los pallets (asociados + disponibles)
      setPalletsDisponibles(pallets);
      
    } catch (err) {
      console.error("❌ Error cargando pallets:", err);
      setPalletsDisponibles([]);
      setSaveMessage("Error al cargar pallets: " + err.message);
    } finally {
      setLoadingPallets(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros((f) => ({ ...f, [name]: value }));
  };

  const badgeEstado = (estado) => {
    switch (estado) {
      case "pendiente":
        return <span className="status-pill pendiente">Pendiente</span>;
      case "en_carga":
      case "en_ruta":
        return <span className="status-pill en_ruta">En Tránsito</span>;
      case "entregado":
        return <span className="status-pill entregado">Exportado</span>;
      case "cancelado":
        return <span className="status-pill cancelado">Cancelado</span>;
      case "rechazado":
        return <span className="status-pill rechazado">Rechazado</span>;
      default:
        return <span className="status-pill">{estado}</span>;
    }
  };

  const handleFormAction = () => {
    setActiveTab("lista");
    loadPedidos();
  };
  
  const handleCancel = () => {
    setActiveTab("lista");
  };

  const openDetalle = (pedido) => {
    console.log("[openDetalle] Pedido original recibido:", pedido);

    // VALIDAR ESTADO - Solo permitir edición de pedidos en estado "pendiente"
    if (pedido.estado !== "pendiente") {
      Swal.fire({
        title: "No se puede editar",
        text: 'No puedes actualizar el pedido en este estado. Solo se pueden editar pedidos en estado "Pendiente".',
        icon: "warning",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    console.log("[openDetalle] Clientes disponibles:", clientes);
    console.log("[openDetalle] Transportistas disponibles:", transportistas);

    // Intentar encontrar el cliente_id si solo tenemos el nombre
    let clienteId = pedido.cliente_id ?? pedido.clienteId ?? null;
    if (!clienteId && pedido.cliente_nombre && clientes.length > 0) {
      const clienteEncontrado = clientes.find(
        (c) =>
          c.nombre === pedido.cliente_nombre ||
          c.cliente_nombre === pedido.cliente_nombre ||
          c.razon_social === pedido.cliente_nombre
      );
      if (clienteEncontrado) {
        clienteId = clienteEncontrado.cliente_id || clienteEncontrado.id;
        console.log(
          "[openDetalle] Cliente encontrado por nombre:",
          clienteEncontrado
        );
      }
    }

    // Extraer IDs de pallets desde od_pallets si existe
    let palletsIds = [];
    if (Array.isArray(pedido.od_pallets)) {
      palletsIds = pedido.od_pallets.map((p) => {
        if (typeof p === "object" && p !== null) {
          return p.pallet_id || p.id || p;
        }
        return p;
      });
    } else if (Array.isArray(pedido.palletsIds)) {
      palletsIds = pedido.palletsIds;
    }

    console.log("[openDetalle] Pallets extraídos:", palletsIds);

    // Mapeo exhaustivo de todos los posibles nombres de campos
    const normalized = {
      ...pedido,
      od_id: pedido.od_id ?? pedido.id ?? pedido.odId ?? null,
      od_code:
        pedido.od_code ?? pedido.odCode ?? `OD-${pedido.od_id || pedido.id}`,
      cliente_id: clienteId,
      cliente_nombre:
        pedido.cliente_nombre ?? pedido.clienteNombre ?? pedido.cliente ?? "",
      producto_id: pedido.producto_id ?? pedido.productoId ?? null,
      tipo_destino: pedido.tipo_destino ?? pedido.tipoDestino ?? "",
      fecha_programada: pedido.fecha_programada ?? pedido.fechaProgramada ?? "",
      transportista_id:
        pedido.transportista_id ?? pedido.transportistaId ?? null,
      camion_id: pedido.camion_id ?? pedido.camionId ?? null,
      chofer_id: pedido.chofer_id ?? pedido.choferId ?? null,
      temperatura_consigne:
        pedido.temperatura_consigne ??
        pedido.tempConsigne ??
        pedido.temperaturaConsigne ??
        "",
      destino: pedido.destino ?? "",
      observaciones: pedido.observaciones ?? "",
      estado: pedido.estado ?? "pendiente",
      palletsIds: palletsIds,
    };

    console.log("[openDetalle] Pedido normalizado:", normalized);
    console.log(
      "[openDetalle] Pallets finales en normalized:",
      normalized.palletsIds
    );

    // Limpiar estados de pallets
    setPalletsDisponibles([]);
    setPalletsSeleccionados([]);

    setSelectedPedido({ ...normalized });
    setSaveMessage(null);
    setActiveTab("detalle");
  };

  const handleDeletePedido = async (pedido) => {
    const pedidoId = pedido.od_id ?? pedido.id ?? pedido.odId;
    const pedidoCode = pedido.od_code ?? pedido.odCode ?? `OD-${pedidoId}`;

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      html: `¿Deseas eliminar el pedido <strong>${pedidoCode}</strong>?<br/><small>Esta acción no se puede deshacer</small>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deletePedido(pedidoId);

        Swal.fire({
          title: "¡Eliminado!",
          text: `El pedido ${pedidoCode} ha sido eliminado exitosamente.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        await loadPedidos();
      } catch (err) {
        console.error("Error eliminando pedido:", err);
        Swal.fire({
          title: "Error",
          text: err?.message || "No se pudo eliminar el pedido",
          icon: "error",
          confirmButtonText: "Cerrar",
        });
      }
    }
  };

  const handleDetalleChange = (e) => {
    const { name, value } = e.target;

    // Si cambia el cliente, actualizar también el nombre
    if (name === "cliente_id") {
      const clienteSeleccionado = clientes.find(
        (c) => String(c.cliente_id || c.id) === String(value)
      );
      if (clienteSeleccionado) {
        setSelectedPedido((p) => ({
          ...p,
          cliente_id: value,
          cliente_nombre:
            clienteSeleccionado.nombre ||
            clienteSeleccionado.cliente_nombre ||
            clienteSeleccionado.razon_social,
        }));
        return;
      }
    }

    // Si cambia el transportista, resetear camión y chofer
    if (name === "transportista_id") {
      setSelectedPedido((p) => ({
        ...p,
        transportista_id: value,
        camion_id: null,
        chofer_id: null,
      }));
      return;
    }

    // Si cambia el producto, limpiar pallets seleccionados y recargar
    if (name === "producto_id") {
      setPalletsSeleccionados([]);
      setSelectedPedido((p) => ({ ...p, producto_id: value }));
      return;
    }

    setSelectedPedido((p) => ({ ...p, [name]: value }));
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
      setSaveMessage("Seleccione al menos un pallet antes de agregar.");
      return;
    }

    setSelectedPedido((p) => ({
      ...p,
      palletsIds: [
        ...(p.palletsIds || []),
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
    setSaveMessage("Pallets agregados exitosamente.");
  };

  const handleAddPallet = () => {
    setSelectedPedido((p) => {
      const next = [
        ...(p.palletsIds || []),
        `TEMP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      ];
      return { ...p, palletsIds: next };
    });
  };

  const handleRemovePallet = (palletId) => {
    setSelectedPedido((p) => {
      const next = (p.palletsIds || []).filter((id) => id !== palletId);
      return { ...p, palletsIds: next };
    });

    // Recargar pallets disponibles
    if (selectedPedido?.od_id && selectedPedido?.producto_id) {
      loadPalletsParaEditar(selectedPedido.od_id, selectedPedido.producto_id);
    }
  };

  const handleClearDetalle = () => {
    if (!selectedPedido) return;
    setSelectedPedido((p) => ({
      ...p,
      transportista_id: null,
      camion_id: null,
      chofer_id: null,
      palletsIds: [],
      destino: "",
      temperatura_consigne: "",
      observaciones: "",
    }));
    setSaveMessage("Campos limpiados.");
  };

  const handleSaveDetalle = async () => {
    if (!selectedPedido) return setSaveMessage("No hay pedido seleccionado.");
    const pedidoId =
      selectedPedido.od_id ?? selectedPedido.id ?? selectedPedido.odId;
    if (!pedidoId) return setSaveMessage("ID de pedido inválido.");

    // VALIDAR ESTADO ANTES DE GUARDAR
    if (selectedPedido.estado !== "pendiente") {
      Swal.fire({
        title: "No se puede guardar",
        text: 'No puedes actualizar el pedido en este estado. Solo se pueden editar pedidos en estado "Pendiente".',
        icon: "error",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#d33",
      });
      return;
    }

    if (!selectedPedido.palletsIds || selectedPedido.palletsIds.length === 0) {
      Swal.fire({
        title: "Falta información",
        text: "Debe agregar al menos un pallet al pedido.",
        icon: "warning",
        confirmButtonText: "Entendido",
      });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const payload = {};

      if (selectedPedido.destino?.trim()) {
        payload.destino = selectedPedido.destino.trim();
      }

      if (selectedPedido.tipo_destino) {
        let tipoDestino = selectedPedido.tipo_destino.toLowerCase().trim();
        
        // Mapear valores antiguos/incorrectos a valores correctos del ENUM
        const mapeoTipos = {
          'marítimo': 'puerto',
          'maritimo': 'puerto',
          'aéreo': 'aeropuerto',
          'aereo': 'aeropuerto',
          'terrestre': 'otra_ciudad',
          'regreso a planta': 'regreso_planta',
          'regreso_a_planta': 'regreso_planta',
          // Mantener valores correctos
          'puerto': 'puerto',
          'aeropuerto': 'aeropuerto',
          'otra_ciudad': 'otra_ciudad',
          'regreso_planta': 'regreso_planta'
        };
        
        payload.tipo_destino = mapeoTipos[tipoDestino] || tipoDestino;
      }

      if (selectedPedido.producto_id) {
        const pid = Number(selectedPedido.producto_id);
        if (!isNaN(pid)) {
          payload.productoId = pid;
        }
      }

      if (selectedPedido.fecha_programada) {
        const dateStr = selectedPedido.fecha_programada.substring(0, 10);
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          payload.fecha_programada = dateStr;
        }
      }

      if (selectedPedido.estado) {
        payload.estado = selectedPedido.estado.toLowerCase().trim();
      }

      if (selectedPedido.observaciones?.trim()) {
        payload.observaciones = selectedPedido.observaciones.trim();
      }

      if (selectedPedido.cliente_id) {
        const cid = Number(selectedPedido.cliente_id);
        if (!isNaN(cid)) {
          payload.clienteId = cid;
        }
      }

      if (selectedPedido.transportista_id) {
        const tid = Number(selectedPedido.transportista_id);
        if (!isNaN(tid)) {
          payload.transportistaId = tid;
        }
      }

      if (selectedPedido.camion_id) {
        const camId = Number(selectedPedido.camion_id);
        if (!isNaN(camId)) {
          payload.camionId = camId;
        }
      }

      if (selectedPedido.chofer_id) {
        const chofId = Number(selectedPedido.chofer_id);
        if (!isNaN(chofId)) {
          payload.choferId = chofId;
        }
      }

      if (
        selectedPedido.temperatura_consigne !== "" &&
        selectedPedido.temperatura_consigne != null
      ) {
        const temp = Number(selectedPedido.temperatura_consigne);
        if (!isNaN(temp)) {
          payload.temperatura_consigne = temp;
        }
      }

      if (
        Array.isArray(selectedPedido.palletsIds) &&
        selectedPedido.palletsIds.length > 0
      ) {
        payload.palletsIds = selectedPedido.palletsIds;
      }

      console.log(
        "[GestionPedidos] PATCH payload:",
        JSON.stringify(payload, null, 2),
        "pedidoId:",
        pedidoId
      );

      const res = await updatePedido(pedidoId, payload);
      console.log("[GestionPedidos] updatePedido response:", res);

      Swal.fire({
        title: "¡Guardado!",
        text: "Los cambios se han guardado exitosamente.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      setSaveMessage("Guardado exitoso.");
      await loadPedidos();

      setTimeout(() => {
      setActiveTab("lista");
      setSelectedPedido(null);
    }, 1500);
      
    } catch (err) {
      console.error("Error guardando detalle:", err);
      const status = err?.status;
      const body = err?.body;
      let msg = err?.message || "Error al actualizar pedido";
      if (status) msg += ` (status ${status})`;
      if (body) {
        const bodyMsg =
          typeof body === "string"
            ? body
            : body?.message || body?.error || JSON.stringify(body);
        msg += ` — ${bodyMsg}`;
      }

      Swal.fire({
        title: "Error al guardar",
        text: msg,
        icon: "error",
        confirmButtonText: "Cerrar",
      });

      setSaveMessage("Error al guardar: " + msg);
    } finally {
      setSaving(false);
    }
  };

  // Filtrar camiones según transportista seleccionado
  const camionesDisponibles = camiones.filter((c) => {
    const esActivo = c.estado === "activo" || c.activo === true;
    const perteneceAlTransportista = selectedPedido?.transportista_id
      ? String(c.transportista_id) === String(selectedPedido.transportista_id)
      : false;
    return esActivo && perteneceAlTransportista;
  });

  // Filtrar choferes según transportista seleccionado
  const choferesDisponibles = choferes.filter((ch) => {
    const esActivo = ch.estado === "activo" || ch.activo === true;
    const perteneceAlTransportista = selectedPedido?.transportista_id
      ? String(ch.transportista_id) === String(selectedPedido.transportista_id)
      : false;
    return esActivo && perteneceAlTransportista;
  });


//función componente lista pedidos con paginación
// Componente de paginación (agregar antes de ListaPedidosTab)
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="d-flex justify-content-center align-items-center mt-4 mb-3">
      <nav>
        <ul className="pagination mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
          </li>
          
          {getPageNumbers().map((page, index) => (
            <li
              key={index}
              className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
            >
              {page === '...' ? (
                <span className="page-link">...</span>
              ) : (
                <button
                  className="page-link"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </button>
              )}
            </li>
          ))}
          
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const ListaPedidosTab = () => {
  const { currentItems, totalPages, totalItems } = getPaginatedPedidos();

  return (
    <>
      <div className="tab-content-header mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 text-secondary" style={{ fontSize: "1.1rem" }}>
          Listado Maestro de Exportaciones
        </h5>
        <div className="acciones">
          <Button
            variant="light"
            className="btn-icon me-2 shadow-sm border"
            onClick={loadPedidos}
            title="Refrescar"
          >
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
              <tr>
                <td colSpan="8" className="text-center py-4">
                  <Spinner animation="border" size="sm" className="me-2" />{" "}
                  Cargando...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  No hay pedidos para mostrar.
                </td>
              </tr>
            ) : (
              currentItems.map((p) => {
                let cantidadPallets = 0;
                if (Array.isArray(p.od_pallets)) {
                  cantidadPallets = p.od_pallets.length;
                } else if (p.cantidad_pallets_prevista) {
                  cantidadPallets = p.cantidad_pallets_prevista;
                } else if (p.cantidad_pallets) {
                  cantidadPallets = p.cantidad_pallets;
                }

                return (
                  <tr key={p.od_id || p.id || p.odId}>
                    <td className="text-highlight">
                      {p.od_code || p.odCode || `OD-${p.od_id || p.id}`}
                    </td>
                    <td style={{ fontWeight: "500" }}>
                      {p.cliente_nombre || p.cliente}
                    </td>
                    <td>{p.destino}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {p.tipo_destino || p.tipoDestino}
                    </td>
                    <td>
                      {(
                        p.fecha_programada ||
                        p.fechaProgramada ||
                        ""
                      ).substring(0, 10)}
                    </td>
                    <td className="text-center">
                      <Badge bg="info" className="px-3 py-2">
                        {cantidadPallets}
                      </Badge>
                    </td>
                    <td className="text-center">{badgeEstado(p.estado)}</td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        className="btn-action-table me-2"
                        title="Seguimiento GPS"
                      >
                        <FaTruck size={16} />
                      </Button>
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
                );
              })
            )}
          </tbody>
        </Table>
      </div>

      {/* Componente de paginación */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <div className="mt-3 text-muted small px-2 d-flex justify-content-between align-items-center">
        <span>
          Mostrando {currentItems.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} registros
        </span>
        <span>
          Página {currentPage} de {totalPages || 1}
        </span>
      </div>
    </>
  );
};
  

  const NuevoPedidoTab = () => (
    <NuevoPedidoForm onOrderSaved={handleFormAction} onCancel={handleCancel} />
  );

  const DetallePedidoTab = () => {
    if (!selectedPedido) {
      return (
        <Card
          className="p-5 mt-3 text-center shadow-sm"
          style={{ border: "none", borderRadius: "12px" }}
        >
          <h4 className="text-citrus-dark mb-3">Detalle del Pedido</h4>
          <p className="text-muted mb-4">No hay pedido seleccionado.</p>
          <div className="d-flex justify-content-center">
            <Button
              variant="outline-secondary"
              onClick={() => setActiveTab("lista")}
            >
              Volver al Listado
            </Button>
          </div>
        </Card>
      );
      }

    return (
      <Card className="p-4 mt-3 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="text-citrus-dark mb-0">
            Detalle del Pedido{" "}
            {selectedPedido.od_code ||
              selectedPedido.odCode ||
              `OD-${selectedPedido.od_id || selectedPedido.id}`}
          </h4>
          <Badge
            bg={selectedPedido.estado === "pendiente" ? "warning" : "secondary"}
            className="px-3 py-2"
            style={{ fontSize: "1rem" }}
          >
            {selectedPedido.estado?.toUpperCase()}
          </Badge>
        </div>

        {selectedPedido.estado !== "pendiente" && (
          <Alert variant="warning" className="mb-3">
            <strong>⚠️ Solo lectura:</strong> Este pedido no está en estado
            "Pendiente" y no puede ser modificado.
          </Alert>
        )}

        {saveMessage && (
          <Alert
            variant={saveMessage.startsWith("Error") ? "danger" : "success"}
          >
            {saveMessage}
          </Alert>
        )}

        <Form>
          <h5 className="mb-3 mt-3 text-secondary">
            Datos del Cliente y Destino
          </h5>

          <Form.Group className="mb-2">
            <Form.Label>Cliente (*)</Form.Label>
            <Form.Select
              name="cliente_id"
              value={selectedPedido.cliente_id ?? ""}
              onChange={handleDetalleChange}
              disabled={selectedPedido.estado !== "pendiente"}
            >
              <option value="">(Seleccionar cliente)</option>
              {clientes.map((c) => (
                <option key={c.cliente_id || c.id} value={c.cliente_id || c.id}>
                  {c.nombre || c.cliente_nombre || c.razon_social}
                </option>
              ))}
            </Form.Select>
            {selectedPedido.cliente_nombre && !selectedPedido.cliente_id && (
              <Form.Text className="text-warning">
                Cliente actual: {selectedPedido.cliente_nombre} (seleccione del
                listado para actualizar)
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Producto (*)</Form.Label>
            <Form.Select
              name="producto_id"
              value={selectedPedido.producto_id ?? ""}
              onChange={handleDetalleChange}
              disabled={selectedPedido.estado !== "pendiente"}
            >
              <option value="">(Seleccionar producto)</option>
              {productos.map((p) => (
                <option
                  key={p.producto_id || p.id}
                  value={p.producto_id || p.id}
                >
                  {p.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Destino Final (*)</Form.Label>
            <Form.Control
              name="destino"
              value={selectedPedido.destino || ""}
              onChange={handleDetalleChange}
              disabled={selectedPedido.estado !== "pendiente"}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Tipo de Destino (*)</Form.Label>
            <Form.Select
              name="tipo_destino"
              value={
                selectedPedido.tipo_destino || selectedPedido.tipoDestino || ""
              }
              onChange={handleDetalleChange}
              disabled={selectedPedido.estado !== "pendiente"}
            >
              <option value="">(Seleccionar)</option>
              <option value="puerto">Marítimo (Puerto)</option>
              <option value="aeropuerto">Aéreo (Aeropuerto)</option>
              <option value="otra_ciudad">Terrestre (Ciudad)</option>
              <option value="regreso_planta">Regreso a Planta</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Fecha Programada (*)</Form.Label>
            <Form.Control
              type="date"
              name="fecha_programada"
              value={(selectedPedido.fecha_programada || "").substring(0, 10)}
              onChange={handleDetalleChange}
              disabled={selectedPedido.estado !== "pendiente"}
            />
          </Form.Group>

          {/* 🔥 PASO 6: TABLA DE PALLETS - Muestra asociados + disponibles */}
          {selectedPedido.producto_id &&
            selectedPedido.estado === "pendiente" && (
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
                            <th className="pallets-col-checkbox">
                              Seleccionar
                            </th>
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
                          {palletsDisponibles.map((pallet) => {
                            // 🔥 PASO 6: Identificar si es un pallet ya asociado
                            const estaAsociado = pallet.origen === 'asociado';
                            const estaSeleccionado = selectedPedido.palletsIds?.includes(pallet.pallet_id);
                            
                            return (
                              <tr 
                                key={pallet.pallet_id}
                                className={estaAsociado ? 'table-success' : ''}
                              >
                                <td className="text-center align-middle">
                                  <Form.Check
                                    type="checkbox"
                                    checked={estaSeleccionado}
                                    onChange={(e) =>
                                      handlePalletCheck(pallet, e.target.checked)
                                    }
                                  />
                                  {estaAsociado && (
                                    <Badge bg="success" className="ms-2 mt-1">
                                      Asociado
                                    </Badge>
                                  )}
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
                                    {parseFloat(pallet.peso_total || 0).toFixed(
                                      2
                                    )}
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
                                  <Badge 
                                    bg={estaAsociado ? "warning" : "success"} 
                                    className="px-3 py-2"
                                  >
                                    {pallet.estado}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                    <div className="pallets-disponibles-footer d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                      <div className="text-muted">
                        <strong>Total disponibles:</strong>{" "}
                        {palletsDisponibles.filter(p => p.origen === 'disponible').length} pallet(s) |{" "}
                        <strong>Ya asociados:</strong>{" "}
                        {palletsDisponibles.filter(p => p.origen === 'asociado').length} pallet(s)
                      </div>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleAgregarPallets}
                        disabled={palletsSeleccionados.length === 0}
                      >
                        Agregar Pallets Seleccionados (
                        {palletsSeleccionados.length})
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}

          <h5 className="mb-3 mt-3 text-secondary">
            Asignación Logística (Opcional)
          </h5>

          <Form.Group className="mb-2">
            <Form.Label>Transportista</Form.Label>
            <Form.Select
              name="transportista_id"
              value={selectedPedido.transportista_id ?? ""}
              onChange={handleDetalleChange}
              disabled={selectedPedido.estado !== "pendiente"}
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
            </Form.Select>
          </Form.Group>

          {selectedPedido.transportista_id && (
            <>
              <Form.Group className="mb-2">
                <Form.Label>Camión</Form.Label>
                <Form.Select
                  name="camion_id"
                  value={selectedPedido.camion_id ?? ""}
                  onChange={handleDetalleChange}
                  disabled={selectedPedido.estado !== "pendiente"}
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
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Chofer</Form.Label>
                <Form.Select
                  name="chofer_id"
                  value={selectedPedido.chofer_id ?? ""}
                  onChange={handleDetalleChange}
                  disabled={selectedPedido.estado !== "pendiente"}
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
                </Form.Select>
              </Form.Group>
            </>
          )}

          <Form.Group className="mb-2">
            <Form.Label>Temperatura Consigne (°C)</Form.Label>
            <Form.Control
              type="number"
              step="0.1"
              name="temperatura_consigne"
              value={selectedPedido.temperatura_consigne ?? ""}
              onChange={handleDetalleChange}
              disabled={selectedPedido.estado !== "pendiente"}
            />
          </Form.Group>

          <h5 className="mb-3 mt-3 text-secondary">
            Pallets Asociados al Pedido (*) -{" "}
            {selectedPedido.palletsIds?.length || 0}
          </h5>

          <Form.Group className="mb-3">
            <div
              className="pallet-list-box p-3 border rounded bg-light"
              style={{ minHeight: "100px" }}
            >
              {selectedPedido.palletsIds && selectedPedido.palletsIds.length ? (
                <div>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedPedido.palletsIds.map((id, idx) => (
                      <Badge
                        key={idx}
                        bg="success"
                        className="d-flex align-items-center gap-2"
                        style={{
                          padding: "8px 12px",
                          fontSize: "0.9rem",
                        }}
                      >
                        <span>{id}</span>
                        {selectedPedido.estado === "pendiente" && (
                          <FaTrash
                            style={{
                              cursor: "pointer",
                              color: "white",
                              fontSize: "0.85rem",
                            }}
                            onClick={() => handleRemovePallet(id)}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                  <p className="m-0 mt-3 text-primary fw-bold">
                    Total de Pallets: {selectedPedido.palletsIds.length}
                  </p>
                </div>
              ) : (
                <div className="text-muted">
                  Aún no se han asociado pallets. Debe agregar al menos uno.
                </div>
              )}
            </div>
            {selectedPedido.estado === "pendiente" && (
              <div style={{ marginTop: 8 }}>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAddPallet}
                  disabled={selectedPedido.estado !== "pendiente"}
                >
                  <FaPlusCircle className="me-1" /> Añadir Pallet Manual
                </Button>
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Observaciones</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="observaciones"
              value={selectedPedido.observaciones || ""}
              onChange={handleDetalleChange}
              disabled={selectedPedido.estado !== "pendiente"}
            />
          </Form.Group>

          <div className="d-flex justify-content-center gap-2">
            <Button variant="secondary" onClick={() => setActiveTab("lista")}>
              Volver
            </Button>

            {selectedPedido.estado === "pendiente" && (
              <>
                <Button
                  variant="warning"
                  onClick={handleClearDetalle}
                  style={{
                    background: "#fff7d6",
                    color: "#7a5b00",
                    border: "1px solid #f0c36d",
                  }}
                >
                  Limpiar
                </Button>

                <Button
                  variant="success"
                  onClick={handleSaveDetalle}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </>
            )}
          </div>
        </Form>
      </Card>
    );
  };

  return (
    <div className="gestion-pedidos-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
        }}
      >
        <div style={{ flex: 1 }}>
          <h2>Gestión de Pedidos / Exportaciones</h2>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center" }}
              className="search-bar"
            >
              <div className="search-input-group">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Buscar pedido, cliente..."
                  name="busqueda"
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <Button variant="outline-success" className="btn-filter-icon me-2">
              <FaFilter /> Filtros
            </Button>

            <Button
              variant="success"
              className="btn-new-op"
              onClick={() => setActiveTab("nuevo")}
            >
              <FaPlus className="me-2" /> Nuevo Pedido
            </Button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Card
            className="metric-card text-center p-2"
            style={{ minWidth: 140 }}
          >
            <h3 className="text-success-dark">{metrics.activos}</h3>
            <p className="text-secondary">Pedidos Activos</p>
          </Card>
          <Card
            className="metric-card text-center p-2"
            style={{ minWidth: 140 }}
          >
            <h3 className="text-warning-dark">{metrics.pendientes}</h3>
            <p className="text-secondary">Pendientes</p>
          </Card>
          <Card
            className="metric-card text-center p-2"
            style={{ minWidth: 140 }}
          >
            <h3 className="text-info-dark">{metrics.enTransito}</h3>
            <p className="text-secondary">En Tránsito</p>
          </Card>
          <Card
            className="metric-card text-center p-2"
            style={{ minWidth: 140 }}
          >
            <h3 className="text-secondary-dark">{metrics.exportados}</h3>
            <p className="text-secondary">Exportados</p>
          </Card>
          {metrics.rechazados > 0 && (
            <Card
              className="metric-card text-center p-2"
              style={{ minWidth: 140, borderLeft: "4px solid #c2185b" }}
            >
              <h3 style={{ color: "#c2185b" }}>{metrics.rechazados}</h3>
              <p className="text-secondary">Rechazados</p>
            </Card>
          )}
        </div>
      </div>

      <div
        className="inline-filters-row mt-3"
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Form.Select
          name="estado"
          onChange={handleFilterChange}
          className="filter-select"
          style={{ width: 160 }}
        >
          <option value="">Estado: Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_ruta">En Tránsito</option>
          <option value="entregado">Exportado</option>
          <option value="rechazado">Rechazado</option>
          <option value="cancelado">Cancelado</option>
        </Form.Select>

        <Form.Control
          as="select"
          name="cliente"
          onChange={handleFilterChange}
          className="filter-select"
          style={{ width: 200 }}
        >
          <option value="">Cliente</option>
        </Form.Control>

        <Form.Select
          name="transporte"
          onChange={handleFilterChange}
          className="filter-select"
          style={{ width: 160 }}
        >
          <option value="">Transporte</option>
          <option value="marítimo">Marítimo</option>
          <option value="aéreo">Aéreo</option>
          <option value="terrestre">Terrestre</option>
        </Form.Select>

        <Form.Control
          type="date"
          name="fecha"
          onChange={handleFilterChange}
          className="filter-date"
          style={{ width: 160 }}
        />
      </div>

      <div className="tabs-navigation mt-3">
        <button
          className={activeTab === "lista" ? "tab-active" : ""}
          onClick={() => setActiveTab("lista")}
        >
          Lista de Pedidos
        </button>
        <button
          className={activeTab === "nuevo" ? "tab-active" : ""}
          onClick={() => setActiveTab("nuevo")}
        >
          Nuevo Pedido
        </button>
        <button
          className={activeTab === "detalle" ? "tab-active" : ""}
          onClick={() => setActiveTab("detalle")}
        >
          Detalle del Pedido
        </button>
      </div>

      <div
        className="tab-content-container"
        style={{ background: "transparent", boxShadow: "none", padding: 0 }}
      >
        {activeTab === "lista" && <ListaPedidosTab />}
        {activeTab === "nuevo" && <NuevoPedidoTab />}
        {activeTab === "detalle" && <DetallePedidoTab />}
      </div>
    </div>
  );
};

export default GestionPedidos;