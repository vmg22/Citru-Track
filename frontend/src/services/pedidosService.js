// src/services/pedidosService.js
const API_BASE = import.meta.env.VITE_API || "http://localhost:4000";

/** safeJson para manejar respuestas vacías o HTML de error */
async function safeJson(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); }
  catch { return text; }
}

/**
 * GET /api/ordenes-despacho/pedidos
 * Devuelve la lista de órdenes/pedidos
 */
export async function getPedidos() {
  const res = await fetch(`${API_BASE}/api/ordenes-despacho/pedidos`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await safeJson(res);
}

/** GET /api/clientes */
export async function getClientes() {
  const res = await fetch(`${API_BASE}/api/clientes`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await safeJson(res);
}

/** GET /api/transportistas */
export async function getTransportistas() {
  const res = await fetch(`${API_BASE}/api/transportistas`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await safeJson(res);
}

/**
 * POST /api/ordenes-despacho/pedidos
 * payload: {
 *   cliente_id,
 *   fecha_programada,
 *   destino,
 *   tipo_destino,
 *   temperatura_consigne,
 *   transportista_id,
 *   observaciones,
 *   palletsIds: [ "pallet1", "pallet2", ... ]   // opcional
 * }
 */
export async function savePedido(payload) {
  const res = await fetch(`${API_BASE}/api/ordenes-despacho/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await safeJson(res).catch(() => null);
    throw new Error(body?.error || body || `HTTP ${res.status}`);
  }

  return await safeJson(res);
}

/** PATCH /api/ordenes-despacho/pedidos/:id */
export async function updatePedido(id, data) {
  const res = await fetch(`${API_BASE}/api/ordenes-despacho/pedidos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await safeJson(res).catch(() => null);
    throw new Error(body?.error || body || `HTTP ${res.status}`);
  }
  return await safeJson(res);
}

/** DELETE lógico /api/ordenes-despacho/pedidos/:id */
export async function deletePedido(id) {
  const res = await fetch(`${API_BASE}/api/ordenes-despacho/pedidos/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await safeJson(res).catch(() => null);
    throw new Error(body?.error || body || `HTTP ${res.status}`);
  }
  return await safeJson(res);
}
