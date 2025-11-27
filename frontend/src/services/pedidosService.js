// src/services/pedidosService.js
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:4000";

/** safeJson para manejar respuestas vacías o HTML de error */
async function safeJson(response) {
  const text = await response.text();
  if (!text) return null;
  try { 
    return JSON.parse(text); 
  } catch { 
    return text; 
  }
}

async function handleResponse(res) {
  const body = await safeJson(res).catch(() => null);
  
  if (!res.ok) {
    // 🔍 MEJOR DIAGNÓSTICO DEL ERROR
    console.error('❌ Error Response:', {
      status: res.status,
      statusText: res.statusText,
      url: res.url,
      body: body
    });
    
    // 🔍 LOG EXPANDIDO DEL BODY
    console.error('📄 Body completo (expandido):', JSON.stringify(body, null, 2));

    // Intentar extraer mensaje de error más específico
    let errorMessage = 'Error en la operación';
    
    if (typeof body === 'object' && body !== null) {
      errorMessage = body.error || body.message || body.details || errorMessage;
      
      // Si hay detalles adicionales, mostrarlos
      if (body.details) {
        console.error('📋 Detalles del error:', body.details);
      }
      if (body.stack && import.meta.env.DEV) {
        console.error('🔧 Stack trace:', body.stack);
      }
    } else if (typeof body === 'string') {
      errorMessage = body;
    }

    const error = new Error(`${errorMessage} (HTTP ${res.status})`);
    error.status = res.status;
    error.body = body;
    error.url = res.url;
    throw error;
  }
  
  return body;
}

/**
 * GET /api/ordenes-despacho/pedidos
 */
export async function getPedidos() {
  try {
    const res = await fetch(`${API_BASE}/api/ordenes-despacho/pedidos`);
    return await handleResponse(res);
  } catch (error) {
    console.error('[getPedidos] Error:', error);
    throw error;
  }
}

/** GET /api/clientes */
export async function getClientes() {
  try {
    const res = await fetch(`${API_BASE}/api/clientes`);
    return await handleResponse(res);
  } catch (error) {
    console.error('[getClientes] Error:', error);
    throw error;
  }
}

/** GET /api/transportistas */
export async function getTransportistas() {
  try {
    const res = await fetch(`${API_BASE}/api/transportistas`);
    return await handleResponse(res);
  } catch (error) {
    console.error('[getTransportistas] Error:', error);
    throw error;
  }
}


export async function savePedido(payload) {
  try {
    // 🔧 Eliminar 'estado' si existe en el payload
    if ('estado' in payload) {
      delete payload.estado;
    }
    
    console.log('📤 [savePedido] Payload limpio:', payload);
    
    const res = await fetch(`${API_BASE}/api/ordenes-despacho/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    // 🔍 LOG del status ANTES de handleResponse
    console.log('📊 Status de respuesta:', res.status);
    console.log('📊 Status OK?:', res.ok);
    
    const result = await handleResponse(res);
    console.log('✅ [savePedido] Respuesta exitosa:', result);
    return result;
  } catch (error) {
    console.error('❌ [savePedido] Error:', error);
    throw error;
  }
}
/** 
 * PATCH /api/ordenes-despacho/pedidos/:id
 * Actualiza el pedido incluyendo los pallets asociados
 */
export async function updatePedido(id, data) {
  try {
    console.log('📤 [updatePedido] ID:', id);
    console.log('📤 [updatePedido] Payload completo:', JSON.stringify(data, null, 2));
    
    const res = await fetch(`${API_BASE}/api/ordenes-despacho/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse(res);
    console.log('✅ [updatePedido] Pedido actualizado exitosamente');
    return result;
  } catch (error) {
    console.error('❌ [updatePedido] Error completo:', {
      message: error.message,
      status: error.status,
      body: error.body,
      url: error.url
    });
    throw error;
  }
}

/** DELETE lógico /api/ordenes-despacho/pedidos/:id */
export async function deletePedido(id) {
  try {
    console.log('🗑️ [deletePedido] ID:', id);
    const res = await fetch(`${API_BASE}/api/ordenes-despacho/pedidos/${id}`, { 
      method: "DELETE" 
    });
    const result = await handleResponse(res);
    console.log('✅ [deletePedido] Eliminado exitosamente');
    return result;
  } catch (error) {
    console.error('❌ [deletePedido] Error:', error);
    throw error;
  }
}

/** GET /api/productos */
export async function getProductos() {
  try {
    const res = await fetch(`${API_BASE}/api/productos`);
    return await handleResponse(res);
  } catch (error) {
    console.error('[getProductos] Error:', error);
    throw error;
  }
}

/** GET /api/camiones */
export async function getCamiones() {
  try {
    const res = await fetch(`${API_BASE}/api/camiones`);
    return await handleResponse(res);
  } catch (error) {
    console.error('[getCamiones] Error:', error);
    throw error;
  }
}

/** GET /api/choferes */
export async function getChoferes() {
  try {
    const res = await fetch(`${API_BASE}/api/choferes`);
    return await handleResponse(res);
  } catch (error) {
    console.error('[getChoferes] Error:', error);
    throw error;
  }
}

/** GET /api/pallets?productoId=X&estado=en_camara */
export async function getPalletsByProducto(productoId) { 
  try {
    const res = await fetch(`${API_BASE}/api/pallets?productoId=${productoId}&estado=en_camara`);
    return await handleResponse(res);
  } catch (error) {
    console.error('[getPalletsByProducto] Error:', error);
    throw error;
  }
}

/** POST /api/ordenes-despacho/pedidos/:id/asociar-pallets */
export async function asociarPalletsAPedido(pedidoId, palletIds) {
  try {
    console.log('🔗 [asociarPalletsAPedido] Pedido:', pedidoId, 'Pallets:', palletIds);
    const res = await fetch(`${API_BASE}/api/ordenes-despacho/pedidos/${pedidoId}/asociar-pallets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ palletIds }),
    });
    const result = await handleResponse(res);
    console.log('✅ [asociarPalletsAPedido] Pallets asociados exitosamente');
    return result;
  } catch (error) {
    console.error('❌ [asociarPalletsAPedido] Error:', error);
    throw error;
  }
}

/** GET /api/ordenes-despacho/pedidos/:id/pallets-disponibles?productoId=X */
export async function getPalletsParaEditar(pedidoId, productoId) {
  try {
    console.log(`🔍 [getPalletsParaEditar] pedidoId: ${pedidoId}, productoId: ${productoId}`);
    const res = await fetch(
      `${API_BASE}/api/ordenes-despacho/pedidos/${pedidoId}/pallets-disponibles?productoId=${productoId}`
    );
    return await handleResponse(res);
  } catch (error) {
    console.error('[getPalletsParaEditar] Error:', error);
    throw error;
  }
}

/** GET /api/ordenes-despacho/pedidos/:id/pallets - Solo pallets asociados al pedido */
export async function getPalletsDelPedido(pedidoId) {
  try {
    console.log(`🔍 [getPalletsDelPedido] pedidoId: ${pedidoId}`);
    const res = await fetch(`${API_BASE}/api/ordenes-despacho/pedidos/${pedidoId}/pallets`);
    return await handleResponse(res);
  } catch (error) {
    console.error('[getPalletsDelPedido] Error:', error);
    throw error;
  }
}