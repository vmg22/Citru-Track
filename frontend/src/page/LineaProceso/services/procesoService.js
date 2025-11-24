import { API } from "../../../service/apiClient";
import axios from "axios";

const PROCESO_URL = `${API}/proceso`;
const LOTE_MAESTRO_URL = `${API}/lotes-maestros`;

// ============================================
// LÍNEA DE PROCESO
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

export const getHistorialBin = async (binId) => {
  const response = await axios.get(`${PROCESO_URL}/bins/${binId}/historial`);
  return response.data;
};

// NOTA: Esta es la función que estabas llamando mal en el componente
export const registrarProcesoBin = async (binId, procesoData) => {
  const response = await axios.post(`${PROCESO_URL}/bins/${binId}/registrar`, procesoData);
  return response.data;
};

export const getEstadisticasProceso = async () => {
  const response = await axios.get(`${PROCESO_URL}/estadisticas`);
  return response.data;
};

// ============================================
// LOTES MAESTROS
// ============================================

export const getBinsPendientesAprobar = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const response = await axios.get(`${LOTE_MAESTRO_URL}/bins-pendientes${params ? '?' + params : ''}`);
  return response.data;
};

export const aprobarBin = async (binId, calibre) => {
  const response = await axios.post(`${LOTE_MAESTRO_URL}/bins/${binId}/aprobar`, { calibre });
  return response.data;
};

export const getBinsDisponibles = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const response = await axios.get(`${LOTE_MAESTRO_URL}/bins-disponibles${params ? '?' + params : ''}`);
  return response.data;
};

export const crearLoteMaestro = async (loteData) => {
  const response = await axios.post(LOTE_MAESTRO_URL, loteData);
  return response.data;
};

export const getLotesMaestros = async (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const response = await axios.get(`${LOTE_MAESTRO_URL}${params ? '?' + params : ''}`);
  return response.data;
};

export const getDetalleLoteMaestro = async (loteId) => {
  const response = await axios.get(`${LOTE_MAESTRO_URL}/${loteId}`);
  return response.data;
};

export const agregarBinsALote = async (loteId, binsIds) => {
  const response = await axios.post(`${LOTE_MAESTRO_URL}/${loteId}/bins`, { bins: binsIds });
  return response.data;
};

export const cerrarLoteMaestro = async (loteId) => {
  const response = await axios.put(`${LOTE_MAESTRO_URL}/${loteId}/cerrar`);
  return response.data;
};

export const quitarBinDeLote = async (loteId, binId) => {
  const response = await axios.delete(`${LOTE_MAESTRO_URL}/${loteId}/bins/${binId}`);
  return response.data;
};