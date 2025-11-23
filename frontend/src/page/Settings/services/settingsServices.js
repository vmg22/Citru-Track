import { API } from "../../../service/apiClient";
import axios from "axios"

const USER_URL = `${API}/usuarios`;
const TRANSPORTE_URL = `${API}/transporte`
const CHOFER_URL = `${API}/choferes`
const PRODUCTOR_URL = `${API}/productores`
const PRODUCTOS_URL = `${API}/productos`
const ROLES_URL = `${API}/roles`
const CAMIONES_URL = `${API}/camiones`

export const getAllUsers = async () => {
  const response = await axios.get(USER_URL);
  return response.data;
}

export const deleteUserById = async (id) => {
  const response = await axios.delete(`${USER_URL}/${id}`);
  return response.data;
}

export const createUser = async(userData) =>{
  const response = await axios.post(USER_URL, userData)
  return response.data;
}

export const editUser = async(id,userData) =>{
  const response = await axios.patch(`${USER_URL}/${id}`, userData) 
  return response.data;
}


export const getAllTransportes = async () => {
  const response = await axios.get(TRANSPORTE_URL);
  return response.data;
}

export const createTransportista = async (transportistaData) => {
  const response = await axios.post(TRANSPORTE_URL, transportistaData);
  return response.data;
}

export const editTransportista = async (id_transportista, transportistaData) => {
  const response = await axios.patch(`${TRANSPORTE_URL}/${id_transportista}`, transportistaData);
  return response.data;
}
export const eliminarTransportista = async (id_transportista) => {
  const response = await axios.put(`${TRANSPORTE_URL}/${id_transportista}`);
  return response.data;
}

export const createChofer = async(choferData) =>{
  const response = await axios.post(CHOFER_URL, choferData)
  return response.data;
}

export const editChofer = async(id_chofer,choferData) =>{
  const response = await axios.patch(`${CHOFER_URL}/${id_chofer}`, choferData)
  return response.data;
}

export const eliminarChofer = async(id_chofer) =>{
  const response = await axios.put(`${CHOFER_URL}/${id_chofer}`)
  return response.data;
}

export const getAllChoferes = async () => {
  const response = await axios.get(CHOFER_URL);
  return response.data;
}

export const getAllProductores = async () => {
  const response = await axios.get(PRODUCTOR_URL);
  return response.data;
}

export const createProductor = async(productorData) =>{
  const response = await axios.post(PRODUCTOR_URL, productorData)
  return response.data;
}

export const editProductor = async(id_productor,productorData) =>{
  const response = await axios.put(`${PRODUCTOR_URL}/${id_productor}`, productorData)
  return response.data;
}

export const eliminarProductor = async(id_productor) =>{
  const response = await axios.patch(`${PRODUCTOR_URL}/${id_productor}`)
  return response.data;
}

export const getAllProductsWithVarieties = async () => {
    const response = await axios.get(`${PRODUCTOS_URL}/all-with-varieties`);
    return response.data;
};

export const getAllRoles = async () => {
  const response = await axios.get(ROLES_URL);
  return response.data;
}

export const getAllCamiones = async () => {
  const response = await axios.get(CAMIONES_URL);
  return response.data;
}

export const createCamion = async(camionData) =>{
  const response = await axios.post(CAMIONES_URL, camionData)
  return response.data;
}

export const editCamion = async(id_camion,camionData) =>{
  const response = await axios.patch(`${CAMIONES_URL}/${id_camion}`, camionData)
  return response.data;
}

export const eliminarCamion = async(id_camion) =>{
  const response = await axios.put(`${CAMIONES_URL}/${id_camion}`)
  return response.data;
}

export const createProduct = async (productData) => {
  const response = await axios.post(PRODUCTOS_URL, productData);
  return response.data;
};


export const updateProductById = async (id, productData) => {
  const response = await axios.put(`${PRODUCTOS_URL}/${id}`, productData);
  return response.data;
};


export const deleteProductById = async (id) => {
  const response = await axios.put(`${PRODUCTOS_URL}/${id}/eliminar`);
  return response.data;
};


export const createVariedad = async (variedadData) => {
  const response = await axios.post(`${PRODUCTOS_URL}/variedad`, variedadData);
  return response.data;
};


export const deleteVariedadById = async (id) => {
  const VARIEDADES_URL = `${API}/variedades`;
  const response = await axios.delete(`${VARIEDADES_URL}/${id}`);
  return response.data;
};