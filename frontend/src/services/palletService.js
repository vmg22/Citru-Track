const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Obtener cajas disponibles filtradas
 */
export const getCajasDisponibles = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filtros.producto_id) params.append('producto_id', filtros.producto_id);
    if (filtros.lote_id) params.append('lote_id', filtros.lote_id);
    if (filtros.sublote_id) params.append('sublote_id', filtros.sublote_id);

    const response = await fetch(`${API_BASE_URL}/api/pallets/cajas-disponibles?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo cajas disponibles:', error);
    throw error;
  }
};

/**
 * Crear pallet con cajas seleccionadas
 */
export const crearPalletConCajas = async (palletData) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/pallets/crear-con-cajas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(palletData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al crear pallet');
    }
    
    return data;
  } catch (error) {
    console.error('Error creando pallet:', error);
    throw error;
  }
};

/**
 * Obtener pallets filtrados
 */
export const obtenerPallets = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filtros.productoId) params.append('productoId', filtros.productoId);
    if (filtros.estado) params.append('estado', filtros.estado);

    const response = await fetch(`${API_BASE_URL}/api/pallets?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo pallets:', error);
    throw error;
  }
};

/**
 * Obtener detalle de un pallet por ID
 */
export const obtenerPalletById = async (palletId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pallets/${palletId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo pallet:', error);
    throw error;
  }
};

/**
 * Generar código QR de un pallet
 */
export const generarQRPallet = async (palletId, format = 'dataURL') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pallets/${palletId}/qr?format=${format}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (format === 'dataURL') {
      const data = await response.json();
      return data;
    } else {
      // Para PNG o SVG, retornar el blob
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error('Error generando QR:', error);
    throw error;
  }
};

/**
 * Obtener lista de productos
 */
export const obtenerProductos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/proceso/productos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    throw error;
  }
};

/**
 * Obtener lotes por producto
 */
export const obtenerLotesPorProducto = async (productoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/lotes?producto_id=${productoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo lotes:', error);
    throw error;
  }
};

/**
 * Obtener sublotes por lote
 */
export const obtenerSublotesPorLote = async (loteId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/lotes/sublotes/all?lote_id=${loteId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo sublotes:', error);
    throw error;
  }
};
