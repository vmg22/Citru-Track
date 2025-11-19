import { API } from "../../../service/apiClient";
import axios from "axios"

const USER_URL = `${API}/usuarios`;

export const getAllUsers = async () => {
  const response = await axios.get(USER_URL);
  return response.data;
}

export const deleteUserById = async (id) => {
  const response = await axios.delete(`${USER_URL}/${id}`);
  return response.data;
}