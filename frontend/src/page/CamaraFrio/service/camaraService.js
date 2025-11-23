import { API } from "../../../service/apiClient";
import axios from "axios"

const CAMARA_URL = `${API}/camaras`;

export const getAllCamaras = async ()=>{
    const response = await axios.get(CAMARA_URL)
    return response.data
}

export const createCamara = async(camaraData)=>{
    const response = await axios.post(CAMARA_URL, camaraData)
    return response.data
}

export const editCamara = async(id_camara, camaraData)=>{
    const response = await axios.patch(`${CAMARA_URL}/${id_camara}`, camaraData)
    return response.data
}

export const deleteCamara = async(id_camara)=>{
    const response = await axios.put(`${CAMARA_URL}/${id_camara}`)
    return response.data
}