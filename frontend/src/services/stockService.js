// services/stockService.js

const API_URL = import.meta.env.VITE_API || "http://localhost:4000";

const stockService = {
  /**
   * Obtener resumen completo de stock
   * @param {Object} filtros - { producto_id, fecha_desde, fecha_hasta }
   * @returns {Promise<Object>} Datos de stock agregados
   */
  getResumenStock: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();

      if (filtros.producto_id) {
        params.append("producto_id", filtros.producto_id);
      }
      if (filtros.fecha_desde) {
        params.append("fecha_desde", filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        params.append("fecha_hasta", filtros.fecha_hasta);
      }

      const queryString = params.toString();
      const url = `${API_URL}/api/stock/resumen${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener resumen de stock:", error);
      throw error;
    }
  },

  /**
   * Obtener todos los pallets con filtros
   * @param {Object} filtros - { producto_id, fecha_desde, fecha_hasta }
   * @returns {Promise<Array>} Lista de pallets
   */
  getStock: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();

      if (filtros.producto_id) {
        params.append("producto_id", filtros.producto_id);
      }
      if (filtros.fecha_desde) {
        params.append("fecha_desde", filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        params.append("fecha_hasta", filtros.fecha_hasta);
      }

      const queryString = params.toString();
      const url = `${API_URL}/api/stock${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener stock:", error);
      throw error;
    }
  },

  /**
   * Obtener stock por estado específico
   * @param {string} estado - Estado del pallet
   * @param {number} producto_id - ID del producto (opcional)
   * @returns {Promise<Array>} Lista de pallets
   */
  getStockPorEstado: async (estado, producto_id = null) => {
    try {
      const params = new URLSearchParams();
      if (producto_id) {
        params.append("producto_id", producto_id);
      }

      const queryString = params.toString();
      const url = `${API_URL}/api/stock/estado/${estado}${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener stock por estado:", error);
      throw error;
    }
  },

  /**
   * Obtener stock por producto específico
   * @param {number} producto_id - ID del producto
   * @param {Object} filtros - { estado, fecha_desde, fecha_hasta }
   * @returns {Promise<Object>} Datos de stock del producto
   */
  getStockPorProducto: async (producto_id, filtros = {}) => {
    try {
      const params = new URLSearchParams();

      if (filtros.estado) {
        params.append("estado", filtros.estado);
      }
      if (filtros.fecha_desde) {
        params.append("fecha_desde", filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        params.append("fecha_hasta", filtros.fecha_hasta);
      }

      const queryString = params.toString();
      const url = `${API_URL}/api/stock/producto/${producto_id}${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener stock por producto:", error);
      throw error;
    }
  },

  /**
   * Obtener lista de productos
   * @returns {Promise<Array>} Lista de productos
   */
  getProductos: async () => {
    try {
      const response = await fetch(`${API_URL}/api/productos`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener productos:", error);
      throw error;
    }
  },

  /**
   * Obtener alertas de stock bajo
   * @returns {Promise<Array>} Lista de alertas
   */
  getAlertas: async () => {
    try {
      const response = await fetch(`${API_URL}/api/stock/alertas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      throw error;
    }
  },

  /**
   * Obtener histórico de stock
   * @param {Object} filtros - { producto_id, dias }
   * @returns {Promise<Array>} Histórico de stock
   */
  getHistorico: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();

      if (filtros.producto_id) {
        params.append("producto_id", filtros.producto_id);
      }
      if (filtros.dias) {
        params.append("dias", filtros.dias);
      }

      const queryString = params.toString();
      const url = `${API_URL}/api/stock/historico${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener histórico:", error);
      throw error;
    }
  },
};

export default stockService;
