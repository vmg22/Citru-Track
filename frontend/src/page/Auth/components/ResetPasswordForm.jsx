import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetPassword = useAuthStore((state) => state.resetPassword);
  const error = useAuthStore((state) => state.error);
  const loading = useAuthStore((state) => state.loading);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const result = await resetPassword(token, password);

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  };

  if (!token) {
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
        <div
          style={{
            width: "80px",
            height: "80px",
            backgroundColor: "#f44336",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </div>
        <h2 style={{ color: "#d32f2f", marginBottom: "15px" }}>Token Inválido</h2>
        <p style={{ color: "#666", marginBottom: "25px" }}>
          El enlace de recuperación no es válido o ha expirado.
        </p>
        <button
          onClick={() => navigate("/login")}
          style={{
            backgroundColor: "#6FBF47",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "14px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Volver al Login
        </button>
      </div>
    );
  }

  if (success) {
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
        <div
          style={{
            width: "80px",
            height: "80px",
            backgroundColor: "#6FBF47",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>

        <h2 style={{ color: "#333", marginBottom: "15px" }}>
          ¡Contraseña Actualizada!
        </h2>
        <p style={{ color: "#666", marginBottom: "15px" }}>
          Tu contraseña ha sido cambiada exitosamente.
        </p>
        <p style={{ color: "#999", fontSize: "14px", marginBottom: "25px" }}>
          Serás redirigido al login en 3 segundos...
        </p>
        <button
          onClick={() => navigate("/login")}
          style={{
            backgroundColor: "#6FBF47",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "14px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Ir al Login Ahora
        </button>
      </div>
    );
  }

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
        <h2 style={{ fontSize: "28px", color: "#333", margin: "0 0 10px" }}>
          Nueva Contraseña
        </h2>
        <p style={{ fontSize: "14px", color: "#666", margin: "0" }}>
          Ingresa tu nueva contraseña
        </p>
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
              <path d="M17 8h-1V6c0-2.8-2.2-5-5-5S6 3.2 6 6v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8 6c0-1.7 1.3-3 3-3s3 1.3 3 3v2H8V6zm9 14H5V10h12v10z" />
            </svg>
          </span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nueva contraseña"
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
          <button
            onClick={() => setShowPassword(!showPassword)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#888",
              display: "flex",
              fontSize: "18px",
            }}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
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
            type={showPassword ? "text" : "password"}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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

        {password && (
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                height: "4px",
                backgroundColor: "#e0e0e0",
                borderRadius: "2px",
                overflow: "hidden",
                marginBottom: "5px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min((password.length / 12) * 100, 100)}%`,
                  backgroundColor:
                    password.length < 6
                      ? "#f44336"
                      : password.length < 10
                      ? "#ff9800"
                      : "#4caf50",
                  transition: "all 0.3s",
                }}
              />
            </div>
            <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
              {password.length < 6
                ? "Contraseña débil"
                : password.length < 10
                ? "Contraseña media"
                : "Contraseña fuerte"}
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !password || !confirmPassword}
          style={{
            backgroundColor:
              loading || !password || !confirmPassword ? "#BDBDBD" : "#6FBF47",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "14px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor:
              loading || !password || !confirmPassword
                ? "not-allowed"
                : "pointer",
            transition: "background-color 0.3s",
          }}
        >
          {loading ? "Actualizando..." : "Cambiar Contraseña"}
        </button>

        <button
          onClick={() => navigate("/login")}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            color: "#444",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            marginTop: "5px",
            textDecoration: "underline",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
