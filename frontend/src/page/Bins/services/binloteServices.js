import axios from 'axios';

const API = "http://localhost:4000/api";

// Configuración de axios con interceptores (opcional pero recomendado)
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
      // Token expirado o no válido
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
   * @returns {Promise} Array de productores con fincas
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
   * @returns {Promise} Array de productos con variedades
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
   * Validar si un remito ya existe en el sistema
   * @param {string} remito - Número de remito a validar
   * @returns {Promise} Objeto con {success, existe, message}
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
   * Crear un nuevo bin y generar lote automáticamente
   * @param {Object} binData - Datos del bin
   * @param {number} binData.producto_id - ID del producto
   * @param {number} binData.variedad_id - ID de la variedad (opcional)
   * @param {number} binData.productor_id - ID del productor (opcional)
   * @param {number} binData.finca_id - ID de la finca (opcional)
   * @param {string} binData.fecha_cosecha - Fecha de cosecha (YYYY-MM-DD)
   * @param {number} binData.peso_bruto - Peso bruto en kg
   * @param {string} binData.remito - Número de remito
   * @param {string} binData.observaciones - Observaciones (opcional)
   * @param {string} binData.responsable - Nombre del responsable (opcional)
   * @returns {Promise} Objeto con bin y lote creados
   */
  crearBinYLote: async (binData) => {
    try {
      const response = await api.post('/binlote', binData);
      return response.data;
    } catch (error) {
      console.error('Error creando bin y lote:', error);
      throw error;
    }
  },

  /**
   * Obtener bins recientes
   * @param {number} limit - Cantidad de bins a obtener (default: 20)
   * @returns {Promise} Array de bins recientes
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
   * @param {string} binId - ID del bin
   * @returns {Promise} Objeto con detalles del bin
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

  /**
   * Obtener todos los lotes
   * @param {Object} filtros - Filtros opcionales
   * @param {string} filtros.estado - Filtrar por estado (ingresado, en_proceso, etc)
   * @param {number} filtros.producto_id - Filtrar por producto
   * @returns {Promise} Array de lotes
   */
  getLotes: async (filtros = {}) => {
    try {
      const params = new URLSearchParams(filtros).toString();
      const response = await api.get(`/lotes${params ? '?' + params : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo lotes:', error);
      throw error;
    }
  },

  /**
   * Obtener detalles de un lote específico
   * @param {number} loteId - ID del lote
   * @returns {Promise} Objeto con detalles del lote
   */
  getLoteById: async (loteId) => {
    try {
      const response = await api.get(`/lotes/${loteId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo detalles del lote:', error);
      throw error;
    }
  },

  /**
   * Actualizar estado de un lote
   * @param {number} loteId - ID del lote
   * @param {string} nuevoEstado - Nuevo estado (ingresado, en_proceso, finalizado, etc)
   * @returns {Promise} Lote actualizado
   */
  actualizarEstadoLote: async (loteId, nuevoEstado) => {
    try {
      const response = await api.patch(`/lotes/${loteId}/estado`, {
        estado: nuevoEstado
      });
      return response.data;
    } catch (error) {
      console.error('Error actualizando estado del lote:', error);
      throw error;
    }
  },

  /**
   * Obtener bins asociados a un lote específico
   * @param {number} loteId - ID del lote
   * @returns {Promise} Array de bins del lote
   */
  getBinsPorLote: async (loteId) => {
    try {
      const response = await api.get(`/lotes/${loteId}/bins`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo bins del lote:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de bins
   * @returns {Promise} Objeto con estadísticas
   */
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