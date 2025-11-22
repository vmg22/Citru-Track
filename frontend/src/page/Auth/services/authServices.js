import axios from "axios";

// URL base del backend
const API_URL = "http://localhost:4000/api/auth";

// Instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== LOGIN ====================
export const loginRequest = async (email, password) => {
  try {
    const response = await api.post("/login", { email, password });

    if (response.data.exito) {
      return {
        token: response.data.datos.token,
        user: response.data.datos.usuario,
      };
    } else {
      throw new Error(response.data.mensaje);
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.mensaje);
    }
    throw new Error("Error de conexión con el servidor");
  }
};

// ==================== SOLICITAR RESET ====================
export const forgotPasswordRequest = async (email) => {
  try {
    const response = await api.post("/solicitar-reset", {
      email_usuario: email,
    });

    if (response.data.exito) {
      return response.data;
    } else {
      throw new Error(response.data.mensaje);
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.mensaje);
    }
    throw new Error("Error de conexión con el servidor");
  }
};

// ==================== RESET PASSWORD ====================
export const resetPasswordRequest = async (token, newPassword) => {
  try {
    const response = await api.post("/reset-password", {
      token,
      newPassword,
    });

    if (response.data.exito) {
      return response.data;
    } else {
      throw new Error(response.data.mensaje);
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.mensaje);
    }
    throw new Error("Error de conexión con el servidor");
  }
};

// ==================== VALIDAR TOKEN ====================
export const validateResetToken = async (token) => {
  try {
    const response = await api.get(`/validar-token-reset/${token}`);

    if (response.data.exito) {
      return response.data.datos;
    } else {
      throw new Error(response.data.mensaje);
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.mensaje);
    }
    throw new Error("Error de conexión con el servidor");
  }
};

// ==================== PERFIL ====================
export const getProfile = async () => {
  try {
    const response = await api.get("/me");
    if (response.data.exito) return response.data.datos;

    throw new Error(response.data.mensaje);
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.mensaje);
    }
    throw new Error("Error de conexión con el servidor");
  }
};

// ==================== LOGOUT ====================
export const logoutRequest = async () => {
  try {
    const response = await api.post("/logout");
    return response.data;
  } catch {
    return { exito: true };
  }
};

// ==================== CAMBIAR PASSWORD AUTH ====================
export const changePasswordRequest = async (currentPassword, newPassword) => {
  try {
    const response = await api.post("/cambiar-password", {
      currentPassword,
      newPassword,
    });

    if (response.data.exito) {
      return response.data;
    } else {
      throw new Error(response.data.mensaje);
    }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.mensaje);
    }
    throw new Error("Error de conexión con el servidor");
  }
};

export default api;
