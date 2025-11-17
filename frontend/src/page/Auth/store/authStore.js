import { create } from "zustand";
import { loginRequest, forgotPasswordRequest, resetPasswordRequest } from "../services/authServices";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  // Login existente
  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const response = await loginRequest(email, password);
      const { user, token } = response;

      if (!user || !token) {
        throw new Error("Respuesta inválida del servidor");
      }

      set({
        user,
        token,
        loading: false,
        error: null,
      });

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Error al iniciar sesión";
      set({
        loading: false,
        error: errorMessage,
        user: null,
        token: null,
      });
      return false;
    }
  },

  // ✅ NUEVA: Solicitar recuperación de contraseña
  requestPasswordReset: async (email) => {
    set({ loading: true, error: null });

    try {
      await forgotPasswordRequest(email);
      
      set({
        loading: false,
        error: null,
      });

      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Error al enviar el correo";
      set({
        loading: false,
        error: errorMessage,
      });
      return false;
    }
  },

  // ✅ NUEVA: Resetear contraseña con token
  resetPassword: async (token, newPassword) => {
    set({ loading: true, error: null });

    try {
      await resetPasswordRequest(token, newPassword);
      
      set({
        loading: false,
        error: null,
      });

      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Error al cambiar la contraseña";
      set({
        loading: false,
        error: errorMessage,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },

  loadFromStorage: () => {
    try {
      const token = localStorage.getItem("token");
      const userItem = localStorage.getItem("user");

      if (token && userItem) {
        const user = JSON.parse(userItem);
        set({ token, user });
      }
    } catch (error) {
      console.error("Error al cargar usuario desde localStorage", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },
}));