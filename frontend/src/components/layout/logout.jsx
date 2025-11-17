import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../page/Auth/services/authServices";

export default function Logout({ label = "Logout" }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      // 1️⃣ Llamar al backend
      try {
        await api.post("/logout");
      } catch (error) {
        console.error("Error al hacer logout en el servidor:", error);
      }

      // 2️⃣ Borrar sesión local
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      // 3️⃣ Redirigir al login
      navigate("/login", { replace: true });

      // 4️⃣ Prevenir volver hacia atrás
      window.history.pushState(null, "", "/login");

      const preventBack = () => {
        window.history.pushState(null, "", "/login");
      };

      window.addEventListener("popstate", preventBack);

      setTimeout(() => {
        window.removeEventListener("popstate", preventBack);
      }, 1200);

    } catch (error) {
      console.error("Error en logout:", error);
      localStorage.clear();
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        backgroundColor: "#6FBF47",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "12px 18px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "background-color 0.3s, opacity 0.3s",
      }}
    >
      {loading ? "Cerrando..." : label}
    </button>
  );
}
