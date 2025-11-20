import { API } from "../../../service/apiClient";
import axios from "axios"

const CAMARA_URL = `${API}/camaras`;

export const getAllCamaras = async ()=>{
    const response = await axios.get(CAMARA_URL)
    return response.data
}