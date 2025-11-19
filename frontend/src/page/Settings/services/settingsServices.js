import { API } from "../../../service/apiClient";
import axios from "axios"

const USER_URL = `${API}/usuarios`;
const TRANSPORTE_URL = `${API}/transporte`
const CHOFER_URL = `${API}/choferes`
const PRODUCTOR_URL = `${API}/productores`

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