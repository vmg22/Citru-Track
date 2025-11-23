// // src/services/kpiService.js
// const API_BASE = import.meta.env.VITE_API || "http://localhost:4000/api/kpi";
// const KPI_URL = import.meta.env.VITE_KPI || `${API_BASE}/kpi`;

// export async function getKPIs() {
//   const res = await fetch(KPI_URL);
//   if (!res.ok) throw new Error(`HTTP ${res.status}`);
//   return await res.json();
// }
// src/services/kpiService.js

// const API = import.meta.env.VITE_API || "http://localhost:4000";

// export async function getProductos() {
//   return fetch(`${API}/productos`).then(r => r.json());
// }

// export async function getVolume(params) {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${API}/volume?${qs}`).then(r => r.json());
// }

// export async function getRendimiento(params) {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${API}/rendimiento?${qs}`).then(r => r.json());
// }

// export async function getEmpaque(params) {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${API}/empaque?${qs}`).then(r => r.json());
// }

// export async function getCamaras(params) {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${API}/camaras?${qs}`).then(r => r.json());
// }

// export async function getDespacho(params) {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${API}/despacho?${qs}`).then(r => r.json());
// }

// export async function getMovimientos(params) {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${API}/movimientos?${qs}`).then(r => r.json());
// }

// export async function getAuditoria(params) {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${API}/auditoria?${qs}`).then(r => r.json());
// }

// src/services/kpi.service.js
// src/services/kpiService.js

const API_BASE = import.meta.env.VITE_API || "http://localhost:4000";

/** safeJson para manejar respuestas vacías o errores HTML */
async function safeJson(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); }
  catch { return text; }
}

async function get(url, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/kpi${url}${query ? `?${query}` : ""}`);

  if (!res.ok) {
    const body = await safeJson(res).catch(() => null);
    throw new Error(body?.error || body || `HTTP ${res.status}`);
  }
  return await safeJson(res);
}

const kpiService = {
  getProductos: () => get(`/productos`),

  getVolume: (params) => get(`/volume`, params),

  getRendimientoPorLote: (params) => get(`/rendimiento`, params),

  getEficienciaEmpaque: (params) => get(`/empaque`, params),

  getCamarasKPIs: (params) => get(`/camaras`, params),

  getDespachoKPIs: (params) => get(`/despacho`, params),

  getMovimientosKPIs: (params) => get(`/movimientos`, params),

  getAuditKPIs: (params) => get(`/auditoria`, params),
};

export default kpiService;