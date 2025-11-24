import { API } from '../../../service/api';

const logisticService = {
    /**
     * Obtiene la lista completa de camiones activos (en ruta o pendientes)
     * Consume el endpoint: GET /api/tracking/live
     */
    getFlotaActiva: async () => {
        try {
            const response = await API.get('/tracking/live');
            return response.data;
        } catch (error) {
            console.error("Error al obtener la flota activa:", error);
            // Retornamos un array vacío para no romper el mapa si falla la API
            return [];
        }
    },

    /**
     * (Opcional) Obtener detalle histórico de un camión específico
     * Consume el endpoint: GET /api/tracking/history/:id
     */
    getHistorialCamion: async (ordenDespachoId) => {
        try {
            const response = await API.get(`/tracking/history/${ordenDespachoId}`);
            return response.data;
        } catch (error) {
            console.error("Error al obtener historial:", error);
            throw error;
        }
    }
};

export default logisticService;