import axios from 'axios';

const API = "http://localhost:4000/api";

// Configuración de axios
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token JWT si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de errores global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// SERVICIOS DE BINS Y LOTES
// ============================================

const binService = {
  
  /**
   * Obtener todos los productores con sus fincas
   */
  getProductores: async () => {
    try {
      const response = await api.get('/binlote/productores');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo productores:', error);
      throw error;
    }
  },

  /**
   * Obtener todos los productos con sus variedades
   */
  getProductos: async () => {
    try {
      const response = await api.get('/binlote/productos');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  },

  /**
   * Validar si un remito ya existe
   */
  validarRemito: async (remito) => {
    try {
      const response = await api.get(`/binlote/validar-remito/${remito}`);
      return response.data;
    } catch (error) {
      console.error('Error validando remito:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo bin (SOLO RECEPCIÓN, SIN LOTE)
   * @param {Object} binData - Datos del bin
   */
  crearBin: async (binData) => {
    try {
      // Se apunta al endpoint REST estándar para bins
      const response = await api.post('/binlote', binData);
      return response.data;
    } catch (error) {
      console.error('Error creando bin:', error);
      throw error;
    }
  },

  /**
   * Obtener bins recientes
   */
  getBinsRecientes: async (limit = 20) => {
    try {
      const response = await api.get(`/binlote/recientes?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo bins recientes:', error);
      throw error;
    }
  },

  /**
   * Obtener detalles de un bin específico
   */
  getBinById: async (binId) => {
    try {
      const response = await api.get(`/binlote/${binId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo detalles del bin:', error);
      throw error;
    }
  },


  getEstadisticasBins: async () => {
    try {
      const response = await api.get('/binlote/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
};

export default binService;