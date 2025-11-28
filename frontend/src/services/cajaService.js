import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptores para logging
axiosInstance.interceptors.request.use(
  (config) => {
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
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error(`❌ ERROR DE CONEXIÓN: No se puede alcanzar ${API_URL}`);
    } else if (error.response) {
      console.error('❌ Error Servidor:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error Desconocido:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Registrar una caja mediante escáner QR
 * POST /api/cajas/ingresar
 */
export const ingresarCaja = async (datoCaja) => {
  try {
    const response = await axiosInstance.post('/cajas/ingresar', datoCaja);
    return response.data;
  } catch (error) {
    console.error('Error al ingresar caja:', error);
    throw error;
  }
};

/**
 * Obtener cajas recientes
 * GET /api/cajas/recientes
 */
export const obtenerCajasRecientes = async (limit = 10) => {
  try {
    const response = await axiosInstance.get('/cajas/recientes', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener cajas recientes:', error);
    throw error;
  }
};

/**
 * Generar código QR visual para una caja
 * GET /api/cajas/:caja_id/qr
 * @param {string} cajaId - ID de la caja
 * @param {string} format - Formato del QR: 'png', 'svg', 'dataURL' (default: 'dataURL')
 */
export const generarQRCaja = async (cajaId, format = 'dataURL') => {
  try {
    const response = await axiosInstance.get(`/cajas/${cajaId}/qr`, {
      params: { format }
    });
    return response.data;
  } catch (error) {
    console.error('Error generando QR de caja:', error);
    throw error;
  }
};

const cajaService = {
  ingresarCaja,
  obtenerCajasRecientes,
  generarQRCaja
};

export default cajaService;
