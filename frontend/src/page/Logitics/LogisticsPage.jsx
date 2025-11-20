// src/components/Logistica/Logistica.jsx
import React, { useEffect, useState } from "react";
import "../../style/logistica.css";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:4000";

const Logistica = () => {
  const [camiones, setCamiones] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [ordenes, setOrdenes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI: pestañas
  const [tab, setTab] = useState("camiones"); // 'camiones' | 'choferes' | 'control' | 'operaciones'

  // Filtros (quitamos filtroEstado porque no se usa)
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState("Todas");

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // normalizeResponse: devuelve siempre un array a partir de varias formas posibles de respuesta
  const normalizeResponse = (respData) => {
    if (!respData && respData !== 0) return [];
    if (Array.isArray(respData)) return respData;
    if (respData && Array.isArray(respData.data)) return respData.data;
    if (respData && Array.isArray(respData.items)) return respData.items;
    if (respData && Array.isArray(respData.results)) return respData.results;
    if (respData && Array.isArray(respData.ordenes)) return respData.ordenes;
    if (typeof respData === "object") {
      const keys = Object.keys(respData || {});
      for (let k of keys) {
        if (Array.isArray(respData[k])) return respData[k];
      }
    }
    return [];
  };

  const safeArray = (a) => (Array.isArray(a) ? a : []);

  // mapOrderFields: normaliza distintos nombres de campos que pueda devolver el backend
  const mapOrderFields = (o) => {
    const orden_id = o.orden_id ?? o.od_id ?? o.id ?? null;
    const od_code = o.od_code ?? o.code ?? o.orden_code ?? null;
    const cliente_nombre = o.cliente_nombre ?? o.cliente ?? o.cliente_name ?? null;
    const transportista_nombre = o.transportista_nombre ?? o.transportista ?? o.transportista_name ?? null;
    const patente = o.patente ?? o.patent ?? o.camion_patente ?? o.patent_plate ?? null;

    return {
      ...o,
      orden_id,
      od_code,
      cliente_nombre,
      transportista_nombre,
      patente
    };
  };

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resCamiones, resTransp, resChoferes, resOD] = await Promise.all([
        axios.get("/api/camiones"),
        axios.get("/api/transportistas"),
        axios.get("/api/choferes"),
        axios.get("/api/ordenes-despacho"),
      ]);

      // logs para depuración (puedes quitar cuando todo esté ok)
      console.log("resCamiones.data ->", resCamiones.data);
      console.log("resTransp.data ->", resTransp.data);
      console.log("resChoferes.data ->", resChoferes.data);
      console.log("resOD.data ->", resOD.data);

      const camionesArr = normalizeResponse(resCamiones.data);
      const transpArr = normalizeResponse(resTransp.data);
      const choferesArr = normalizeResponse(resChoferes.data);
      const ordenesRaw = normalizeResponse(resOD.data);
      const ordenesArr = safeArray(ordenesRaw).map(mapOrderFields);

      setCamiones(camionesArr);
      setTransportistas(transpArr);
      setChoferes(choferesArr);
      setOrdenes(ordenesArr);
    } catch (err) {
      console.error("Error cargando datos", err);
      setError("Error cargando datos. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const kpiCamiones = safeArray(camiones).length;
  const kpiChoferes = safeArray(choferes).length;
  const kpiViajes = safeArray(ordenes).filter(
    (o) => o && (o.estado === "en_carga" || o.estado === "en_ruta")
  ).length;
  // mantenimientos sigue siendo un KPI: cuenta camiones sin ultima_desinfeccion
  const kpiMantenimiento = safeArray(camiones).filter((c) => !c.ultima_desinfeccion).length;

  // filtros sobre camiones
  const camionesFiltrados = safeArray(camiones).filter((c) => {
    const empresaNombre = safeArray(transportistas).find((t) => t.transportista_id === c.transportista_id)?.nombre || "N/A";
    return (
      (filtroTipo === "Todos" || c.tipo_camion === filtroTipo) &&
      (filtroEmpresa === "Todas" || empresaNombre === filtroEmpresa)
    );
  });

  // choferes ordenados
  const choferesOrdenados = safeArray(choferes).sort((a, b) =>
    (a.nombre || "").localeCompare(b.nombre || "")
  );

  // operaciones activas
  const operacionesActivas = safeArray(ordenes).filter(
    (o) => o && (o.estado === "en_carga" || o.estado === "en_ruta")
  );

  // cálculo días restantes de forma defensiva
  const diasRestantes = (fecha) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return null;
    const hoy = new Date();
    // normalizar horas para contar días completos
    const dNorm = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const hoyNorm = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const diff = Math.ceil((dNorm - hoyNorm) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // determina clase de fila según vencimiento
  const getChoferRowClass = (vencimiento) => {
    if (!vencimiento) return "";
    const dias = diasRestantes(vencimiento);
    if (dias === null) return "";
    if (dias < 0) return "chofer-expired";
    if (dias <= 90) return "chofer-soon";
    return "chofer-ok";
  };

  return (
    <div className="logi-container">
      {loading && <div className="logi-loading"><p>Cargando datos...</p></div>}
      {error && <div className="logi-error"><p>{error}</p></div>}

      {/* KPIs */}
      <div className="logi-kpi-container">
        <div className="logi-kpi-card"><h3>{kpiCamiones}</h3><p>Camiones Activos</p></div>
        <div className="logi-kpi-card"><h3>{kpiChoferes}</h3><p>Choferes Disponibles</p></div>
        <div className="logi-kpi-card"><h3>{kpiViajes}</h3><p>Viajes en Curso</p></div>
        <div className="logi-kpi-card"><h3>{kpiMantenimiento}</h3><p>Camiones sin Mantenimiento</p></div>
      </div>

      {/* Tabs */}
      <div className="logi-tabs" style={{ marginTop: 12 }}>
        <button className={tab === "camiones" ? "logi-tab-active" : ""} onClick={() => setTab("camiones")}>Camiones</button>
        <button className={tab === "choferes" ? "logi-tab-active" : ""} onClick={() => setTab("choferes")}>Choferes</button>
        <button className={tab === "control" ? "logi-tab-active" : ""} onClick={() => setTab("control")}>Control de Ordenes</button>
        <button className={tab === "operaciones" ? "logi-tab-active" : ""} onClick={() => setTab("operaciones")}>Operaciones Activas</button>
      </div>

      {/* Filters (solo para camiones) - QUITÉ el tercer select que no filtraba */}
      {tab === "camiones" && (
        <div className="logi-filter-box" style={{ marginTop: 12 }}>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option>Todos</option>
            <option>frigorifico</option>
            <option>semi</option>
            <option>chasis</option>
          </select>

          <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)}>
            <option>Todas</option>
            {safeArray(transportistas).map((t) => (
              <option key={t.transportista_id} value={t.nombre}>{t.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {/* Contenido de la pestaña */}
      <div className="logi-content" style={{ marginTop: 12 }}>
        {/* CAMIONES */}
        {tab === "camiones" && (
          <div className="logi-table-container">
            <table className="logi-table">
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Tipo</th>
                  <th>Temp (min/max)</th>
                  <th>Transportista</th>
                  <th>Última Desinfección</th>
                </tr>
              </thead>
              <tbody>
                {camionesFiltrados.length > 0 ? camionesFiltrados.map((c) => {
                  const empresa = safeArray(transportistas).find(t => t.transportista_id === c.transportista_id);
                  return (
                    <tr key={c.camion_id || c.patente}>
                      <td>{c.patente}</td>
                      <td>{c.tipo_camion}</td>
                      <td>{c.temp_min ?? "—"} / {c.temp_max ?? "—"} °C</td>
                      <td>{empresa ? empresa.nombre : "N/A"}</td>
                      <td>{c.ultima_desinfeccion || "Sin registro"}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="5">Sin datos disponibles</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* CHOFERES */}
        {tab === "choferes" && (
          <div className="logi-table-container">
            <table className="logi-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Teléfono</th>
                  <th>Licencia Cat.</th>
                  <th>Vencimiento</th>
                  <th>Faltan</th>
                </tr>
              </thead>
              <tbody>
                {choferesOrdenados.length > 0 ? choferesOrdenados.map(ch => {
                  const dias = diasRestantes(ch.licencia_vencimiento);
                  const clase = getChoferRowClass(ch.licencia_vencimiento);

                  return (
                    <tr key={ch.chofer_id || ch.dni} className={clase}>
                      <td>{ch.nombre}</td>
                      <td>{ch.dni || "—"}</td>
                      <td>{ch.telefono || "—"}</td>
                      <td>{ch.licencia_categoria || "—"}</td>
                      <td>{ch.licencia_vencimiento ? new Date(ch.licencia_vencimiento).toLocaleDateString() : "—"}</td>
                      <td>{dias !== null ? `${dias} días` : "—"}</td>
                    </tr>
                  );
                }) : <tr><td colSpan="6">Sin datos disponibles</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* CONTROL */}
        {tab === "control" && (
          <div className="logi-control">
            <h4>Control de Ordenes</h4>
            <p>Total órdenes: {safeArray(ordenes).length}</p>
            <div className="logi-table-container">
              <table className="logi-table">
                <thead>
                  <tr><th>Orden</th><th>Cliente</th><th>Transportista</th><th>Camión</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {safeArray(ordenes).length > 0 ? safeArray(ordenes).map(o => (
                    <tr key={o.orden_id || o.od_id || o.id}>
                      <td>{o.od_code ?? o.orden_id ?? o.od_id}</td>
                      <td>{o.cliente_nombre ?? o.cliente ?? o.cliente_id ?? "—"}</td>
                      <td>{o.transportista_nombre ?? o.transportista ?? o.transportista_id ?? "—"}</td>
                      <td>{o.patente ?? o.camion_id ?? "—"}</td>
                      <td>{o.estado ?? "—"}</td>
                    </tr>
                  )) : <tr><td colSpan="5">Sin datos disponibles</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OPERACIONES */}
        {tab === "operaciones" && (
          <div className="logi-operaciones">
            <h4>Operaciones Activas ({operacionesActivas.length})</h4>
            <div className="logi-table-container">
              <table className="logi-table">
                <thead>
                  <tr><th>Orden</th><th>Cliente</th><th>Transportista</th><th>Patente</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {operacionesActivas.length > 0 ? operacionesActivas.map(o => (
                    <tr key={o.orden_id || o.od_id || o.id}>
                      <td>{o.od_code ?? o.orden_id ?? o.od_id}</td>
                      <td>{o.cliente_nombre ?? o.cliente ?? "—"}</td>
                      <td>{o.transportista_nombre ?? o.transportista ?? "—"}</td>
                      <td>{o.patente ?? "—"}</td>
                      <td>{o.estado}</td>
                    </tr>
                  )) : <tr><td colSpan="5">No hay operaciones activas</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Logistica;