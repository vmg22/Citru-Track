import axios from 'axios';

// ---------------- CORRECCIÓN AQUÍ ----------------
// Usamos import.meta.env.VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
// -------------------------------------------------

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ------------------------------------------------------------------
// INTERCEPTORES (Logueo y Manejo de Errores)
// ------------------------------------------------------------------
axiosInstance.interceptors.request.use(
  (config) => {
    // Opcional: Si tienes token, inyectalo aquí
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    
    console.log(`📤 [REQUEST] ${config.method.toUpperCase()} ${config.url}`, config.params || '');
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`📥 [RESPONSE] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error(`❌ ERROR DE CONEXIÓN: No se puede alcanzar ${API_URL}`);
      // Aquí podrías disparar una alerta global o toast
    } else if (error.response) {
      // El servidor respondió con un código de error (4xx, 5xx)
      console.error('❌ Error Servidor:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error Desconocido:', error.message);
    }
    return Promise.reject(error);
  }
);

// ------------------------------------------------------------------
// SERVICIOS
// ------------------------------------------------------------------

/**
 * Obtener lotes por producto
 * GET /lotes/por-producto/:productoId
 */
export const obtenerLotesPorProducto = async (productoId) => {
  try {
    const response = await axiosInstance.get(`/lotes/por-producto/${productoId}`);
    return response.data.success ? (response.data.lotes || []) : [];
  } catch (error) {
    console.error('Error en obtenerLotesPorProducto:', error);
    return [];
  }
};

/**
 * Obtener sublotes por lote
 * GET /lotes/:loteId/sublotes
 */
export const obtenerSublotesPorLote = async (loteId) => {
  try {
    const response = await axiosInstance.get(`/lotes/${loteId}/sublotes`);
    return response.data.success ? (response.data.sublotes || []) : [];
  } catch (error) {
    console.error('Error en obtenerSublotesPorLote:', error);
    return [];
  }
};

/**
 * Obtener cajas disponibles con filtros
 * GET /pallets/cajas-disponibles
 * CORREGIDO: Usamos 'params' de axios directamente
 */
export const getCajasDisponibles = async (filtros) => {
  try {
    // Axios se encarga de convertir este objeto a query string (?producto_id=1&...)
    // y filtra automáticamente los valores undefined/null si limpiamos el objeto antes
    const params = {};
    if (filtros.producto_id) params.producto_id = filtros.producto_id;
    if (filtros.lote_id) params.lote_id = filtros.lote_id;
    if (filtros.sublote_id) params.sublote_id = filtros.sublote_id;

    const response = await axiosInstance.get('/pallets/cajas-disponibles', { params });
    
    // Asumimos que response.data devuelve { success: true, cajas: [...] }
    return response.data; 
  } catch (error) {
    console.error('Error obteniendo cajas:', error);
    return { success: false, cajas: [], error: error.message };
  }
};

/**
 * Crear pallet con cajas seleccionadas
 * POST /pallets/crear-con-cajas
 */
export const crearPalletConCajas = async (dataPallet) => {
  try {
    // Validaciones básicas antes de llamar a la API
    if (!dataPallet.producto_id) throw new Error('Falta el ID del producto');
    if (!dataPallet.cajas_ids?.length) throw new Error('Seleccione al menos una caja');

    const response = await axiosInstance.post('/pallets/crear-con-cajas', dataPallet);
    return response.data;
  } catch (error) {
    // Relanzamos el error para que el componente (UI) pueda mostrar el mensaje
    throw error.response?.data?.message || error.message || 'Error al crear pallet';
  }
};

/**
 * Generar QR
 * GET /pallets/:palletId/qr
 */
export const generarQRPallet = async (palletId, format = 'dataURL') => {
  try {
    const response = await axiosInstance.get(`/pallets/${palletId}/qr`, {
      params: { format }
    });
    return response.data;
  } catch (error) {
    console.error('Error generando QR:', error);
    throw error;
  }
};

/**
 * Obtener Detalle de Pallet
 * GET /pallets/:palletId
 */
export const obtenerPalletDetalle = async (palletId) => {
  try {
    const response = await axiosInstance.get(`/pallets/${palletId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) throw new Error('Pallet no encontrado');
    throw error;
  }
};

export const verificarConexion = async () => {
  try {
    await axiosInstance.get('/test'); // Asume que tienes un endpoint /test o /health
    return true;
  } catch (e) {
    return false;
  }
};

const palletService = {
  obtenerLotesPorProducto,
  obtenerSublotesPorLote,
  getCajasDisponibles,
  crearPalletConCajas,
  generarQRPallet,
  obtenerPalletDetalle,
  verificarConexion
};

export default palletService;