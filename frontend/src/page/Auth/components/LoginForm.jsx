import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const loading = useAuthStore((state) => state.loading);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await login(email, password);

    if (success) {
      navigate("/");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(224, 224, 224, 0.4)",
        padding: "40px",
        borderRadius: "16px",
        width: "400px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ marginBottom: "30px" }}>
        <img
          src="/logo_citrustrack.png"
          alt="CitrusTrack Logo"
          style={{
            width: "100px",
            height: "100px",
            backgroundColor: "#FFFFFF",
            borderRadius: "10px",
            padding: "10px",
            marginBottom: "15px",
          }}
        />
        <div
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#333",
            margin: "0",
          }}
        >
          CitrusTrack
        </div>
        <div style={{ fontSize: "16px", color: "#666", margin: "0" }}>
          Gestión Industrial Citrícola
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {error && (
          <div
            style={{
              color: "#d32f2f",
              backgroundColor: "#ffebee",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            padding: "12px 15px",
            gap: "10px",
          }}
        >
          <span style={{ color: "#888", display: "flex" }}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z" />
            </svg>
          </span>
          <input
            type="email"
            placeholder="Ingresa tu usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              flexGrow: 1,
              fontSize: "16px",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            padding: "12px 15px",
            gap: "10px",
          }}
        >
          <span style={{ color: "#888", display: "flex" }}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8h-1V6c0-2.8-2.2-5-5-5S6 3.2 6 6v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8 6c0-1.7 1.3-3 3-3s3 1.3 3 3v2H8V6zm9 14H5V10h12v10z" />
            </svg>
          </span>
          <input
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              flexGrow: 1,
              fontSize: "16px",
            }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#BDBDBD" : "#6FBF47",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "14px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "10px",
            transition: "background-color 0.3s",
          }}
        >
          {loading ? "Cargando..." : "Entrar"}
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "15px",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: "#444",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              textDecoration: "underline",
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
          <button
            type="button"
            onClick={() => navigate("/register")}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: "#444",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              textDecoration: "underline",
            }}
          >
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  );
}