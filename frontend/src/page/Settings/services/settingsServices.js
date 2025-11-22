import { API } from "../../../service/apiClient";
import axios from "axios"

const USER_URL = `${API}/usuarios`;
const TRANSPORTE_URL = `${API}/transporte`
const CHOFER_URL = `${API}/choferes`
const PRODUCTOR_URL = `${API}/productores`
const PRODUCTOS_URL = `${API}/productos`
const ROLES_URL = `${API}/roles`

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

// settingsServices.js
export const editUser = async(id,userData) =>{
  // Usamos PUT o PATCH, según la implementación del backend. 
  // Si el backend usa 'exports.actualizarUsuario' o 'exports.actualizarUsuarioParcial', 
  // 'axios.put' o 'axios.patch' son más apropiados que 'axios.post'.
  const response = await axios.patch(`${USER_URL}/${id}`, userData) 
  return response.data;
}


export const getAllTransportes = async () => {
  const response = await axios.get(TRANSPORTE_URL);
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
export const getAllProductsWithVarieties = async () => {
    const response = await axios.get(`${PRODUCTOS_URL}/all-with-varieties`);
    return response.data;
};

export const getAllRoles = async () => {
  const response = await axios.get(ROLES_URL);
  return response.data;
}

/**
 * Crea un nuevo producto.
 * Corresponde al endpoint POST /productos
 * @param {object} productData - Datos del nuevo producto (nombre, categoria, etc.)
 */
export const createProduct = async (productData) => {
  const response = await axios.post(PRODUCTOS_URL, productData);
  return response.data;
};

/**
 * Actualiza un producto existente por su ID.
 * Corresponde al endpoint PUT /productos/:id
 * @param {number} id - ID del producto a actualizar
 * @param {object} productData - Datos actualizados del producto
 */
export const updateProductById = async (id, productData) => {
  const response = await axios.put(`${PRODUCTOS_URL}/${id}`, productData);
  return response.data;
};

/**
 * Elimina un producto por su ID.
 * Corresponde al endpoint DELETE /productos/:id
 * @param {number} id - ID del producto a eliminar
 */
export const deleteProductById = async (id) => {
  const response = await axios.delete(`${PRODUCTOS_URL}/${id}`);
  return response.data;
};

/**
 * Crea una nueva variedad para un producto.
 * Asume que el backend tiene una ruta POST /variedades que acepta {producto_id, nombre, descripcion}.
 * @param {object} variedadData - Datos de la nueva variedad ({ producto_id, nombre, descripcion, etc. })
 */
export const createVariedad = async (variedadData) => {
  // Nota: Asume que tienes una constante VARIEDADES_URL. Si no existe, úsala o defínela.
  // Por simplicidad, asumiremos una ruta /variedades. Si está bajo /productos/:id/variedades, la ruta cambia.
  const VARIEDADES_URL = `${API}/variedades`;
  const response = await axios.post(VARIEDADES_URL, variedadData);
  return response.data;
};

/**
 * Elimina una variedad por su ID.
 * Asume que el backend tiene una ruta DELETE /variedades/:id.
 * @param {number} id - ID de la variedad a eliminar
 */
export const deleteVariedadById = async (id) => {
  const VARIEDADES_URL = `${API}/variedades`;
  const response = await axios.delete(`${VARIEDADES_URL}/${id}`);
  return response.data;
};