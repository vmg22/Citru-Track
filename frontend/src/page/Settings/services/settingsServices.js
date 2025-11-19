import { API } from "../../../service/apiClient";
import axios from "axios"

const USER_URL = `${API}/usuarios`;

export const getAllUsers = async () => {
  const response = await axios(USER_URL);
  return response.data;
}
