// src/page/Logitics/LogisticsPage.jsx
import React, { useEffect, useState } from "react";
import { API } from "../../service/api";
import "../../style/logistica.css";
import LogisticsMap from "./components/LogisticsMap";
import ModalEditarRechazado from "../Logitics/ModalEditarRechazado";

const Logistica = () => {
  const [camiones, setCamiones] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("mapa");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState("Todas");
  const [modalRechazado, setModalRechazado] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  
  // Estados de paginación
  const [paginaCamiones, setPaginaCamiones] = useState(1);
  const [paginaChoferes, setPaginaChoferes] = useState(1);
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [paginaOperaciones, setPaginaOperaciones] = useState(1);
  const itemsPorPagina = 10;

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const mapOrderFields = (o) => {
    return {
      ...o,
      orden_id: o.orden_id ?? o.od_id ?? o.id ?? null,
      od_code: o.od_code ?? o.code ?? o.orden_code ?? null,
      cliente_nombre: o.cliente_nombre ?? o.cliente ?? o.cliente_name ?? null,
      transportista_nombre:
        o.transportista_nombre ??
        o.transportista ??
        o.transportista_name ??
        null,
      patente:
        o.patente ?? o.patent ?? o.camion_patente ?? o.patent_plate ?? null,
    };
  };

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resCamiones, resTransp, resChoferes, resOD] = await Promise.all([
        API.get("/camiones"),
        API.get("/transportistas"),
        API.get("/choferes"),
        API.get("/ordenes-despacho"),
      ]);

      setCamiones(normalizeResponse(resCamiones.data));
      setTransportistas(normalizeResponse(resTransp.data));
      setChoferes(normalizeResponse(resChoferes.data));

      const ordenesRaw = normalizeResponse(resOD.data);
      setOrdenes(safeArray(ordenesRaw).map(mapOrderFields));
    } catch (err) {
      console.error("Error cargando datos", err);
      setError("Error cargando datos de gestión.");
    } finally {
      setLoading(false);
    }
  };

  const kpiCamiones = safeArray(camiones).length;
  const kpiChoferes = safeArray(choferes).length;
  const kpiViajes = safeArray(ordenes).filter(
    (o) => o && (o.estado === "en_carga" || o.estado === "en_ruta")
  ).length;
  const kpiMantenimiento = safeArray(camiones).filter(
    (c) => !c.ultima_desinfeccion
  ).length;

  const camionesFiltrados = safeArray(camiones).filter((c) => {
    const empresaNombre =
      safeArray(transportistas).find(
        (t) => t.transportista_id === c.transportista_id
      )?.nombre || "N/A";
    return (
      (filtroTipo === "Todos" || c.tipo_camion === filtroTipo) &&
      (filtroEmpresa === "Todas" || empresaNombre === filtroEmpresa)
    );
  });

  const choferesOrdenados = safeArray(choferes).sort((a, b) =>
    (a.nombre || "").localeCompare(b.nombre || "")
  );
  const operacionesActivas = safeArray(ordenes).filter(
    (o) =>
      o &&
      (o.estado === "en_carga" ||
        o.estado === "en_ruta" ||
        o.estado === "rechazado")
  );

  const diasRestantes = (fecha) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return null;
    const hoy = new Date();
    const dNorm = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const hoyNorm = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return Math.ceil((dNorm - hoyNorm) / (1000 * 60 * 60 * 24));
  };

  const getChoferRowClass = (vencimiento) => {
    if (!vencimiento) return "";
    const dias = diasRestantes(vencimiento);
    if (dias === null) return "";
    if (dias < 0) return "chofer-expired";
    if (dias <= 90) return "chofer-soon";
    return "chofer-ok";
  };

  const handleVerRechazado = (pedido) => {
    setPedidoSeleccionado(pedido);
    setModalRechazado(true);
  };

  const handleGuardarCambios = async () => {
    await cargarDatos();
  };

  // Funciones de paginación
  const paginar = (array, pagina) => {
    const inicio = (pagina - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    return array.slice(inicio, fin);
  };

  const totalPaginas = (total) => Math.ceil(total / itemsPorPagina);

  const cambiarPagina = (setPagina, nuevaPagina, maxPaginas) => {
    if (nuevaPagina >= 1 && nuevaPagina <= maxPaginas) {
      setPagina(nuevaPagina);
    }
  };

  // Datos paginados
  const camionesPaginados = paginar(camionesFiltrados, paginaCamiones);
  const choferesPaginados = paginar(choferesOrdenados, paginaChoferes);
  const historialPaginado = paginar(safeArray(ordenes), paginaHistorial);
  const operacionesPaginadas = paginar(operacionesActivas, paginaOperaciones);

  // Componente de paginador
  const Paginador = ({ paginaActual, totalPags, onCambiarPagina }) => {
    if (totalPags <= 1) return null;
    
    return (
      <div className="logi-paginador">
        <button
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          className="logi-paginador-btn"
        >
          ← Anterior
        </button>
        <span className="logi-paginador-info">
          Página {paginaActual} de {totalPags}
        </span>
        <button
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPags}
          className="logi-paginador-btn"
        >
          Siguiente →
        </button>
      </div>
    );
  };

  return (
    <div className="logi-container">
      <div className="logi-kpi-container">
        <div className="logi-kpi-card">
          <h3>{kpiCamiones}</h3>
          <p>Camiones Registrados</p>
        </div>
        <div className="logi-kpi-card">
          <h3>{kpiChoferes}</h3>
          <p>Choferes Base</p>
        </div>
        <div className="logi-kpi-card bg-blue-50">
          <h3>{kpiViajes}</h3>
          <p>Viajes Activos</p>
        </div>
        <div className="logi-kpi-card">
          <h3>{kpiMantenimiento}</h3>
          <p>Alertas Mantenimiento</p>
        </div>
      </div>

      <div className="logi-tabs">
        <button
          className={tab === "mapa" ? "logi-tab-active" : ""}
          onClick={() => setTab("mapa")}
        >
          🗺️ Mapa en Vivo
        </button>
        <button
          className={tab === "camiones" ? "logi-tab-active" : ""}
          onClick={() => setTab("camiones")}
        >
          Flota
        </button>
        <button
          className={tab === "choferes" ? "logi-tab-active" : ""}
          onClick={() => setTab("choferes")}
        >
          Choferes
        </button>
        <button
          className={tab === "control" ? "logi-tab-active" : ""}
          onClick={() => setTab("control")}
        >
          Historial Ordenes
        </button>
        <button
          className={tab === "operaciones" ? "logi-tab-active" : ""}
          onClick={() => setTab("operaciones")}
        >
          Operaciones
        </button>
      </div>

      {loading && tab !== "mapa" && (
        <div className="logi-loading">
          <p>Cargando gestión...</p>
        </div>
      )}
      {error && (
        <div className="logi-error">
          <p>{error}</p>
        </div>
      )}

      <div className="logi-content">
        {tab === "mapa" && (
          <div style={{ minHeight: "500px" }}>
            <LogisticsMap />
          </div>
        )}

        {tab === "camiones" && (
          <>
            <div className="logi-filter-box">
              <select
                value={filtroTipo}
                onChange={(e) => {
                  setFiltroTipo(e.target.value);
                  setPaginaCamiones(1);
                }}
              >
                <option>Todos</option>
                <option>frigorifico</option>
                <option>semi</option>
                <option>chasis</option>
              </select>
              <select
                value={filtroEmpresa}
                onChange={(e) => {
                  setFiltroEmpresa(e.target.value);
                  setPaginaCamiones(1);
                }}
              >
                <option>Todas</option>
                {safeArray(transportistas).map((t) => (
                  <option key={t.transportista_id} value={t.nombre}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="logi-table-container">
              <table className="logi-table">
                <thead>
                  <tr>
                    <th>Patente</th>
                    <th>Tipo</th>
                    <th>Temp (min/max)</th>
                    <th>Transportista</th>
                    <th>Desinfección</th>
                  </tr>
                </thead>
                <tbody>
                  {camionesPaginados.map((c) => {
                    const empresa = safeArray(transportistas).find(
                      (t) => t.transportista_id === c.transportista_id
                    );
                    return (
                      <tr key={c.camion_id || c.patente}>
                        <td className="font-bold">{c.patente}</td>
                        <td>{c.tipo_camion}</td>
                        <td>
                          {c.temp_min} / {c.temp_max} °C
                        </td>
                        <td>{empresa ? empresa.nombre : "N/A"}</td>
                        <td>{c.ultima_desinfeccion || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Paginador
                paginaActual={paginaCamiones}
                totalPags={totalPaginas(camionesFiltrados.length)}
                onCambiarPagina={(pag) => cambiarPagina(setPaginaCamiones, pag, totalPaginas(camionesFiltrados.length))}
              />
            </div>
          </>
        )}

        {tab === "choferes" && (
          <div className="logi-table-container">
            <table className="logi-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Licencia</th>
                  <th>Vence</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {choferesPaginados.map((ch) => {
                  const dias = diasRestantes(ch.licencia_vencimiento);
                  const clase = getChoferRowClass(ch.licencia_vencimiento);
                  return (
                    <tr key={ch.chofer_id} className={clase}>
                      <td>{ch.nombre}</td>
                      <td>{ch.telefono}</td>
                      <td>{ch.licencia_categoria}</td>
                      <td>
                        {ch.licencia_vencimiento
                          ? new Date(
                              ch.licencia_vencimiento
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        {dias < 0 ? (
                          <span className="text-red-600 font-bold">
                            VENCIDA
                          </span>
                        ) : dias <= 90 ? (
                          <span className="text-orange-500 font-bold">
                            Vence pronto
                          </span>
                        ) : (
                          "OK"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Paginador
              paginaActual={paginaChoferes}
              totalPags={totalPaginas(choferesOrdenados.length)}
              onCambiarPagina={(pag) => cambiarPagina(setPaginaChoferes, pag, totalPaginas(choferesOrdenados.length))}
            />
          </div>
        )}

        {tab === "control" && (
          <div className="logi-table-container">
            <table className="logi-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Transportista</th>
                  <th>Patente</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historialPaginado.map((o) => (
                  <tr key={o.orden_id}>
                    <td>{o.od_code}</td>
                    <td>{o.cliente_nombre}</td>
                    <td>{o.transportista_nombre}</td>
                    <td>{o.patente}</td>
                    <td>
                      <span className="px-2 py-1 rounded bg-gray-200 text-xs">
                        {o.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Paginador
              paginaActual={paginaHistorial}
              totalPags={totalPaginas(safeArray(ordenes).length)}
              onCambiarPagina={(pag) => cambiarPagina(setPaginaHistorial, pag, totalPaginas(safeArray(ordenes).length))}
            />
          </div>
        )}

        {tab === "operaciones" && (
          <div className="logi-table-container">
            <table className="logi-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Patente</th>
                  <th>Estado</th>
                  <th>Rechazado</th>
                </tr>
              </thead>
              <tbody>
                {operacionesPaginadas.map((o) => (
                  <tr key={o.orden_id}>
                    <td className="font-bold text-blue-600">{o.od_code}</td>
                    <td>{o.cliente_nombre}</td>
                    <td>{o.patente}</td>
                    <td className="text-green-600 font-bold">
                        {o.estado.toUpperCase()}
                      </td>
                      <td>
                        {o.estado === "rechazado" ? (
                          <button 
                            className="btnRechazado"
                            onClick={() => handleVerRechazado(o)}
                            title="Ver y editar pedido rechazado"
                          >
                            <i className="fa-regular fa-eye iconRechazado"></i>
                          </button>
                        ) : null}
                      </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
            <Paginador
              paginaActual={paginaOperaciones}
              totalPags={totalPaginas(operacionesActivas.length)}
              onCambiarPagina={(pag) => cambiarPagina(setPaginaOperaciones, pag, totalPaginas(operacionesActivas.length))}
            />
          </div>
        )}
      </div>

      {modalRechazado && (
        <ModalEditarRechazado
          pedido={pedidoSeleccionado}
          onClose={() => {
            setModalRechazado(false);
            setPedidoSeleccionado(null);
          }}
          onSave={handleGuardarCambios}
        />
      )}
    </div>
  );
};

export default Logistica;
