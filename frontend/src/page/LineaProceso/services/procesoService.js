import { API } from "../../../service/apiClient";
import axios from "axios";

const PROCESO_URL = `${API}/proceso`;

// ============================================
// 1. LÍNEA DE PROCESO (OPERARIOS)
// ============================================

export const getProductosConVariedades = async () => {
  const response = await axios.get(`${PROCESO_URL}/productos`);
  return response.data;
};

export const getBinsConFiltros = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const response = await axios.get(`${PROCESO_URL}/bins${params ? '?' + params : ''}`);
  return response.data;
};

export const getProcesosPorProducto = async (productoId) => {
  const response = await axios.get(`${PROCESO_URL}/productos/${productoId}/procesos`);
  return response.data;
};

// [NUEVO] Obtener los campos dinámicos (Colores, Calibres, Pureza) para el Modal
export const getCamposClasificacion = async (productoId) => {
  const response = await axios.get(`${PROCESO_URL}/productos/${productoId}/campos-clasificacion`);
  return response.data;
};

export const getHistorialBin = async (binId) => {
  const response = await axios.get(`${PROCESO_URL}/bins/${binId}/historial`);
  return response.data;
};

// [ACTUALIZADO] Ahora soporta enviar atributos_calidad (JSON) y flag cerrar_bin
export const registrarProcesoBin = async (binId, procesoData) => {
  const response = await axios.post(`${PROCESO_URL}/bins/${binId}/registrar`, procesoData);
  return response.data;
};

export const getEstadisticasProceso = async () => {
  const response = await axios.get(`${PROCESO_URL}/estadisticas`);
  return response.data;
};

// ============================================
// 2. GESTIÓN DE LOTES (SUPERVISOR)
// ============================================

// [NUEVO] Trae los bins que el operario ya cerró y están esperando ser loteados
export const getBinsPendientesLote = async (productoId) => {
  // Envía el productoId como query param
  const response = await axios.get(`${PROCESO_URL}/bins-pendientes-lote?producto_id=${productoId}`);
  return response.data;
};

// [NUEVO] Crea un Lote Maestro a partir de un array de IDs de Bins
export const crearLote = async (loteData) => {
  // loteData = { bins_ids: [1, 2], producto_id: 5, observaciones: "..." }
  const response = await axios.post(`${PROCESO_URL}/crear-lote`, loteData);
  return response.data;
};

// --- Consultas de Lotes Existentes (Para ver listados de lotes ya creados) ---

export const getLotesMaestros = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  // Nota: Si mantienes un controller separado para ver lotes, ajusta la URL aquí.
  // Si usaste el código que te di, todo está bajo /api/proceso o podrías tener /api/lotes
  // Asumiendo que mantienes la URL base antigua para VER lotes:
  const response = await axios.get(`${API}/lotes-maestros${params ? '?' + params : ''}`);
  return response.data;
};

export const getDetalleLoteMaestro = async (loteId) => {
  const response = await axios.get(`${API}/lotes-maestros/${loteId}`);
  return response.data;
};
export const getLotesCreados = async () => {
  const response = await axios.get(`${PROCESO_URL}/lotes-creados`);
  return response.data;
};

export const getDetalleLote = async (loteId) => {
  const response = await axios.get(`${PROCESO_URL}/lotes/${loteId}/detalle`);
  return response.data;
};