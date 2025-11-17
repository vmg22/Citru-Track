import axios from "axios";

// Es buena práctica tener la URL base en una variable de entorno
const API_URL = "http://localhost:4000/api/auth";

export const loginRequest = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, {
    email,
    password,
  });

  // El store espera que esto devuelva { user, token }
  return response.data; 
};