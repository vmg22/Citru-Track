import axios from "axios";

const API_URL = "http://localhost:4000/api/auth";

export const loginRequest = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, {
    email,
    password,
  });
  return response.data;
};

// ✅ NUEVO: Solicitar reset
export const forgotPasswordRequest = async (email) => {
  const response = await axios.post(`${API_URL}/forgot-password`, {
    email,
  });
  return response.data;
};

// ✅ NUEVO: Cambiar contraseña
export const resetPasswordRequest = async (token, newPassword) => {
  const response = await axios.post(`${API_URL}/reset-password`, {
    token,
    newPassword,
  });
  return response.data;
};